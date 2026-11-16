import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedData } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

// Initialize DB if not present
function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), 'utf-8');
    console.log('Initialized db.json with seed data.');
  }
}

initDb();

export function readDb() {
  try {
    initDb();
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB, re-initializing...', err);
    initDb();
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  }
}

export function writeDb(data) {
  try {
    // Atomic write using a temp file
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('Error writing DB:', err);
    return false;
  }
}

export function resetDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), 'utf-8');
  return seedData;
}
