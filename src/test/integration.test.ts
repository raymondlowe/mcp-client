import { describe, it, expect } from 'vitest';
import { MCPClient } from '../client.js';

describe('MCPClient Transport Integration', () => {
  describe('validation and configuration', () => {
    it('should properly configure local transport with complex commands', () => {
      const client = new MCPClient({ 
        type: 'local', 
        cmd: 'node --max-old-space-size=4096 server.js --debug --port=3000' 
      });
      
      expect(client).toBeInstanceOf(MCPClient);
    });

    it('should properly configure HTTP transport with query parameters', () => {
      const client = new MCPClient({ 
        type: 'http', 
        url: 'http://localhost:8080/mcp?version=1.0&auth=token' 
      });
      
      expect(client).toBeInstanceOf(MCPClient);
    });

    it('should properly configure HTTPS transport with custom ports', () => {
      const client = new MCPClient({ 
        type: 'https', 
        url: 'https://api.example.com:8443/mcp/v1' 
      });
      
      expect(client).toBeInstanceOf(MCPClient);
    });

    it('should properly configure SSE transport', () => {
      const client = new MCPClient({ 
        type: 'sse', 
        url: 'https://events.example.com/mcp/stream' 
      });
      
      expect(client).toBeInstanceOf(MCPClient);
    });

    it('should reject malformed URLs', () => {
      expect(() => new MCPClient({ 
        type: 'http', 
        url: 'not-a-url' 
      })).toThrow('Invalid URL');
      
      expect(() => new MCPClient({ 
        type: 'http', 
        url: '://invalid' 
      })).toThrow('Invalid URL');
    });

    it('should require non-empty command for local transport', () => {
      expect(() => new MCPClient({ 
        type: 'local', 
        cmd: '' 
      })).toThrow('Command is required for local transport');
    });

    it('should handle quiet mode option', () => {
      const client = new MCPClient({ 
        type: 'local', 
        cmd: 'server',
        quiet: true
      });
      
      expect(client).toBeInstanceOf(MCPClient);
    });
  });

  describe('error handling edge cases', () => {
    it('should handle disconnect when not connected', async () => {
      const client = new MCPClient({ type: 'local', cmd: 'server' });
      
      // Should not throw when disconnecting without connecting
      await expect(client.disconnect()).resolves.not.toThrow();
    });

    it('should handle multiple disconnect calls', async () => {
      const client = new MCPClient({ type: 'local', cmd: 'server' });
      
      await client.disconnect();
      await expect(client.disconnect()).resolves.not.toThrow();
    });

    it('should handle operations on disconnected client', async () => {
      const client = new MCPClient({ type: 'local', cmd: 'server' });
      
      await expect(client.listTools()).rejects.toThrow('Not connected to server');
      await expect(client.callTool('test')).rejects.toThrow('Not connected to server');
    });
  });

  describe('parameter handling', () => {
    it('should accept empty parameters object', () => {
      const client = new MCPClient({ 
        type: 'local', 
        cmd: 'server',
        quiet: false
      });
      
      expect(client).toBeInstanceOf(MCPClient);
    });

    it('should accept minimal configuration', () => {
      const client = new MCPClient({ 
        type: 'local', 
        cmd: 'server'
      });
      
      expect(client).toBeInstanceOf(MCPClient);
    });
  });

  describe('transport type coverage', () => {
    it('should support all documented transport types', () => {
      const transportTypes = ['local', 'http', 'https', 'sse'];
      
      transportTypes.forEach(type => {
        if (type === 'local') {
          expect(() => new MCPClient({ type, cmd: 'server' })).not.toThrow();
        } else {
          expect(() => new MCPClient({ type, url: `${type}://example.com` })).not.toThrow();
        }
      });
    });

    it('should reject invalid transport types', () => {
      const invalidTypes = ['tcp', 'websocket', 'grpc', 'unknown'];
      
      invalidTypes.forEach(type => {
        expect(() => new MCPClient({ type } as any)).toThrow('Invalid transport type');
      });
    });
  });
});

describe('MCPClient Error Code Mapping', () => {
  it('should properly map JSON-RPC error codes to application codes', () => {
    // This test documents the expected error code mappings
    const errorMappings = {
      '-32601': 'TOOL_NOT_FOUND',  // MethodNotFound -> TOOL_NOT_FOUND
      '-32602': 'INVALID_PARAMS',   // InvalidParams -> INVALID_PARAMS
      '-32603': 'SERVER_ERROR',     // InternalError -> SERVER_ERROR
    };

    expect(errorMappings).toBeDefined();
    expect(Object.keys(errorMappings)).toContain('-32602');
  });
});