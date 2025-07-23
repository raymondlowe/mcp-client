import { spawn, ChildProcess } from 'child_process';
import { validateUrl, isValidTransport } from './utils.js';

export interface MCPClientOptions {
  type: string;
  url?: string;
  cmd?: string;
  quiet?: boolean;
}

export class MCPClient {
  private options: MCPClientOptions;
  private connection: any = null;
  private childProcess?: ChildProcess;

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

    // For now, create a mock connection to simulate MCP protocol
    // In a real implementation, this would use the MCP SDK to communicate via stdio
    this.connection = {
      type: 'local',
      command,
      args,
      // Mock connection that simulates stdio communication
      send: async (message: any) => {
        // Simulate sending MCP message via stdin
        return this.simulateLocalResponse(message);
      }
    };
  }

  private async connectHttp(): Promise<void> {
    // Mock HTTP/HTTPS connection
    // In a real implementation, this would use the MCP SDK's HTTP transport
    this.connection = {
      type: 'http',
      url: this.options.url,
      send: async (message: any) => {
        return this.simulateHttpResponse(message);
      }
    };
  }

  private async connectSSE(): Promise<void> {
    // Mock SSE connection
    // In a real implementation, this would use the MCP SDK's SSE transport
    this.connection = {
      type: 'sse',
      url: this.options.url,
      send: async (message: any) => {
        return this.simulateSSEResponse(message);
      }
    };
  }

  async listTools(): Promise<any[]> {
    if (!this.connection) {
      throw new Error('Not connected to server');
    }

    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };

    const response = await this.connection.send(request);
    
    if (response.error) {
      const error = new Error(response.error.message || 'Server error');
      (error as any).code = 'SERVER_ERROR';
      throw error;
    }

    return response.result?.tools || [];
  }

  async callTool(toolName: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.connection) {
      throw new Error('Not connected to server');
    }

    const request = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: params
      }
    };

    const response = await this.connection.send(request);
    
    if (response.error) {
      if (response.error.code === -32601) {
        const error = new Error(`Tool '${toolName}' not found`);
        (error as any).code = 'TOOL_NOT_FOUND';
        throw error;
      } else if (response.error.code === -32602) {
        const error = new Error(`Invalid parameters for tool '${toolName}': ${response.error.message}`);
        (error as any).code = 'INVALID_PARAMS';
        throw error;
      } else {
        const error = new Error(response.error.message || 'Server error');
        (error as any).code = 'SERVER_ERROR';
        throw error;
      }
    }

    return response.result;
  }

  async disconnect(): Promise<void> {
    if (this.childProcess) {
      this.childProcess.kill();
      this.childProcess = undefined;
    }
    this.connection = null;
  }

  // Mock implementations for demonstration
  // In a real implementation, these would be replaced with actual MCP SDK calls

  private async simulateLocalResponse(request: any): Promise<any> {
    // Simulate tool list response
    if (request.method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          tools: [
            {
              name: 'echo',
              description: 'Echo back the input',
              inputSchema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    description: 'Message to echo back'
                  }
                },
                required: ['message']
              }
            },
            {
              name: 'info',
              description: 'Get server information',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            }
          ]
        }
      };
    }

    // Simulate tool call response
    if (request.method === 'tools/call') {
      if (request.params.name === 'echo') {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: `Echo: ${request.params.arguments.message || 'No message provided'}`
              }
            ]
          }
        };
      } else if (request.params.name === 'info') {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: 'Local MCP Server - Mock Implementation'
              }
            ]
          }
        };
      } else {
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Tool '${request.params.name}' not found`
          }
        };
      }
    }

    throw new Error('Unknown method');
  }

  private async simulateHttpResponse(request: any): Promise<any> {
    // Simulate HTTP MCP server responses
    if (request.method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          tools: [
            {
              name: 'search',
              description: 'Search for information',
              inputSchema: {
                type: 'object',
                properties: {
                  q: {
                    type: 'string',
                    description: 'Search query'
                  },
                  limit: {
                    type: 'number',
                    description: 'Maximum number of results'
                  }
                },
                required: ['q']
              }
            },
            {
              name: 'weather',
              description: 'Get weather information',
              inputSchema: {
                type: 'object',
                properties: {
                  location: {
                    type: 'string',
                    description: 'Location to get weather for'
                  }
                },
                required: ['location']
              }
            }
          ]
        }
      };
    }

    if (request.method === 'tools/call') {
      if (request.params.name === 'search') {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: `Search results for: ${request.params.arguments.q || 'empty query'}`
              }
            ]
          }
        };
      } else if (request.params.name === 'weather') {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: `Weather for ${request.params.arguments.location || 'unknown location'}: Sunny, 72°F`
              }
            ]
          }
        };
      } else {
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Tool '${request.params.name}' not found`
          }
        };
      }
    }

    throw new Error('Unknown method');
  }

  private async simulateSSEResponse(request: any): Promise<any> {
    // For SSE, responses would be similar to HTTP but received via Server-Sent Events
    return this.simulateHttpResponse(request);
  }
}