#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { MCPClient, MCPClientOptions } from './client.js';
import { parseFields, formatOutput, handleError } from './utils.js';
import { readStdin } from './stdin.js';

program
  .name('mcp-client')
  .description('A lightweight CLI client for MCP (Model Context Protocol) servers')
  .version('1.0.0');

// Global options
program
  .option('--type <transport>', 'Transport type: local, http, https, sse', 'https')
  .option('--url <url>', 'Server URL (for remote connections)')
  .option('--cmd <command>', 'Command to run local MCP server')
  .option('--tool <name>', 'Tool name to call')
  .option('--fields <params>', 'Simple parameter syntax: "key=value,key2=value2"')
  .option('--json', 'Output raw JSON (no formatting)', false)
  .option('--quiet', 'Suppress non-error output', false);

// Inspect command
program
  .command('inspect')
  .description('List available tools and their schemas')
  .action(async () => {
    try {
      const options = program.opts();
      const client = new MCPClient(options as MCPClientOptions);
      await client.connect();
      
      const tools = await client.listTools();
      
      if (options.json) {
        console.log(JSON.stringify(tools, null, 2));
      } else {
        console.log(formatInspectOutput(tools, options));
      }
      
      await client.disconnect();
      process.exit(0);
    } catch (error) {
      handleError(error, program.opts());
    }
  });

// Tool execution - can be specified as positional argument or via --tool
program
  .argument('[tool-name]', 'Tool name to execute')
  .argument('[data]', 'JSON data or use --fields for simple syntax')
  .action(async (toolName, data) => {
    try {
      const options = program.opts();
      
      // Determine tool name from argument or --tool option
      const tool = toolName || options.tool;
      if (!tool) {
        console.error(chalk.red('Error: Tool name required. Use --tool <name> or provide as argument.'));
        process.exit(1);
      }
      
      // Parse parameters from --fields or JSON data
      let params = {};
      if (options.fields) {
        params = parseFields(options.fields);
      } else if (data) {
        try {
          params = JSON.parse(data);
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          console.error(chalk.red(`Error: Invalid JSON data: ${errorMessage}`));
          process.exit(3);
        }
      } else {
        // Try to read from stdin
        const stdinData = await readStdin();
        if (stdinData) {
          try {
            params = JSON.parse(stdinData);
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.error(chalk.red(`Error: Invalid JSON from stdin: ${errorMessage}`));
            process.exit(3);
          }
        }
      }
      
      const client = new MCPClient(options as MCPClientOptions);
      await client.connect();
      
      const result = await client.callTool(tool, params);
      
      if (options.json) {
        console.log(JSON.stringify({ success: true, tool, result }, null, 2));
      } else {
        console.log(formatOutput(result, options));
      }
      
      await client.disconnect();
      process.exit(0);
    } catch (error) {
      handleError(error, program.opts());
    }
  });

function formatInspectOutput(tools: any, options: any): string {
  if (!tools || tools.length === 0) {
    return 'No tools available on this server.';
  }
  
  const serverUrl = options.url || 'local server';
  let output = `Available tools on ${chalk.cyan(serverUrl)}:\n\n`;
  
  for (const tool of tools) {
    output += `${chalk.green('Tool:')} ${chalk.bold(tool.name)}\n`;
    
    if (tool.description) {
      output += `  ${chalk.gray('Description:')} ${tool.description}\n`;
    }
    
    if (tool.inputSchema?.properties) {
      output += `  ${chalk.gray('Parameters:')}\n`;
      const props = tool.inputSchema.properties;
      const required = tool.inputSchema.required || [];
      
      for (const [name, schema] of Object.entries(props)) {
        const isRequired = required.includes(name);
        const type = (schema as any).type || 'any';
        const desc = (schema as any).description || '';
        
        output += `    - ${chalk.yellow(name)} (${type}${isRequired ? ', required' : ', optional'})`;
        if (desc) output += `: ${desc}`;
        output += '\n';
      }
    } else {
      output += `  ${chalk.gray('Parameters:')} (none)\n`;
    }
    
    // Show copy-paste ready usage
    const baseCmd = options.url 
      ? `mcp-client --url ${options.url}` 
      : `mcp-client --type ${options.type}${options.cmd ? ` --cmd "${options.cmd}"` : ''}`;
    
    if (tool.inputSchema?.properties && Object.keys(tool.inputSchema.properties).length > 0) {
      const fieldsList = Object.keys(tool.inputSchema.properties).map(p => `${p}=VALUE`).join(',');
      output += `  ${chalk.gray('Usage:')} ${baseCmd} --tool ${tool.name} --fields "${fieldsList}"\n`;
    } else {
      output += `  ${chalk.gray('Usage:')} ${baseCmd} --tool ${tool.name}\n`;
    }
    
    output += '\n';
  }
  
  return output.trim();
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  handleError(error, program.opts());
});

// Parse command line arguments
program.parse();