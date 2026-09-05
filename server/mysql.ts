import mysql from 'mysql2/promise';

export interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
  ssl?: { rejectUnauthorized: boolean };
}

export function getMySQLConfig(): MySQLConfig {
  // Support connection URI if provided (Render / Aiven standard)
  const dbUri = process.env.DATABASE_URL || process.env.MYSQL_URL;
  if (dbUri) {
    try {
      const url = new URL(dbUri.replace(/^mysql:\/\//, 'http://'));
      const isSSL = dbUri.includes('ssl-mode=REQUIRED') || url.hostname.includes('aivencloud.com') || process.env.DB_SSL === 'true';
      return {
        host: url.hostname,
        port: parseInt(url.port || '3306', 10),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password) || undefined,
        database: url.pathname.replace(/^\//, '') || 'defaultdb',
        ssl: isSSL ? { rejectUnauthorized: false } : undefined,
      };
    } catch {
      // Fall through to environment variables
    }
  }

  const host = process.env.DB_HOST || 'gaadi-hisaab-01-akifq027-1bbf.g.aivencloud.com';
  const isAiven = host.includes('aivencloud.com');
  const isSSL = isAiven || process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';

  return {
    host,
    port: parseInt(process.env.DB_PORT || (isAiven ? '10355' : '3306'), 10),
    user: process.env.DB_USER || (isAiven ? 'avnadmin' : 'root'),
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME || (isAiven ? 'defaultdb' : 'gaadi_hisaab'),
    ssl: isSSL ? { rejectUnauthorized: false } : undefined,
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
      ssl: config.ssl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 8000,
    });
  }
  return pool;
}

async function createMySQLTables(conn: mysql.PoolConnection) {
  const schemas = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(64) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(32) NOT NULL DEFAULT 'owner',
      status VARCHAR(32) NOT NULL DEFAULT 'active',
      owner_id VARCHAR(64) NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS owners (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      business_name VARCHAR(255) NOT NULL,
      phone VARCHAR(64) NOT NULL,
      address TEXT,
      city VARCHAR(128),
      state VARCHAR(128),
      gst_number VARCHAR(64),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS drivers (
      id VARCHAR(64) PRIMARY KEY,
      owner_id VARCHAR(64) NOT NULL,
      user_id VARCHAR(64) NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(64) NOT NULL,
      address TEXT,
      license_number VARCHAR(64),
      license_expiry VARCHAR(32),
      joining_date VARCHAR(32),
      salary_monthly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      assigned_vehicle_id VARCHAR(64) NULL,
      emergency_contact VARCHAR(64),
      status VARCHAR(32) NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS vehicles (
      id VARCHAR(64) PRIMARY KEY,
      owner_id VARCHAR(64) NOT NULL,
      vehicle_number VARCHAR(64) NOT NULL,
      vehicle_type VARCHAR(64) NOT NULL,
      brand_model VARCHAR(128),
      manufacturing_year INT,
      current_km INT NOT NULL DEFAULT 0,
      mileage_expected DECIMAL(5,2) DEFAULT 12.00,
      assigned_driver_id VARCHAR(64) NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'available',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(64) PRIMARY KEY,
      owner_id VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(64) NOT NULL,
      address TEXT,
      city VARCHAR(128),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS trips (
      id VARCHAR(64) PRIMARY KEY,
      owner_id VARCHAR(64) NOT NULL,
      trip_number VARCHAR(64) NOT NULL,
      date VARCHAR(32) NOT NULL,
      vehicle_id VARCHAR(64) NOT NULL,
      driver_id VARCHAR(64) NULL,
      customer_id VARCHAR(64) NULL,
      pickup_location VARCHAR(255) NOT NULL,
      drop_location VARCHAR(255) NOT NULL,
      goods_type VARCHAR(128),
      start_km INT DEFAULT 0,
      end_km INT DEFAULT 0,
      total_km INT DEFAULT 0,
      freight_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      loading_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      unloading_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      extra_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      gross_income DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      diesel_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      toll_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      parking_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      other_expenses DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      net_income DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      pending_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      payment_status VARCHAR(32) NOT NULL DEFAULT 'pending',
      payment_method VARCHAR(32) DEFAULT 'cash',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(64) PRIMARY KEY,
      owner_id VARCHAR(64) NOT NULL,
      customer_id VARCHAR(64) NOT NULL,
      trip_id VARCHAR(64) NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_date VARCHAR(32) NOT NULL,
      payment_method VARCHAR(32) NOT NULL DEFAULT 'cash',
      reference_number VARCHAR(128),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS fuel_logs (
      id VARCHAR(64) PRIMARY KEY,
      owner_id VARCHAR(64) NOT NULL,
      vehicle_id VARCHAR(64) NOT NULL,
      driver_id VARCHAR(64) NULL,
      trip_id VARCHAR(64) NULL,
      date VARCHAR(32) NOT NULL,
      liters DECIMAL(10,2) NOT NULL,
      price_per_liter DECIMAL(10,2) NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      odometer_km INT NOT NULL DEFAULT 0,
      fuel_station VARCHAR(255),
      payment_method VARCHAR(32) DEFAULT 'cash',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS expenses (
      id VARCHAR(64) PRIMARY KEY,
      owner_id VARCHAR(64) NOT NULL,
      vehicle_id VARCHAR(64) NULL,
      driver_id VARCHAR(64) NULL,
      trip_id VARCHAR(64) NULL,
      date VARCHAR(32) NOT NULL,
      category VARCHAR(64) NOT NULL DEFAULT 'misc',
      amount DECIMAL(10,2) NOT NULL,
      description TEXT NOT NULL,
      payment_method VARCHAR(32) DEFAULT 'cash',
      receipt_url TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  ];

  for (const sql of schemas) {
    try {
      await conn.query(sql);
    } catch (e: any) {
      console.warn(`[MySQL Schema Warning]`, e.message);
    }
  }
}

export async function initMySQL(): Promise<boolean> {
  const config = getMySQLConfig();
  try {
    const p = getMySQLPool();
    const connection = await p.getConnection();
    await connection.ping();
    await createMySQLTables(connection);
    connection.release();
    isConnected = true;
    console.log(`✅ [MySQL] Successfully connected to Aiven database '${config.database}' at ${config.host}:${config.port} (SSL: ${config.ssl ? 'Enabled' : 'Off'}).`);
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

