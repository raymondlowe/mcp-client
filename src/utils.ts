import chalk from 'chalk';

// Simple Levenshtein distance for string similarity
function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

// Find the most similar tool name
export function suggestSimilarTool(input: string, available: string[]): string | null {
  if (!available.length) return null;
  let minDist = Infinity;
  let best: string | null = null;
  for (const name of available) {
    const dist = levenshtein(input, name);
    if (dist < minDist) {
      minDist = dist;
      best = name;
    }
  }
  // Only suggest if reasonably close
  return minDist <= 3 ? best : null;
}

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

export async function handleError(error: any, options: any, client?: any): Promise<never> {
  const message = error.message || String(error);

  let suggestion = '';
  
  // Suggest using inspect for any TOOL_NOT_FOUND
  if (error.code === 'TOOL_NOT_FOUND') {
    suggestion = `\n${chalk.gray('Use')} ${chalk.cyan('inspect')} ${chalk.gray('to list available tools')}`;
  }

  if (options.json) {
    console.log(JSON.stringify({
      success: false,
      error: message + (suggestion ? ` ${suggestion}` : ''),
      code: error.code || 'UNKNOWN_ERROR'
    }, null, 2));
  } else {
    console.error(chalk.red(`Error: ${message}`) + (suggestion ? suggestion : ''));
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
  return ['local', 'http', 'https', 'sse', 'test'].includes(transport);
}