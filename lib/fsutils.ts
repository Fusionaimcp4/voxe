import { promises as fs } from 'fs';
import path from 'path';

export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code !== 'EEXIST') {
      throw error;
    }
  }
}

export async function writeTextFile(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  await fs.writeFile(filePath, content, 'utf8');
}

export async function readTextFileIfExists(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function atomicJSONUpdate<T extends Record<string, any>>(
  filePath: string, 
  updater: (obj: T) => T
): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  
  let currentData: T = {} as T;
  
  try {
    const existing = await fs.readFile(filePath, 'utf8');
    currentData = JSON.parse(existing);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
      throw error;
    }
    // File doesn't exist, start with empty object
  }
  
  const updatedData = updater(currentData);
  await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf8');
}
