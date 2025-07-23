import chalk from 'chalk';

export function parseFields(fieldsStr: string): Record<string, any> {
  const params: Record<string, any> = {};
  
  if (!fieldsStr.trim()) {
    return params;
  }
  
  // Split by comma, but handle escaped commas
  const pairs = fieldsStr.split(',').map(pair => pair.trim());
  
  for (const pair of pairs) {
    const equalIndex = pair.indexOf('=');
    if (equalIndex === -1) {
      throw new Error(`Invalid field format: "${pair}". Expected "key=value".`);
    }
    
    const key = pair.substring(0, equalIndex).trim();
    const value = pair.substring(equalIndex + 1).trim();
    
    if (!key) {
      throw new Error(`Empty key in field: "${pair}"`);
    }
    
    // Try to parse as number or boolean, otherwise keep as string
    let parsedValue: any = value;
    
    if (value === 'true') {
      parsedValue = true;
    } else if (value === 'false') {
      parsedValue = false;
    } else if (value === 'null') {
      parsedValue = null;
    } else if (/^\d+$/.test(value)) {
      parsedValue = parseInt(value, 10);
    } else if (/^\d+\.\d+$/.test(value)) {
      parsedValue = parseFloat(value);
    }
    // Remove quotes if present
    else if ((value.startsWith('"') && value.endsWith('"')) || 
             (value.startsWith("'") && value.endsWith("'"))) {
      parsedValue = value.slice(1, -1);
    }
    
    params[key] = parsedValue;
  }
  
  return params;
}

export function formatOutput(result: any, options: any): string {
  if (options.quiet) {
    return '';
  }
  
  if (typeof result === 'string') {
    return result;
  }
  
  if (typeof result === 'object') {
    return JSON.stringify(result, null, 2);
  }
  
  return String(result);
}

export function handleError(error: any, options: any): never {
  const message = error.message || String(error);
  
  if (options.json) {
    console.log(JSON.stringify({
      success: false,
      error: message,
      code: error.code || 'UNKNOWN_ERROR'
    }, null, 2));
  } else {
    console.error(chalk.red(`Error: ${message}`));
  }
  
  // Exit with appropriate code
  if (error.code === 'TOOL_NOT_FOUND') {
    process.exit(2);
  } else if (error.code === 'INVALID_PARAMS') {
    process.exit(3);
  } else if (error.code === 'SERVER_ERROR') {
    process.exit(4);
  } else {
    process.exit(1);
  }
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidTransport(transport: string): boolean {
  return ['local', 'http', 'https', 'sse'].includes(transport);
}