import { validateUrl, isValidTransport } from './utils.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { version } = require('../package.json');
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

export interface MCPClientOptions {
  type: string;
  url?: string;
  cmd?: string;
  quiet?: boolean;
  transport?: InMemoryTransport; // For testing only
}

export class MCPClient {
  /**
   * For HTTP/HTTPS transports, send a DELETE to the server to close the session.
   */
  async disconnectHttpSession(): Promise<void> {
    if ((this.options.type === 'http' || this.options.type === 'https') && this.options.url) {
      try {
        const url = new URL(this.options.url);
        // If the server expects a specific session endpoint, adjust here
        // Use global fetch if available, otherwise require('node-fetch')
        let fetchFn: any;
        if (typeof fetch === 'function') {
          fetchFn = fetch;
        } else {
          fetchFn = (await import('node-fetch')).default as any;
        }
        await fetchFn(url.toString(), { method: 'DELETE' });
      } catch (err) {
        // Ignore errors on disconnect
      }
    }
    // Always call the normal disconnect as well
    await this.disconnect();
  }
  private options: MCPClientOptions;
  private client: Client | null = null;
  private transport: StdioClientTransport | SSEClientTransport | StreamableHTTPClientTransport | InMemoryTransport | null = null;

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
      // Use provided transport for testing
      if (this.options.transport) {
        await this.connectInMemory();
        return;
      }

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
        version
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
        version
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
        version
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
      
      // Check if the response indicates an error
      if (response.isError) {
        // Handle the error based on content
        const content = response.content as any[];
        const errorText = content?.[0]?.text || 'Unknown error';
        
        if (errorText.includes('not found') || errorText.includes('Tool not found')) {
          const newError = new Error(`Tool '${toolName}' not found`);
          (newError as any).code = 'TOOL_NOT_FOUND';
          throw newError;
        } else {
          const newError = new Error(errorText);
          (newError as any).code = 'SERVER_ERROR';
          throw newError;
        }
      }
      
      return response;
    } catch (error: any) {
      // Handle JSON-RPC error codes
      if (error.code === -32601) { // MethodNotFound
        const newError = new Error(`Tool '${toolName}' not found`);
        (newError as any).code = 'TOOL_NOT_FOUND';
        throw newError;
      } else if (error.code === -32602) { // InvalidParams
        const newError = new Error(`Invalid parameters for tool '${toolName}': ${error.message || 'Invalid parameters'}`);
        (newError as any).code = 'INVALID_PARAMS';
        throw newError;
      } else if (typeof error.code === 'string') {
        // Re-throw errors that already have string codes (our custom ones)
        throw error;
      } else if (error.message && error.message.includes('not found')) {
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

  private async connectInMemory(): Promise<void> {
    // Use provided in-memory transport for testing
    this.transport = this.options.transport!;

    // Create MCP client
    this.client = new Client(
      {
        name: "mcp-client",
        version
      }
    );

    // Connect to the server
    await this.client.connect(this.transport);
  }

}