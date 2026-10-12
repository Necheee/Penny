import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage directory path
const STORAGE_DIR = path.resolve(__dirname, '../data/storage');

// Ensure directory exists
try {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Failed to initialize storage directory:', err.message);
}

/**
 * Read JSON file safely with fallback
 */
export function readJsonFile(filename, defaultValue = null) {
  try {
    const filePath = path.join(STORAGE_DIR, filename);
    if (!fs.existsSync(filePath)) {
      if (defaultValue !== null) {
        writeJsonFile(filename, defaultValue);
      }
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message);
    return defaultValue;
  }
}

/**
 * Write JSON file safely
 */
export function writeJsonFile(filename, data) {
  try {
    const filePath = path.join(STORAGE_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filename}:`, err.message);
    return false;
  }
}
