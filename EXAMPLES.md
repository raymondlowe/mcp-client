# Examples

Here are practical examples showing how to use the MCP client effectively:

## Authentication

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

## Basic Tool Discovery

```bash
# See what tools are available
npx mcp-client --url https://api.example.com/mcp inspect
```

## Simple Parameter Syntax

```bash
# Search with simple field syntax
npx mcp-client --url https://api.example.com/mcp --tool search --fields "q=weather,location=NYC"

# Boolean and numeric values are auto-parsed
npx mcp-client --url https://api.example.com/mcp --tool search --fields "q=news,limit=10,detailed=true"
```

## JSON Parameter Syntax

```bash
# Complex data structures
npx mcp-client --url https://api.example.com/mcp --tool analyze '{
  "text": "Sample text to analyze",
  "options": {
    "language": "en",
    "sentiment": true
  }
}'
```

## Unix-Friendly Piping

```bash
# Generate queries and process results
echo -e "weather\ntraffic\nnews" | while read query; do
  npx mcp-client --url https://api.example.com/mcp --tool search --fields "q=$query" --json
done

# Extract specific data with jq
npx mcp-client --url https://api.example.com/mcp --tool weather --fields "location=NYC" --json \
  | jq -r '.result.content[0].text'

# Chain with other tools
npx mcp-client --url https://api.example.com/mcp --tool search --fields "q=weather" \
  | grep -o "temperature: [0-9]*" \
  | cut -d' ' -f2
```

## Stdin Input

```bash
# Pipe JSON data
echo '{"query": "test", "limit": 5}' | npx mcp-client --url https://api.example.com/mcp search

# From file
cat query.json | npx mcp-client --url https://api.example.com/mcp analyze
```

## Local MCP Servers

```bash
# Test a local MCP server
npx mcp-client --type local --cmd "npx my-mcp-server" inspect

# Call tools on local server
npx mcp-client --type local --cmd "python3 server.py" --tool process --fields "data=test"
```

## Error Handling in Scripts

```bash
#!/bin/bash

# Check if server is available
if npx mcp-client --url https://api.example.com/mcp inspect >/dev/null 2>&1; then
    echo "Server is available"
    
    # Try to call a tool
    if result=$(npx mcp-client --url https://api.example.com/mcp --tool search --fields "q=test" 2>&1); then
        echo "Success: $result"
    else
        echo "Tool call failed: $result"
        exit 1
    fi
else
    echo "Server is not available"
    exit 1
fi
```

## Configuration with Environment Variables

```bash
# Set default server URL and authentication
export MCP_URL="https://api.example.com/mcp"
export MCP_BEARER_TOKEN="your-api-token"

# Use in script
npx mcp-client --url "$MCP_URL" inspect
```

## Copy-Paste Friendly Output

The `inspect` command provides ready-to-run commands:

```bash
$ npx mcp-client --url https://api.example.com/mcp inspect

Available tools on https://api.example.com/mcp:

Tool: search
  Description: Search for information  
  Parameters:
    - q (string, required): Search query
    - limit (number, optional): Maximum results
  Usage: mcp-client --url https://api.example.com/mcp --tool search --fields "q=VALUE,limit=VALUE"
```

Just copy the usage line and replace `VALUE` with your actual values!