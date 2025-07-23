import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { z } from 'zod';

/**
 * Creates a test MCP server with dummy tools for testing the client
 */
export function createTestServer(): { server: McpServer; transport: InMemoryTransport } {
  const server = new McpServer({
    name: "test-server",
    version: "1.0.0",
  });

  // Register a simple echo tool
  server.registerTool("echo", {
    description: "Echo back the input text",
    inputSchema: {
      text: z.string().describe("Text to echo back"),
    },
  }, async ({ text }) => {
    return {
      content: [
        {
          type: "text",
          text: `Echo: ${text}`,
        },
      ],
    };
  });

  // Register a tool that requires specific parameters
  server.registerTool("add", {
    description: "Add two numbers",
    inputSchema: {
      a: z.number().describe("First number"),
      b: z.number().describe("Second number"),
    },
  }, async ({ a, b }) => {
    return {
      content: [
        {
          type: "text",
          text: `${a} + ${b} = ${a + b}`,
        },
      ],
    };
  });

  // Register a tool that simulates an error
  server.registerTool("error", {
    description: "Tool that always throws an error",
    inputSchema: {
      message: z.string().optional().describe("Error message to throw"),
    },
  }, async ({ message }) => {
    throw new Error(message || "Simulated error");
  });

  // Create in-memory transport
  const [clientTransport] = InMemoryTransport.createLinkedPair();

  return { server, transport: clientTransport };
}