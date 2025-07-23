import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MCPClient } from '../client.js';
import { createTestServer } from './test-server.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

describe('MCPClient', () => {
  let server: McpServer;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;
  let client: MCPClient;

  beforeEach(async () => {
    // Create test server and transport pair
    const { server: testServer, transport } = createTestServer();
    server = testServer;
    
    const [client_transport, server_transport] = InMemoryTransport.createLinkedPair();
    clientTransport = client_transport;
    serverTransport = server_transport;
    
    // Connect server to server transport
    await server.connect(serverTransport);
    
    // Create client with in-memory transport
    client = new MCPClient({
      type: 'test',
      transport: clientTransport
    });
  });

  afterEach(async () => {
    if (client) {
      await client.disconnect();
    }
    if (serverTransport) {
      await serverTransport.close();
    }
  });

  describe('connection', () => {
    it('should connect successfully with in-memory transport', async () => {
      await expect(client.connect()).resolves.not.toThrow();
    });

    it('should handle connection errors gracefully', async () => {
      // Create client without transport to test error handling
      const badClient = new MCPClient({ type: 'local', cmd: 'nonexistent-command' });
      
      await expect(badClient.connect()).rejects.toThrow('Failed to connect');
    });
  });

  describe('listTools', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should list available tools from test server', async () => {
      const tools = await client.listTools();
      
      expect(tools).toBeInstanceOf(Array);
      expect(tools.length).toBeGreaterThan(0);
      
      // Check that our test tools are present
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('echo');
      expect(toolNames).toContain('add');
      expect(toolNames).toContain('error');
    });

    it('should include tool descriptions and schemas', async () => {
      const tools = await client.listTools();
      
      const echoTool = tools.find(tool => tool.name === 'echo');
      expect(echoTool).toBeDefined();
      expect(echoTool.description).toBe('Echo back the input text');
      expect(echoTool.inputSchema).toBeDefined();
    });

    it('should handle server errors when listing tools', async () => {
      // Disconnect server to simulate error
      await serverTransport.close();
      
      await expect(client.listTools()).rejects.toThrow();
      const error = await client.listTools().catch(e => e);
      expect(error.code).toBe('SERVER_ERROR');
    });
  });

  describe('callTool', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should successfully call echo tool', async () => {
      const result = await client.callTool('echo', { text: 'Hello World' });
      
      expect(result).toBeDefined();
      expect(result.content).toBeInstanceOf(Array);
      expect(result.content[0].text).toBe('Echo: Hello World');
    });

    it('should successfully call add tool with numbers', async () => {
      const result = await client.callTool('add', { a: 5, b: 3 });
      
      expect(result).toBeDefined();
      expect(result.content).toBeInstanceOf(Array);
      expect(result.content[0].text).toBe('5 + 3 = 8');
    });

    it('should handle tool not found error', async () => {
      await expect(client.callTool('nonexistent-tool')).rejects.toThrow();
      
      const error = await client.callTool('nonexistent-tool').catch(e => e);
      // Note: The MCP SDK returns INVALID_PARAMS for nonexistent tools rather than TOOL_NOT_FOUND
      expect(error.code).toBe('INVALID_PARAMS');
      expect(error.message).toContain('nonexistent-tool');
    });

    it('should handle invalid parameters error', async () => {
      // Call add tool with missing parameters
      await expect(client.callTool('add', { a: 5 })).rejects.toThrow();
      
      const error = await client.callTool('add', { a: 5 }).catch(e => e);
      expect(error.code).toBe('INVALID_PARAMS');
    });

    it('should handle server errors from tool execution', async () => {
      await expect(client.callTool('error', { message: 'Test error' })).rejects.toThrow();
      
      const error = await client.callTool('error', { message: 'Test error' }).catch(e => e);
      expect(error.code).toBe('SERVER_ERROR');
    });

    it('should call tool with no parameters', async () => {
      // The error tool should throw an error when called
      await expect(client.callTool('error')).rejects.toThrow();
      
      const error = await client.callTool('error').catch(e => e);
      expect(error.code).toBe('SERVER_ERROR');
    });
  });

  describe('validation', () => {
    it('should validate transport type', () => {
      expect(() => new MCPClient({ type: 'invalid' })).toThrow('Invalid transport type');
    });

    it('should require URL for HTTP transport', () => {
      expect(() => new MCPClient({ type: 'http' })).toThrow('URL is required for http transport');
    });

    it('should require command for local transport', () => {
      expect(() => new MCPClient({ type: 'local' })).toThrow('Command is required for local transport');
    });

    it('should validate URL format', () => {
      expect(() => new MCPClient({ 
        type: 'http', 
        url: 'invalid-url' 
      })).toThrow('Invalid URL');
    });

    it('should accept valid HTTP URLs', () => {
      expect(() => new MCPClient({ 
        type: 'http', 
        url: 'http://localhost:3000' 
      })).not.toThrow();
    });

    it('should accept valid HTTPS URLs', () => {
      expect(() => new MCPClient({ 
        type: 'https', 
        url: 'https://api.example.com' 
      })).not.toThrow();
    });
  });

  describe('disconnect', () => {
    it('should disconnect gracefully', async () => {
      await client.connect();
      await expect(client.disconnect()).resolves.not.toThrow();
    });

    it('should handle disconnect when not connected', async () => {
      await expect(client.disconnect()).resolves.not.toThrow();
    });
  });
});

describe('MCPClient transport types', () => {
  describe('local transport', () => {
    it('should parse command with arguments correctly', () => {
      const client = new MCPClient({ 
        type: 'local', 
        cmd: 'node server.js --port 3000' 
      });
      
      // The client should not throw during construction
      expect(client).toBeInstanceOf(MCPClient);
    });

    it('should handle single command without arguments', () => {
      const client = new MCPClient({ 
        type: 'local', 
        cmd: 'server' 
      });
      
      expect(client).toBeInstanceOf(MCPClient);
    });
  });

  describe('HTTP transport', () => {
    it('should accept HTTP URLs', () => {
      const client = new MCPClient({ 
        type: 'http', 
        url: 'http://localhost:8080/mcp' 
      });
      
      expect(client).toBeInstanceOf(MCPClient);
    });
  });

  describe('HTTPS transport', () => {
    it('should accept HTTPS URLs', () => {
      const client = new MCPClient({ 
        type: 'https', 
        url: 'https://api.example.com/mcp' 
      });
      
      expect(client).toBeInstanceOf(MCPClient);
    });
  });

  describe('SSE transport', () => {
    it('should accept SSE URLs', () => {
      const client = new MCPClient({ 
        type: 'sse', 
        url: 'https://events.example.com/mcp' 
      });
      
      expect(client).toBeInstanceOf(MCPClient);
    });
  });
});