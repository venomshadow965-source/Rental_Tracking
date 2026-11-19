import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const isRemoteOrAiven = process.env.MYSQL_SSL === 'true' || 
  (process.env.MYSQL_HOST && process.env.MYSQL_HOST.includes('aivencloud.com')) ||
  Boolean(process.env.DATABASE_URL || process.env.MYSQL_URI);

const poolConfig = (process.env.DATABASE_URL || process.env.MYSQL_URI)
  ? {
      uri: process.env.DATABASE_URL || process.env.MYSQL_URI,
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    }
  : {
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'kirayasetu_db',
      ssl: isRemoteOrAiven ? { rejectUnauthorized: false } : undefined,
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    };

const pool = mysql.createPool(poolConfig);

export default pool;

