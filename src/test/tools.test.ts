import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MCPClient } from '../client.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { z } from 'zod';

describe('MCP Tool Functionality', () => {
  let server: McpServer;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;
  let client: MCPClient;

  beforeEach(async () => {
    // Create enhanced test server with more tools
    server = new McpServer({
      name: "enhanced-test-server",
      version: "1.0.0",
    });

    // Tool with no parameters
    server.registerTool("ping", {
      description: "Simple ping tool with no parameters",
      inputSchema: {},
    }, async () => {
      return {
        content: [
          {
            type: "text",
            text: "pong",
          },
        ],
      };
    });

    // Tool with optional parameters
    server.registerTool("greet", {
      description: "Greeting tool with optional name",
      inputSchema: {
        name: z.string().optional().describe("Name to greet"),
      },
    }, async ({ name }) => {
      return {
        content: [
          {
            type: "text",
            text: name ? `Hello, ${name}!` : "Hello, World!",
          },
        ],
      };
    });

    // Tool with complex parameters
    server.registerTool("calculate", {
      description: "Calculator tool with multiple operations",
      inputSchema: {
        operation: z.enum(['add', 'subtract', 'multiply', 'divide']).describe("Operation to perform"),
        a: z.number().describe("First number"),
        b: z.number().describe("Second number"),
      },
    }, async ({ operation, a, b }) => {
      let result: number;
      switch (operation) {
        case 'add':
          result = a + b;
          break;
        case 'subtract':
          result = a - b;
          break;
        case 'multiply':
          result = a * b;
          break;
        case 'divide':
          if (b === 0) throw new Error("Division by zero");
          result = a / b;
          break;
        default:
          throw new Error("Invalid operation");
      }
      
      return {
        content: [
          {
            type: "text",
            text: `${a} ${operation} ${b} = ${result}`,
          },
        ],
      };
    });

    // Tool that returns multiple content blocks
    server.registerTool("multi-response", {
      description: "Tool that returns multiple content blocks",
      inputSchema: {
        count: z.number().min(1).max(5).describe("Number of responses to generate"),
      },
    }, async ({ count }) => {
      const content = [];
      for (let i = 1; i <= count; i++) {
        content.push({
          type: "text",
          text: `Response ${i} of ${count}`,
        });
      }
      
      return { content };
    });

    // Tool with nested object parameters
    server.registerTool("process-user", {
      description: "Process user information",
      inputSchema: {
        user: z.object({
          name: z.string(),
          age: z.number().min(0),
          email: z.string().email().optional(),
        }).describe("User information"),
        preferences: z.object({
          theme: z.enum(['light', 'dark']),
          notifications: z.boolean(),
        }).optional().describe("User preferences"),
      },
    }, async ({ user, preferences }) => {
      let result = `Processing user: ${user.name}, age ${user.age}`;
      if (user.email) {
        result += `, email: ${user.email}`;
      }
      if (preferences) {
        result += `, theme: ${preferences.theme}, notifications: ${preferences.notifications}`;
      }
      
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    });

    // Create transport pair and connect
    const [client_transport, server_transport] = InMemoryTransport.createLinkedPair();
    clientTransport = client_transport;
    serverTransport = server_transport;
    
    await server.connect(serverTransport);
    
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

  describe('tool discovery', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should discover all registered tools', async () => {
      const tools = await client.listTools();
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('ping');
      expect(toolNames).toContain('greet');
      expect(toolNames).toContain('calculate');
      expect(toolNames).toContain('multi-response');
      expect(toolNames).toContain('process-user');
    });

    it('should provide detailed tool information', async () => {
      const tools = await client.listTools();
      
      const calculateTool = tools.find(tool => tool.name === 'calculate');
      expect(calculateTool).toBeDefined();
      expect(calculateTool.description).toBe('Calculator tool with multiple operations');
      expect(calculateTool.inputSchema).toBeDefined();
    });
  });

  describe('tool execution', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should execute tool with no parameters', async () => {
      const result = await client.callTool('ping');
      
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toBe('pong');
    });

    it('should execute tool with optional parameters provided', async () => {
      const result = await client.callTool('greet', { name: 'Alice' });
      
      expect(result.content[0].text).toBe('Hello, Alice!');
    });

    it('should execute tool with optional parameters omitted', async () => {
      const result = await client.callTool('greet');
      
      expect(result.content[0].text).toBe('Hello, World!');
    });

    it('should execute tool with enum parameters', async () => {
      const result = await client.callTool('calculate', { 
        operation: 'add', 
        a: 10, 
        b: 5 
      });
      
      expect(result.content[0].text).toBe('10 add 5 = 15');
    });

    it('should execute tool with all enum operations', async () => {
      const operations = [
        { op: 'add', a: 10, b: 5, expected: '10 add 5 = 15' },
        { op: 'subtract', a: 10, b: 3, expected: '10 subtract 3 = 7' },
        { op: 'multiply', a: 4, b: 6, expected: '4 multiply 6 = 24' },
        { op: 'divide', a: 15, b: 3, expected: '15 divide 3 = 5' },
      ];

      for (const { op, a, b, expected } of operations) {
        const result = await client.callTool('calculate', { 
          operation: op, 
          a, 
          b 
        });
        expect(result.content[0].text).toBe(expected);
      }
    });

    it('should execute tool returning multiple content blocks', async () => {
      const result = await client.callTool('multi-response', { count: 3 });
      
      expect(result.content).toHaveLength(3);
      expect(result.content[0].text).toBe('Response 1 of 3');
      expect(result.content[1].text).toBe('Response 2 of 3');
      expect(result.content[2].text).toBe('Response 3 of 3');
    });

    it('should execute tool with nested object parameters', async () => {
      const result = await client.callTool('process-user', {
        user: {
          name: 'John Doe',
          age: 30,
          email: 'john@example.com'
        },
        preferences: {
          theme: 'dark',
          notifications: true
        }
      });
      
      expect(result.content[0].text).toBe(
        'Processing user: John Doe, age 30, email: john@example.com, theme: dark, notifications: true'
      );
    });

    it('should execute tool with partial nested object parameters', async () => {
      const result = await client.callTool('process-user', {
        user: {
          name: 'Jane Doe',
          age: 25
        }
      });
      
      expect(result.content[0].text).toBe('Processing user: Jane Doe, age 25');
    });
  });

  describe('error scenarios', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should handle division by zero error', async () => {
      await expect(client.callTool('calculate', { 
        operation: 'divide', 
        a: 10, 
        b: 0 
      })).rejects.toThrow();
      
      const error = await client.callTool('calculate', { 
        operation: 'divide', 
        a: 10, 
        b: 0 
      }).catch(e => e);
      expect(error.code).toBe('SERVER_ERROR');
      expect(error.message).toContain('Division by zero');
    });

    it('should handle invalid enum values', async () => {
      await expect(client.callTool('calculate', { 
        operation: 'invalid', 
        a: 10, 
        b: 5 
      })).rejects.toThrow();
      
      const error = await client.callTool('calculate', { 
        operation: 'invalid', 
        a: 10, 
        b: 5 
      }).catch(e => e);
      expect(error.code).toBe('INVALID_PARAMS');
    });

    it('should handle missing required parameters', async () => {
      await expect(client.callTool('calculate', { 
        operation: 'add', 
        a: 10 
        // missing b parameter
      })).rejects.toThrow();
      
      const error = await client.callTool('calculate', { 
        operation: 'add', 
        a: 10 
      }).catch(e => e);
      expect(error.code).toBe('INVALID_PARAMS');
    });

    it('should handle invalid parameter types', async () => {
      await expect(client.callTool('calculate', { 
        operation: 'add', 
        a: 'not-a-number', 
        b: 5 
      })).rejects.toThrow();
      
      const error = await client.callTool('calculate', { 
        operation: 'add', 
        a: 'not-a-number', 
        b: 5 
      }).catch(e => e);
      expect(error.code).toBe('INVALID_PARAMS');
    });

    it('should handle out-of-range parameters', async () => {
      await expect(client.callTool('multi-response', { count: 10 })).rejects.toThrow();
      
      const error = await client.callTool('multi-response', { count: 10 }).catch(e => e);
      expect(error.code).toBe('INVALID_PARAMS');
    });
  });
});