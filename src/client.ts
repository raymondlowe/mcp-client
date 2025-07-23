import { validateUrl, isValidTransport } from './utils.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export interface MCPClientOptions {
  type: string;
  url?: string;
  cmd?: string;
  quiet?: boolean;
}

export class MCPClient {
  private options: MCPClientOptions;
  private client: Client | null = null;
  private transport: StdioClientTransport | SSEClientTransport | StreamableHTTPClientTransport | null = null;

  constructor(options: MCPClientOptions) {
    this.options = options;
    this.validateOptions();
  }

  private validateOptions(): void {
    if (!isValidTransport(this.options.type)) {
      throw new Error(`Invalid transport type: ${this.options.type}`);
    }

    if (['http', 'https', 'sse'].includes(this.options.type) && !this.options.url) {
      throw new Error(`URL is required for ${this.options.type} transport`);
    }

    if (this.options.type === 'local' && !this.options.cmd) {
      throw new Error('Command is required for local transport');
    }

    if (this.options.url && !validateUrl(this.options.url)) {
      throw new Error(`Invalid URL: ${this.options.url}`);
    }
  }

  async connect(): Promise<void> {
    try {
      switch (this.options.type) {
        case 'local':
          await this.connectLocal();
          break;
        case 'http':
        case 'https':
          await this.connectHttp();
          break;
        case 'sse':
          await this.connectSSE();
          break;
        default:
          throw new Error(`Unsupported transport: ${this.options.type}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to connect: ${errorMessage}`);
    }
  }

  private async connectLocal(): Promise<void> {
    // Parse command and arguments
    const cmdParts = this.options.cmd!.split(' ');
    const command = cmdParts[0];
    const args = cmdParts.slice(1);

    // Create stdio transport
    this.transport = new StdioClientTransport({
      command,
      args
    });

    // Create MCP client
    this.client = new Client(
      {
        name: "mcp-client",
        version: "1.0.0"
      }
    );

    // Connect to the server
    await this.client.connect(this.transport);
  }

  private async connectHttp(): Promise<void> {
    // Create streamable HTTP transport
    this.transport = new StreamableHTTPClientTransport(new URL(this.options.url!));

    // Create MCP client
    this.client = new Client(
      {
        name: "mcp-client",
        version: "1.0.0"
      }
    );

    // Connect to the server
    await this.client.connect(this.transport);
  }

  private async connectSSE(): Promise<void> {
    // Create SSE transport
    this.transport = new SSEClientTransport(new URL(this.options.url!));

    // Create MCP client
    this.client = new Client(
      {
        name: "mcp-client",
        version: "1.0.0"
      }
    );

    // Connect to the server
    await this.client.connect(this.transport);
  }

  async listTools(): Promise<any[]> {
    if (!this.client) {
      throw new Error('Not connected to server');
    }

    try {
      const response = await this.client.listTools();
      return response.tools || [];
    } catch (error: any) {
      const errorMessage = error.message || 'Server error';
      const newError = new Error(errorMessage);
      (newError as any).code = 'SERVER_ERROR';
      throw newError;
    }
  }

  async callTool(toolName: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.client) {
      throw new Error('Not connected to server');
    }

    try {
      const response = await this.client.callTool({
        name: toolName,
        arguments: params
      });
      
      return response;
    } catch (error: any) {
      // Handle specific MCP error cases
      if (error.message && error.message.includes('not found')) {
        const newError = new Error(`Tool '${toolName}' not found`);
        (newError as any).code = 'TOOL_NOT_FOUND';
        throw newError;
      } else if (error.message && error.message.includes('Invalid parameters')) {
        const newError = new Error(`Invalid parameters for tool '${toolName}': ${error.message}`);
        (newError as any).code = 'INVALID_PARAMS';
        throw newError;
      } else {
        const newError = new Error(error.message || 'Server error');
        (newError as any).code = 'SERVER_ERROR';
        throw newError;
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
    this.client = null;
  }

}