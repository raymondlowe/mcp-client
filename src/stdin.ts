import { createReadStream } from 'fs';

export async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    
    // Check if there's data on stdin
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }
    
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    
    process.stdin.on('end', () => {
      resolve(data.trim());
    });
    
    process.stdin.on('error', (error) => {
      reject(error);
    });
  });
}