import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPClient } from '../client.js';

describe('Bearer Token Authentication', () => {
  let originalFetch: any;
  let mockFetch: any;

  beforeEach(() => {
    // Store original fetch if it exists
    originalFetch = global.fetch;
    
    // Create mock fetch that captures requests
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map(),
      body: null,
      text: () => Promise.resolve(''),
      json: () => Promise.resolve({}),
    });
    
    // Set global fetch to our mock
    global.fetch = mockFetch;
  });

  afterEach(() => {
    // Restore original fetch
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      delete (global as any).fetch;
    }
    vi.restoreAllMocks();
  });

  it('should include Authorization Bearer header when bearerToken is provided', async () => {
    const client = new MCPClient({
      type: 'https',
      url: 'https://example.com/mcp',
      bearerToken: 'test-token-123'
    });

    // Attempt to connect (this will fail with our mock, but we can check the request)
    try {
      await client.connect();
    } catch (error) {
      // Expected to fail with our simple mock
    }

    // Verify that fetch was called with the correct Authorization header
    expect(mockFetch).toHaveBeenCalled();
    
    // Check if any of the fetch calls included our Bearer token
    const fetchCalls = mockFetch.mock.calls;
    let foundAuthHeader = false;
    
    for (const call of fetchCalls) {
      const [url, options] = call;
      if (options && options.headers) {
        const headers = options.headers;
        
        // Check if headers is a Headers object or plain object
        let authHeaderValue;
        if (headers instanceof Headers) {
          authHeaderValue = headers.get('Authorization');
        } else {
          authHeaderValue = headers.Authorization || headers.authorization;
        }
        
        if (authHeaderValue === 'Bearer test-token-123') {
          foundAuthHeader = true;
          break;
        }
      }
    }
    
    expect(foundAuthHeader).toBe(true);
  });

  it('should not include Authorization header when bearerToken is not provided', async () => {
    const client = new MCPClient({
      type: 'https',
      url: 'https://example.com/mcp'
      // no bearerToken provided
    });

    // Attempt to connect
    try {
      await client.connect();
    } catch (error) {
      // Expected to fail with our simple mock
    }

    // Verify that fetch was called but without Authorization header
    expect(mockFetch).toHaveBeenCalled();
    
    const fetchCalls = mockFetch.mock.calls;
    let foundAuthHeader = false;
    
    for (const call of fetchCalls) {
      const [url, options] = call;
      if (options && options.headers) {
        // Check if headers is a Headers object or plain object
        let authHeaderValue;
        if (options.headers instanceof Headers) {
          authHeaderValue = options.headers.get('Authorization');
        } else {
          authHeaderValue = options.headers.Authorization || options.headers.authorization;
        }
        
        if (authHeaderValue) {
          foundAuthHeader = true;
          break;
        }
      }
    }
    
    expect(foundAuthHeader).toBe(false);
  });

  it('should validate that bearerToken option is accepted in MCPClientOptions', () => {
    // This test ensures the TypeScript interface accepts bearerToken
    const options = {
      type: 'https',
      url: 'https://example.com/mcp',
      bearerToken: 'test-token'
    };

    const client = new MCPClient(options);
    expect(client).toBeDefined();
  });
});