import mysql from 'mysql2/promise';

export interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
}

export function getMySQLConfig(): MySQLConfig {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME || 'neet_notes_db',
  };
}

let pool: mysql.Pool | null = null;
let isConnected = false;

export function getMySQLPool(): mysql.Pool {
  if (!pool) {
    const config = getMySQLConfig();
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,
    });
  }
  return pool;
}

export async function initMySQL(): Promise<boolean> {
  const config = getMySQLConfig();
  try {
    const p = getMySQLPool();
    const connection = await p.getConnection();
    await connection.ping();
    connection.release();
    isConnected = true;
    console.log(`✅ [MySQL] Successfully connected to database '${config.database}' at ${config.host}:${config.port} as '${config.user}'.`);
    return true;
  } catch (error: any) {
    isConnected = false;
    console.warn(`ℹ️ [MySQL] Connection to ${config.host}:${config.port}/${config.database} unfulfilled (${error.code || error.message}).`);
    console.log(`✅ [Database] Transport system using resilient embedded SQLite store for local operation.`);
    return false;
  }
}

export function isMySQLConnected(): boolean {
  return isConnected;
}
