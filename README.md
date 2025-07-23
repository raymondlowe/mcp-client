# Simple MCP Client

For testing connections to mcp servers, be they local or remote.

usage:

mcp-client --type [local:sse:shttp| --url <url for sse or shttp> --cmd <cmd line for local> [command] [data]

Examples

mcp-client --type local --cmd "npx -y whatever@sometool" tool "{some json mcp data}"
mcp-client --type sse --url https://example.com/mcp toollist
mcp-client --type https --url https://example.com/mcp toollist

Can you see what I'm doing here? Trying to write the README.md but make it the spec as well.  Help to expand.

You are drafting a README.md for a **Simple MCP Client** CLI tool intended for testing connections to MCP servers locally or remotely via various transports (local stdio commands, Server-Sent Events (SSE), or HTTP/S). Below is an expanded, structured version that also serves as a partial spec for usage, configuration, and examples, integrating your current content and complementing it with useful details based on known MCP tooling patterns and usage references.

# Simple MCP Client

**A lightweight command-line client for testing connections to MCP (Model Context Protocol) servers**
Supports multiple transport types: **local stdio commands**, **SSE (Server-Sent Events)**, and **HTTP(S)**.

## Features

- Connect to MCP servers locally via CLI commands (stdio transport)
- Connect remotely to MCP servers using HTTP or SSE protocols
- Issue MCP commands with JSON-formatted data
- Supports quick discovery and invocation of MCP tools
- Suitable for manual debugging, exploration, and integration testing



## Usage

```
npx mcp-client --type <transport> [options] <command> [data]
```

- **--type**: Transport type for connecting to the MCP server
Valid values: `local`, `sse`, `https` (or `http`)
- **--url**: URL of the remote MCP server (required for `sse`, `http(s)` types)
- **--cmd**: Command line to execute local MCP server (required for `local`)
- **command**: MCP tool/command to invoke
- **data**: (Optional) JSON-formatted string representing the MCP data payload


## Transport Types Explained

| Transport | Description | Required Option |
| :-- | :-- | :-- |
| `local` | Runs a local MCP server command via stdio | `--cmd "<command>"` |
| `sse` | Connects to an MCP server via SSE endpoint | `--url <SSE URL>` |
| `https` | Connects to an MCP server over HTTP or HTTPS | `--url <HTTP URL>` |

## Examples

### Local MCP server

Execute a local MCP server command with arguments and send MCP JSON data:

```bash
mcp-client --type local --cmd "npx -y whatever@sometool" tool '{ "key": "value" }'
```

Example to run a local MCP server script and call the tool `"tool"` with JSON data.

### SSE MCP server

Connect to and call a tool on an SSE MCP server:

```bash
mcp-client --type sse --url https://example.com/mcp toollist
```

This fetches the list of available tools from the SSE server endpoint.

### HTTP/S MCP server

Connect over HTTP/S and call a tool:

```bash
mcp-client --type https --url https://example.com/mcp toollist
```

Call the `toollist` tool on the remote server accessible via HTTPS.

## Sample Workflow

```bash
# Discover available tools first (if supported)
mcp-client --type sse --url https://example.com/mcp toollist

# Invoke a specific tool with data
mcp-client --type https --url https://example.com/mcp mytool '{ "param": "value" }'
```


## Configuration File (Optional)

Support read from a JSON config file specifying servers, commands, URLs, and environment variables, similar to `mcp-use`:

```json
{
  "mcpServers": {
    "localTool": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "whatever@sometool"]
    },
    "remoteSSE": {
      "type": "sse",
      "url": "https://example.com/mcp"
    },
    "remoteHTTP": {
      "type": "https",
      "url": "https://api.example.com/mcp"
    }
  }
}
```

Your client could optionally support a flag like `--config <file>` to load connections from such configuration.

## Notes

- JSON data passed as `[data]` must be properly escaped in CLI shells.
- For `local` type, the command specified in `--cmd` is run, and communication occurs via stdin/stdout using MCP protocol.
- For remote connections (`sse`, `https`), the URL should point to a valid MCP endpoint (check server docs).
- You can combine this client with MCP servers implemented in Python, Node.js, or other languages supporting MCP[^2].


## Additional Resources

https://www.npmjs.com/package/@modelcontextprotocol/sdk#writing-mcp-clients
