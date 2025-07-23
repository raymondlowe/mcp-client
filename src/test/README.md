# MCP Client Test Suite

This test suite provides comprehensive testing for the MCP (Model Context Protocol) client implementation, addressing the request for test cases against a test MCP server.

## Test Architecture

### Test Server (`test-server.ts`)
- Creates a mini MCP server using the MCP SDK's `McpServer` class
- Returns dummy hardcoded data as requested
- Uses `InMemoryTransport` for fast, reliable testing
- Implements test tools:
  - `echo`: Simple text echo tool
  - `add`: Mathematical addition tool with required parameters
  - `error`: Tool that simulates server errors

### Test Coverage

#### 1. Basic Client Tests (`client.test.ts`)
- **Connection Testing**: Validates successful connection with in-memory transport
- **Tool Discovery**: Tests `listTools()` functionality
- **Tool Execution**: Tests `callTool()` with various scenarios
- **Error Handling**: Comprehensive error code testing
- **Validation**: Input validation for transport types, URLs, and commands
- **Transport Support**: Tests for all transport types (local, HTTP, HTTPS, SSE)

#### 2. Integration Tests (`integration.test.ts`)
- **Transport Configuration**: Tests complex command-line arguments and URL formats
- **Error Edge Cases**: Tests disconnection scenarios and invalid inputs
- **Parameter Handling**: Validates option processing
- **Error Code Mapping**: Documents JSON-RPC to application error code mappings

#### 3. Comprehensive Tool Tests (`tools.test.ts`)
- **Advanced Tool Discovery**: Tests with complex tools and schemas
- **Parameter Variety**: Tests tools with no params, optional params, enums, nested objects
- **Multi-Content Responses**: Tests tools returning multiple content blocks
- **Complex Error Scenarios**: Division by zero, invalid enums, type mismatches, range validation

## Key Testing Features

### Real MCP SDK Integration
- Uses actual `McpServer` and `InMemoryTransport` from the MCP SDK
- Tests real transport layers and argument options as requested
- Validates actual MCP protocol communication

### Error Code Testing
The tests validate proper error handling and code translation:
- **JSON-RPC -32602 (InvalidParams)** → `INVALID_PARAMS`
- **JSON-RPC -32601 (MethodNotFound)** → `TOOL_NOT_FOUND`  
- **Tool execution errors** → `SERVER_ERROR`

### Transport Layer Testing
- **In-Memory Transport**: For unit testing (fast, reliable)
- **Local Transport**: Command parsing and stdio communication
- **HTTP/HTTPS Transport**: URL validation and web protocols
- **SSE Transport**: Server-Sent Events support

### Dummy Data Validation
As requested, the test server returns hardcoded dummy data:
- Echo tool returns predictable "Echo: {input}" responses
- Add tool returns mathematical results in "a + b = result" format
- Error tool reliably throws test errors
- All responses are deterministic for reliable testing

## Benefits

1. **Validates Real Communication**: Tests actual MCP SDK transport layers
2. **Comprehensive Coverage**: 54 test cases covering all major functionality
3. **Error Handling**: Validates proper error codes and messages
4. **Transport Validation**: Tests all supported transport types and their options
5. **Parameter Testing**: Tests complex parameter scenarios including nested objects
6. **Performance**: Fast in-memory testing without external dependencies

## Running Tests

```bash
npm test           # Run all tests
npm run build      # Build TypeScript first if needed
```

The test suite validates that the client correctly communicates with MCP servers, handles errors appropriately, and supports all documented transport options and argument combinations.