# MCP Client

A lightweight, unix-friendly command-line client for testing and interacting with MCP (Model Context Protocol) servers.

## Installation

```bash
npx -y @raymondlowe/mcp-client [options] [command]
```

## Quick Start

```bash
# Inspect available tools on a server
npx mcp-client --url https://example.com/mcp inspect

# Call a tool with simple field syntax
npx mcp-client --url https://example.com/mcp --tool getinfo --fields "username=raymond,query=weather"

# Call a tool with JSON data
npx mcp-client --url https://example.com/mcp --tool getinfo '{"username": "raymond", "query": "weather"}'

# Test local MCP server
npx mcp-client --type local --cmd "npx some-mcp-server" inspect
```

## Features

- **Multiple Transport Support**: local stdio, HTTP/HTTPS, SSE
- **Authentication**: Bearer token support for API authentication
- **Tool Discovery**: Inspect servers to see available tools and their schemas
- **Flexible Parameter Passing**: Use simple `--fields` syntax or JSON
- **Unix-Friendly**: Pipeable output, proper exit codes, clean error messages
- **Copy-Paste Friendly**: Inspect output shows ready-to-run commands

## Usage

```
mcp-client [options] [command] [data]
```

### Connection Options

| Option | Description | Example | Environment Variable |
|--------|-------------|---------|---------------------|
| `--type <transport>` | Transport type: `local`, `http`, `https`, `sse` | `--type https` | `MCP_TYPE` |
| `--url <url>` | Server URL (for remote connections) | `--url https://api.example.com/mcp` | `MCP_URL` |
| `--cmd <command>` | Command to run local MCP server | `--cmd "npx my-mcp-server"` | `MCP_CMD` |
| `--bearer <token>` | Bearer token for Authorization header | `--bearer your-api-token` | `MCP_BEARER_TOKEN` |

### Tool Invocation Options

| Option | Description | Example |
|--------|-------------|---------|
| `--tool <name>` | Tool name to call | `--tool search` |
| `--fields <params>` | Simple parameter syntax | `--fields "q=hello,limit=10"` |
| `--json` | Output raw JSON (no formatting) | `--json` |
| `--verbose` | Show detailed connection info | `--verbose` |

### Commands

| Command | Description | Example |
|---------|-------------|---------|
| `inspect` | List available tools and their schemas | `mcp-client --url <url> inspect` |
| `[tool-name]` | Call a specific tool | `mcp-client --url <url> search '{"q": "hello"}'` |

## Examples

### Authentication

For APIs that require Bearer token authentication:

```bash
# Using command line option
npx mcp-client --url https://api.example.com/mcp --bearer your-api-token inspect

# Using environment variable
export MCP_BEARER_TOKEN="your-api-token"
npx mcp-client --url https://api.example.com/mcp inspect

# Call a tool with authentication
npx mcp-client --url https://api.example.com/mcp --bearer your-api-token --tool search --fields "q=weather"
```

### Tool Discovery

```bash
# See what tools are available and their parameters
npx mcp-client --url https://example.com/mcp inspect

# Output shows copy-paste ready commands:
# Tool: search
#   Description: Search for information
#   Parameters: q (required), limit (optional)
#   Usage: mcp-client --url https://example.com/mcp --tool search --fields "q=VALUE,limit=VALUE"
```

### Calling Tools

```bash
# Simple field syntax (recommended for CLI)
npx mcp-client --url https://example.com/mcp --tool search --fields "q=weather,limit=5"

# JSON syntax (good for complex data)
npx mcp-client --url https://example.com/mcp --tool search '{"q": "weather", "limit": 5}'

# Positional arguments (tool name as command)
npx mcp-client --url https://example.com/mcp search '{"q": "weather"}'
```

### Transport Types

```bash
# HTTP/HTTPS server
npx mcp-client --type https --url https://api.example.com/mcp inspect

# With Bearer token authentication
npx mcp-client --type https --url https://api.example.com/mcp --bearer your-api-token inspect

# Local stdio server
npx mcp-client --type local --cmd "npx @example/mcp-server" inspect

# Server-Sent Events
npx mcp-client --type sse --url https://example.com/mcp/events inspect
```

### Environment Variables

You can set default values using environment variables:

```bash
export MCP_URL="https://api.example.com/mcp"
export MCP_TYPE="https"
export MCP_BEARER_TOKEN="your-api-token"

# Now you can omit --url, --type, and --bearer
npx mcp-client inspect
npx mcp-client --tool search --fields "q=test"
```

```bash
# Chain with other tools
npx mcp-client --url <url> --tool search --fields "q=weather" | jq '.result'

# Use in scripts with proper exit codes
if npx mcp-client --url <url> --tool validate --fields "data=test"; then
  echo "Validation passed"
fi

# Process multiple queries
echo -e "weather\ntraffic\nnews" | while read query; do
  npx mcp-client --url <url> --tool search --fields "q=$query"
done
```

## Output Format

### Successful Tool Calls
```json
{
  "success": true,
  "tool": "search",
  "result": { ... }
}
```

### Errors
```json
{
  "success": false,
  "error": "Tool 'invalid' not found",
  "available_tools": ["search", "info"]
}
```

### Inspect Output
```
Available tools on server: https://example.com/mcp

Tool: search
  Description: Search for information
  Parameters:
    - q (string, required): Search query
    - limit (number, optional): Maximum results
  Usage: mcp-client --url https://example.com/mcp --tool search --fields "q=VALUE,limit=VALUE"

Tool: info
  Description: Get server information
  Parameters: (none)
  Usage: mcp-client --url https://example.com/mcp --tool info
```

## Exit Codes

- `0`: Success
- `1`: General error (connection failed, invalid arguments)
- `2`: Tool not found
- `3`: Invalid tool parameters
- `4`: Server error

## Development


```bash
# Clone and install
git clone https://github.com/raymondlowe/mcp-client
cd mcp-client
npm install

## Development

```bash
npm run dev -- --help
npm run build
npm test   # Runs all tests using Vitest
```

If you see output like this, all tests have passed and your setup is correct:

```
✓ src/test/tools.test.ts (15)
✓ src/test/client.test.ts (24)
✓ src/test/integration.test.ts (15)

Test Files  3 passed (3)
     Tests  54 passed (54)
```

## Publishing

This package is automatically published to npm when GitHub releases are created. For detailed setup instructions and publishing options, see [PUBLISHING.md](PUBLISHING.md).

**Quick start for maintainers:**
1. Set up `NPM_TOKEN` in repository secrets (one-time setup)
2. Create a GitHub release to automatically publish
3. Or use the manual publish workflow in GitHub Actions

**Test your setup:**
```bash
npm run test:publish
```

## License

MIT
