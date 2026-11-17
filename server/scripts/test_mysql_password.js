import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const testPassword = process.argv[2] !== undefined ? process.argv[2] : (process.env.MYSQL_PASSWORD || '');

console.log(`\n🔍 Testing MySQL connection for user 'root' on localhost:3306...`);
console.log(`   Password to test: "${testPassword}"\n`);

async function testPasswordConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: testPassword,
      connectTimeout: 4000
    });

    console.log('🎉 SUCCESS! The MySQL password is CORRECT!');
    console.log('✅ Connected to MySQL Server version:', connection.serverVersion);
    await connection.end();
    process.exit(0);
  } catch (err) {
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('❌ FAILED: Incorrect password (Access Denied).');
      console.log('   The password you provided does not match the MySQL root user password.');
    } else if (err.code === 'ECONNREFUSED') {
      console.log('⚠️  SERVER NOT RUNNING: MySQL Server is not currently running on port 3306.');
      console.log('   How to start it:');
      console.log('   1. Press Windows Key + R, type "services.msc" and hit Enter.');
      console.log('   2. Find "MySQL80" in the list, right-click it, and click "Start".');
      console.log('   3. Re-run this test script.');
    } else {
      console.log(`⚠️  Connection Error [${err.code || 'UNKNOWN'}]:`, err.message || err);
    }
    process.exit(1);
  }
}

testPasswordConnection();
