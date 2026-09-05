import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'gaadi_hisaab.db');
export const db = new Database(dbPath);

// Enable Foreign Keys and Write-Ahead Logging for speed & safety
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('driver', 'owner', 'fleet_owner', 'admin')) NOT NULL DEFAULT 'owner',
      status TEXT CHECK(status IN ('active', 'suspended', 'pending')) NOT NULL DEFAULT 'active',
      owner_id TEXT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS owners (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      business_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      city TEXT,
      state TEXT,
      gst_number TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      user_id TEXT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      license_number TEXT,
      license_expiry TEXT,
      joining_date TEXT,
      salary_monthly REAL NOT NULL DEFAULT 0.00,
      assigned_vehicle_id TEXT NULL,
      emergency_contact TEXT,
      status TEXT CHECK(status IN ('active', 'inactive')) NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      vehicle_number TEXT NOT NULL,
      vehicle_type TEXT NOT NULL,
      brand_model TEXT,
      manufacturing_year INTEGER,
      current_km INTEGER NOT NULL DEFAULT 0,
      mileage_expected REAL DEFAULT 12.00,
      assigned_driver_id TEXT NULL,
      status TEXT CHECK(status IN ('available', 'on_trip', 'maintenance')) NOT NULL DEFAULT 'available',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_driver_id) REFERENCES drivers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      city TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      trip_number TEXT NOT NULL,
      date TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      driver_id TEXT NULL,
      customer_id TEXT NULL,
      pickup_location TEXT NOT NULL,
      drop_location TEXT NOT NULL,
      goods_type TEXT,
      start_km INTEGER DEFAULT 0,
      end_km INTEGER DEFAULT 0,
      total_km INTEGER DEFAULT 0,
      freight_amount REAL NOT NULL DEFAULT 0.00,
      loading_charge REAL NOT NULL DEFAULT 0.00,
      unloading_charge REAL NOT NULL DEFAULT 0.00,
      extra_charge REAL NOT NULL DEFAULT 0.00,
      gross_income REAL NOT NULL DEFAULT 0.00,
      diesel_cost REAL NOT NULL DEFAULT 0.00,
      toll_cost REAL NOT NULL DEFAULT 0.00,
      parking_cost REAL NOT NULL DEFAULT 0.00,
      other_expenses REAL NOT NULL DEFAULT 0.00,
      net_income REAL NOT NULL DEFAULT 0.00,
      paid_amount REAL NOT NULL DEFAULT 0.00,
      pending_amount REAL NOT NULL DEFAULT 0.00,
      payment_status TEXT CHECK(payment_status IN ('paid', 'partial', 'pending')) NOT NULL DEFAULT 'pending',
      payment_method TEXT DEFAULT 'cash',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      trip_id TEXT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT CHECK(payment_method IN ('cash', 'upi', 'bank_transfer', 'cheque')) NOT NULL DEFAULT 'cash',
      reference_number TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS fuel_logs (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      driver_id TEXT NULL,
      trip_id TEXT NULL,
      date TEXT NOT NULL,
      liters REAL NOT NULL,
      price_per_liter REAL NOT NULL,
      total_amount REAL NOT NULL,
      odometer_km INTEGER NOT NULL DEFAULT 0,
      fuel_station TEXT,
      payment_method TEXT DEFAULT 'cash',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      vehicle_id TEXT NULL,
      driver_id TEXT NULL,
      trip_id TEXT NULL,
      date TEXT NOT NULL,
      category TEXT CHECK(category IN ('diesel', 'toll', 'parking', 'loading', 'unloading', 'maintenance', 'tyre', 'battery', 'food', 'challan', 'misc')) NOT NULL DEFAULT 'misc',
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      receipt_url TEXT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS maintenance (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      date TEXT NOT NULL,
      odometer_km INTEGER DEFAULT 0,
      service_type TEXT NOT NULL,
      amount REAL NOT NULL,
      mechanic_name TEXT,
      mechanic_phone TEXT,
      invoice_number TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      doc_type TEXT CHECK(doc_type IN ('rc', 'insurance', 'puc', 'fitness', 'permit', 'tax', 'other')) NOT NULL,
      doc_number TEXT NOT NULL,
      issue_date TEXT NULL,
      expiry_date TEXT NOT NULL,
      alert_days_before INTEGER DEFAULT 15,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tyres (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      position TEXT NOT NULL,
      brand TEXT NOT NULL,
      size TEXT NOT NULL,
      purchase_date TEXT,
      purchase_cost REAL DEFAULT 0.00,
      install_km INTEGER DEFAULT 0,
      current_km INTEGER DEFAULT 0,
      status TEXT CHECK(status IN ('active', 'replaced', 'retreaded')) NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS driver_advances (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      driver_id TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      reason TEXT,
      status TEXT CHECK(status IN ('pending', 'deducted')) NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS salary_payments (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      driver_id TEXT NOT NULL,
      month_year TEXT NOT NULL,
      basic_salary REAL NOT NULL,
      advance_deducted REAL DEFAULT 0.00,
      bonus_incentive REAL DEFAULT 0.00,
      net_paid REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      bill_number TEXT NOT NULL,
      trip_id TEXT NULL,
      customer_id TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      driver_id TEXT NULL,
      date TEXT NOT NULL,
      pickup TEXT NOT NULL,
      destination TEXT NOT NULL,
      goods TEXT,
      freight REAL NOT NULL DEFAULT 0.00,
      loading REAL NOT NULL DEFAULT 0.00,
      unloading REAL NOT NULL DEFAULT 0.00,
      extra_charges REAL NOT NULL DEFAULT 0.00,
      total_amount REAL NOT NULL DEFAULT 0.00,
      paid_amount REAL NOT NULL DEFAULT 0.00,
      balance_amount REAL NOT NULL DEFAULT 0.00,
      status TEXT CHECK(status IN ('paid', 'partial', 'pending')) NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT CHECK(severity IN ('info', 'warning', 'danger')) NOT NULL DEFAULT 'info',
      is_read INTEGER NOT NULL DEFAULT 0,
      link TEXT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      owner_id TEXT UNIQUE NOT NULL,
      default_vehicle_id TEXT NULL,
      default_language TEXT DEFAULT 'en',
      currency_symbol TEXT DEFAULT '₹',
      business_logo TEXT NULL,
      sms_alerts_enabled INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
    );
  `);

  seedInitialData();
  ensureComprehensiveDemoCustomers();
  ensureAdminAccount();
}

export function ensureAdminAccount() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'akifq027@gmail.com').trim().toLowerCase();
  const adminPassword = (process.env.ADMIN_PASSWORD || '6472425227').trim();
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(adminPassword, salt);

  try {
    const existing = db.prepare('SELECT id, email, role FROM users WHERE email = ?').get(adminEmail) as any;
    if (!existing) {
      db.prepare(`
        INSERT INTO users (id, name, email, phone, password_hash, role, status, owner_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run('user-admin-root', 'Super Admin', adminEmail, '9999999999', passwordHash, 'admin', 'active', null);
      console.log(`✅ [Auth] Super Admin initialized for ${adminEmail}`);
    } else {
      db.prepare(`
        UPDATE users SET password_hash = ?, role = 'admin', status = 'active' WHERE email = ?
      `).run(passwordHash, adminEmail);
      console.log(`✅ [Auth] Super Admin credentials updated for ${adminEmail}`);
    }
  } catch (err) {
    console.error('Failed to ensure admin account:', err);
  }
}

export function ensureComprehensiveDemoCustomers(ownerId: string = 'owner-1') {
  // Ensure customer columns exist
  try { db.exec("ALTER TABLE customers ADD COLUMN gst_number TEXT;"); } catch {}
  try { db.exec("ALTER TABLE customers ADD COLUMN contact_person TEXT;"); } catch {}
  try { db.exec("ALTER TABLE customers ADD COLUMN category TEXT;"); } catch {}
  try { db.exec("ALTER TABLE customers ADD COLUMN regular_route TEXT;"); } catch {}
  try { db.exec("ALTER TABLE customers ADD COLUMN credit_period_days INTEGER DEFAULT 7;"); } catch {}
  try { db.exec("ALTER TABLE customers ADD COLUMN credit_limit REAL DEFAULT 50000;"); } catch {}

  // Update existing cust-1, cust-2, cust-3 with rich transport profile
  try {
    db.prepare(`
      UPDATE customers SET
        contact_person = 'Ramesh Bhai (Proprietor)',
        category = 'Mandi & Foodgrains',
        regular_route = 'Kattedan Mandi ➔ Medchal / Shamshabad',
        gst_number = '36AABCU9821M1ZT',
        credit_period_days = 7,
        credit_limit = 60000,
        notes = 'Daily foodgrain, pulses & edible oil shipments. Saturday weekly ledger settlement.'
      WHERE id = 'cust-1' AND owner_id = ?
    `).run(ownerId);

    db.prepare(`
      UPDATE customers SET
        contact_person = 'Balaji Gupta',
        category = 'Hardware & Steel Goods',
        regular_route = 'Ranigunj ➔ Patancheru Phase 2 / Uppal',
        gst_number = '36AAHFB4412K1Z9',
        credit_period_days = 15,
        credit_limit = 75000,
        notes = 'Heavy GI pipes, PVC fittings and iron angle bars. 50% advance at loading, balance on bilty receipt.'
      WHERE id = 'cust-2' AND owner_id = ?
    `).run(ownerId);

    db.prepare(`
      UPDATE customers SET
        contact_person = 'S. K. Verma (Dispatch Head)',
        category = 'Corrugated Boxes & Packaging',
        regular_route = 'Balanagar ➔ Kothapet Fruit Market / Jeedimetla',
        gst_number = '36AABCP1102Q1ZY',
        credit_period_days = 30,
        credit_limit = 100000,
        notes = 'Bulky corrugated box carton rolls. Monthly bill clearing on 10th.'
      WHERE id = 'cust-3' AND owner_id = ?
    `).run(ownerId);
  } catch (e) {
    console.error('Error updating existing customers:', e);
  }

  // Check and insert full suite of 9 authentic Indian transport customers
  const demoCustomers = [
    {
      id: 'cust-4',
      name: 'Kisan Krishi Sabzi Mandi & Cold Storage',
      phone: '9849088771',
      contact_person: 'Patel Ji / Ramdas Yadav',
      category: 'Agricultural Mandi & Cold Storage',
      city: 'Secunderabad',
      address: 'Platform #6, New Agricultural Market Yard, Bowenpally, Secunderabad',
      regular_route: 'Bowenpally Mandi ➔ Gudimalkapur / Moinabad',
      gst_number: '36AAEPP3321L1ZN',
      credit_period_days: 3,
      credit_limit: 35000,
      notes: 'Early morning 4:30 AM mandi loads. Fresh vegetables & onion/potato sacks. Immediate cash/UPI clearance.'
    },
    {
      id: 'cust-5',
      name: 'UltraTech & ACC Cement Depot',
      phone: '9848077889',
      contact_person: 'Rakesh Agarwal (Dealer)',
      category: 'Cement & Building Materials',
      city: 'Hyderabad',
      address: 'Shed 5, Highway Goods Yard, Near Y-Junction, Kukatpally, Hyderabad',
      regular_route: 'Kukatpally Depot ➔ Financial District / Gachibowli Sites',
      gst_number: '36AACCU7789P1ZX',
      credit_period_days: 15,
      credit_limit: 80000,
      notes: '50kg cement bags (120-150 bags per trip). Extra loading/unloading hamali paid directly.'
    },
    {
      id: 'cust-6',
      name: 'Shree Ganesh Parivahan & Transport Broker',
      phone: '9876599882',
      contact_person: 'Mahender Sharma (Broker / Munim)',
      category: 'Transport Broker & FTL Commission',
      city: 'Hyderabad',
      address: 'Room 12, Transport Chambers, G-Floor, Autonagar, Hyderabad',
      regular_route: 'Autonagar ➔ Suryapet / Warangal Highway',
      gst_number: '36AATPS5544R1Z3',
      credit_period_days: 10,
      credit_limit: 120000,
      notes: 'Highway FTL freight & return load broker. Advance diesel slip + cash, balance upon POD copy submission.'
    },
    {
      id: 'cust-7',
      name: 'Deccan Steel & Rolling Mills',
      phone: '9848044332',
      contact_person: 'Sardar Manpreet Singh',
      category: 'Iron & Steel Manufacturing',
      city: 'Hyderabad',
      address: 'C-19, Industrial Development Area, Sanathnagar, Hyderabad',
      regular_route: 'Sanathnagar ➔ Cherlapally / Moula Ali Sheds',
      gst_number: '36AABCD3399F1ZU',
      credit_period_days: 15,
      credit_limit: 90000,
      notes: 'Steel billets, round bars & structural rebar. Strict weighbridge slip (Dharam Kanta) verification.'
    },
    {
      id: 'cust-8',
      name: 'GMR Express Cargo & Courier Hub',
      phone: '9848066554',
      contact_person: 'Vijay Anand (Logistics Operations)',
      category: 'Air Cargo & E-Commerce',
      city: 'Hyderabad',
      address: 'Cargo Satellite Terminal, Rajiv Gandhi Int Airport, Shamshabad, Hyderabad',
      regular_route: 'Shamshabad Airport ➔ Begumpet / Somajiguda Hub',
      gst_number: '36AABCG8822E1ZK',
      credit_period_days: 7,
      credit_limit: 50000,
      notes: 'Time-critical air cargo parcels, pharmaceuticals & electronic parts. 100% on-time NEFT bank clearance.'
    },
    {
      id: 'cust-9',
      name: 'National Fertilisers & Agri Inputs',
      phone: '9848099112',
      contact_person: 'Srinivas Rao',
      category: 'Fertilizers & Agriculture Seeds',
      city: 'Hyderabad',
      address: 'Opp Rythu Bazaar, Ring Road, LB Nagar, Hyderabad',
      regular_route: 'LB Nagar Depot ➔ Choutuppal / Nalgonda Mandi',
      gst_number: '36AAACN2201D1Z8',
      credit_period_days: 7,
      credit_limit: 65000,
      notes: 'Urea, DAP and hybrid seeds sacks. Bulk seasonal transportation.'
    }
  ];

  const insertCust = db.prepare(`
    INSERT OR REPLACE INTO customers (
      id, owner_id, name, phone, address, city, notes,
      gst_number, contact_person, category, regular_route, credit_period_days, credit_limit
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of demoCustomers) {
    insertCust.run(
      c.id, ownerId, c.name, c.phone, c.address, c.city, c.notes,
      c.gst_number, c.contact_person, c.category, c.regular_route, c.credit_period_days, c.credit_limit
    );
  }

  // Seed authentic pure gaadi trips for complete customer ledger info
  const insertTrip = db.prepare(`
    INSERT OR REPLACE INTO trips (
      id, owner_id, trip_number, date, vehicle_id, driver_id, customer_id,
      pickup_location, drop_location, goods_type, start_km, end_km, total_km,
      freight_amount, loading_charge, unloading_charge, extra_charge, gross_income,
      diesel_cost, toll_cost, parking_cost, other_expenses, net_income,
      paid_amount, pending_amount, payment_status, payment_method, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPayment = db.prepare(`
    INSERT OR REPLACE INTO payments (id, owner_id, customer_id, trip_id, amount, payment_date, payment_method, reference_number, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBill = db.prepare(`
    INSERT OR REPLACE INTO bills (
      id, owner_id, bill_number, trip_id, customer_id, vehicle_id, driver_id,
      date, pickup, destination, goods, freight, loading, unloading, extra_charges,
      total_amount, paid_amount, balance_amount, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Extra trips & payments for cust-1 (ABC Traders)
  insertTrip.run(
    'trip-1b', ownerId, 'TRP-20260830-01', '2026-08-30', 'veh-3', 'driver-1', 'cust-1',
    'Kattedan Mandi', 'Bowenpally Mandi', 'Dal & Pulses Sacks (3 Ton)', 94000, 94080, 80,
    3500.00, 150.00, 150.00, 0.00, 3800.00,
    900.00, 80.00, 50.00, 0.00, 2770.00,
    2000.00, 1800.00, 'partial', 'upi', 'Part payment received at unloading point'
  );
  insertPayment.run('pay-1b', ownerId, 'cust-1', 'trip-1b', 2000.00, '2026-08-30', 'upi', 'UPI/20260830/19082', 'Part payment for Dal sacks');
  insertBill.run('bill-1b', ownerId, 'BILL-2026-002', 'trip-1b', 'cust-1', 'veh-3', 'driver-1', '2026-08-30', 'Kattedan Mandi', 'Bowenpally Mandi', 'Dal & Pulses Sacks', 3500, 150, 150, 0, 3800, 2000, 1800, 'partial');

  // Extra trip for cust-2 (Sri Balaji Hardware)
  insertTrip.run(
    'trip-2b', ownerId, 'TRP-20260831-01', '2026-08-31', 'veh-3', 'driver-2', 'cust-2',
    'Ranigunj Market', 'Uppal Industrial Area', 'MS Angle Iron & Rods (2.5 Ton)', 94080, 94160, 80,
    3900.00, 150.00, 150.00, 0.00, 4200.00,
    950.00, 80.00, 40.00, 0.00, 3130.00,
    2000.00, 2200.00, 'partial', 'cash', '50% advance given, remaining pending on bilty'
  );
  insertPayment.run('pay-2b', ownerId, 'cust-2', 'trip-2b', 2000.00, '2026-08-31', 'cash', 'CASH-REC-03', 'Advance cash at Ranigunj loading');
  insertBill.run('bill-2b', ownerId, 'BILL-2026-003', 'trip-2b', 'cust-2', 'veh-3', 'driver-2', '2026-08-31', 'Ranigunj Market', 'Uppal Industrial Area', 'MS Angle Iron & Rods', 3900, 150, 150, 0, 4200, 2000, 2200, 'partial');

  // Extra trip for cust-3 (Pooja Plastics)
  insertTrip.run(
    'trip-3b', ownerId, 'TRP-20260829-01', '2026-08-29', 'veh-1', 'driver-1', 'cust-3',
    'Balanagar IDPL', 'Jeedimetla Phase 1', 'Printed Carton Packaging Rolls', 38180, 38260, 80,
    2500.00, 150.00, 150.00, 0.00, 2800.00,
    600.00, 0.00, 30.00, 0.00, 2170.00,
    1000.00, 1800.00, 'partial', 'upi', 'Bill submitted to accounts for 10th clearance'
  );
  insertPayment.run('pay-3b', ownerId, 'cust-3', 'trip-3b', 1000.00, '2026-08-29', 'upi', 'UPI/20260829/44120', 'Advance freight received');

  // Trips for cust-4: Kisan Krishi Mandi (All Clear / No Dues)
  insertTrip.run(
    'trip-4a', ownerId, 'TRP-20260903-03', '2026-09-03', 'veh-1', 'driver-1', 'cust-4',
    'Bowenpally Mandi', 'Moinabad Farm Depot', 'Green Chilly & Fresh Tomato Crates', 38450, 38510, 60,
    2200.00, 100.00, 100.00, 0.00, 2400.00,
    550.00, 50.00, 30.00, 0.00, 1770.00,
    2400.00, 0.00, 'paid', 'cash', 'Full cash payment handed over by Patel Ji at Mandi'
  );
  insertPayment.run('pay-4a', ownerId, 'cust-4', 'trip-4a', 2400.00, '2026-09-03', 'cash', 'CASH-REC-MANDI1', 'Immediate cash clearance on spot');

  insertTrip.run(
    'trip-4b', ownerId, 'TRP-20260901-02', '2026-09-01', 'veh-2', 'driver-2', 'cust-4',
    'Gajwel Cold Storage', 'Bowenpally Mandi', 'Potato Sacks & Onion Bags (2.2 Ton)', 61800, 61900, 100,
    3200.00, 150.00, 150.00, 0.00, 3500.00,
    950.00, 80.00, 40.00, 0.00, 2430.00,
    3500.00, 0.00, 'paid', 'upi', 'Full payment settled immediately via PhonePe'
  );
  insertPayment.run('pay-4b', ownerId, 'cust-4', 'trip-4b', 3500.00, '2026-09-01', 'upi', 'UPI/20260901/77812', 'Settled full amount via UPI');

  insertTrip.run(
    'trip-4c', ownerId, 'TRP-20260828-01', '2026-08-28', 'veh-1', 'driver-1', 'cust-4',
    'Bowenpally Mandi', 'Gudimalkapur Mandi', 'Fresh Farm Vegetables & Melons', 38080, 38180, 100,
    2800.00, 150.00, 150.00, 0.00, 3100.00,
    750.00, 60.00, 40.00, 0.00, 2250.00,
    3100.00, 0.00, 'paid', 'cash', 'Spot settlement'
  );
  insertPayment.run('pay-4c', ownerId, 'cust-4', 'trip-4c', 3100.00, '2026-08-28', 'cash', 'CASH-REC-MANDI2', 'Cleared on delivery');

  // Trips for cust-5: UltraTech & ACC Cement Depot
  insertTrip.run(
    'trip-5a', ownerId, 'TRP-20260902-02', '2026-09-02', 'veh-2', 'driver-2', 'cust-5',
    'Kukatpally Depot', 'Financial District Site', '120 Bags ACC Suraksha 50kg Cement', 62100, 62180, 80,
    3500.00, 200.00, 200.00, 0.00, 3900.00,
    900.00, 60.00, 50.00, 50.00, 2840.00,
    2500.00, 1400.00, 'partial', 'upi', 'Site engineer paid ₹2,500 advance, balance with main dealer'
  );
  insertPayment.run('pay-5a', ownerId, 'cust-5', 'trip-5a', 2500.00, '2026-09-02', 'upi', 'UPI/20260902/55129', 'Site advance paid');

  insertTrip.run(
    'trip-5b', ownerId, 'TRP-20260828-02', '2026-08-28', 'veh-3', 'driver-2', 'cust-5',
    'Kukatpally Depot', 'Nanakramguda Construction Site', '150 Bags UltraTech Super Cement', 93900, 94000, 100,
    4100.00, 200.00, 200.00, 0.00, 4500.00,
    1100.00, 80.00, 50.00, 0.00, 3270.00,
    4500.00, 0.00, 'paid', 'bank_transfer', 'Cleared by dealer office'
  );
  insertPayment.run('pay-5b', ownerId, 'cust-5', 'trip-5b', 4500.00, '2026-08-28', 'bank_transfer', 'NEFT-ULTRA-8812', 'Full payment cleared');

  // Trips for cust-6: Shree Ganesh Parivahan (Transport Broker)
  insertTrip.run(
    'trip-6a', ownerId, 'TRP-20260903-04', '2026-09-03', 'veh-3', 'driver-2', 'cust-6',
    'Autonagar Transport Hub', 'Suryapet Highway Yard', 'Heavy Electrical Cables & Transformer Parts', 94200, 94360, 160,
    6200.00, 300.00, 300.00, 0.00, 6800.00,
    1800.00, 220.00, 60.00, 100.00, 4620.00,
    4000.00, 2800.00, 'partial', 'upi', 'Advance diesel slip + ₹1,000 cash, balance on POD copy submission'
  );
  insertPayment.run('pay-6a', ownerId, 'cust-6', 'trip-6a', 4000.00, '2026-09-03', 'upi', 'UPI/20260903/BROKER1', 'Booking advance received');

  insertTrip.run(
    'trip-6b', ownerId, 'TRP-20260827-01', '2026-08-27', 'veh-3', 'driver-1', 'cust-6',
    'Autonagar Transport Hub', 'Warangal Mandi', 'General FMCG Goods (Return Load Booking)', 93740, 93900, 160,
    5000.00, 250.00, 250.00, 0.00, 5500.00,
    1600.00, 180.00, 50.00, 0.00, 3670.00,
    5500.00, 0.00, 'paid', 'bank_transfer', 'Full balance cleared after signed POD submitted'
  );
  insertPayment.run('pay-6b', ownerId, 'cust-6', 'trip-6b', 5500.00, '2026-08-27', 'bank_transfer', 'NEFT-BROKER-991', 'Cleared upon delivery receipt');

  // Trips for cust-7: Deccan Steel & Rolling Mills
  insertTrip.run(
    'trip-7a', ownerId, 'TRP-20260902-03', '2026-09-02', 'veh-2', 'driver-2', 'cust-7',
    'Sanathnagar Industrial Mills', 'Cherlapally Structural Shed', 'TMT Rebars & MS Steel Strips (2.8 Ton)', 62180, 62270, 90,
    4200.00, 200.00, 200.00, 0.00, 4600.00,
    1100.00, 80.00, 40.00, 0.00, 3380.00,
    2000.00, 2600.00, 'partial', 'cash', 'Weighbridge slip attached, balance due in 15 days'
  );
  insertPayment.run('pay-7a', ownerId, 'cust-7', 'trip-7a', 2000.00, '2026-09-02', 'cash', 'CASH-STEEL-01', 'Advance cash from mill gate');

  insertTrip.run(
    'trip-7b', ownerId, 'TRP-20260825-01', '2026-08-25', 'veh-3', 'driver-1', 'cust-7',
    'Sanathnagar Industrial Mills', 'Moula Ali Fabrication Shed', 'Round Iron Coils & Flats (3 Ton)', 93580, 93740, 160,
    4800.00, 200.00, 200.00, 0.00, 5200.00,
    1300.00, 100.00, 50.00, 0.00, 3750.00,
    5200.00, 0.00, 'paid', 'bank_transfer', 'Payment received via RTGS'
  );
  insertPayment.run('pay-7b', ownerId, 'cust-7', 'trip-7b', 5200.00, '2026-08-25', 'bank_transfer', 'RTGS-STEEL-440', 'Full mill payment cleared');

  // Trips for cust-8: GMR Express Cargo Airport (All Clear / No Dues)
  insertTrip.run(
    'trip-8a', ownerId, 'TRP-20260903-05', '2026-09-03', 'veh-1', 'driver-1', 'cust-8',
    'Shamshabad Cargo Satellite', 'Begumpet Courier Hub', 'Air Shipment Sealed Boxes & Electronics', 38510, 38580, 70,
    3200.00, 100.00, 100.00, 0.00, 3400.00,
    700.00, 80.00, 40.00, 0.00, 2580.00,
    3400.00, 0.00, 'paid', 'bank_transfer', 'Airport express run, 100% NEFT clearance'
  );
  insertPayment.run('pay-8a', ownerId, 'cust-8', 'trip-8a', 3400.00, '2026-09-03', 'bank_transfer', 'NEFT-GMR-001', 'Air cargo clearance');

  insertTrip.run(
    'trip-8b', ownerId, 'TRP-20260830-02', '2026-08-30', 'veh-1', 'driver-1', 'cust-8',
    'Shamshabad Cargo Satellite', 'Banjara Hills Retail Depot', 'Pharmaceutical Cold Chain Vaccine Boxes', 38380, 38450, 70,
    2900.00, 100.00, 100.00, 0.00, 3100.00,
    650.00, 80.00, 40.00, 0.00, 2330.00,
    3100.00, 0.00, 'paid', 'bank_transfer', 'Immediate bank transfer upon delivery'
  );
  insertPayment.run('pay-8b', ownerId, 'cust-8', 'trip-8b', 3100.00, '2026-08-30', 'bank_transfer', 'NEFT-GMR-002', 'Pharma load clearance');

  // Trips for cust-9: National Fertilisers & Agri Inputs
  insertTrip.run(
    'trip-9a', ownerId, 'TRP-20260901-03', '2026-09-01', 'veh-2', 'driver-2', 'cust-9',
    'LB Nagar Goods Depot', 'Choutuppal Yard', 'Urea & DAP Fertilizer Sacks (2 Ton)', 61900, 62020, 120,
    2900.00, 150.00, 150.00, 0.00, 3200.00,
    900.00, 80.00, 30.00, 0.00, 2190.00,
    1500.00, 1700.00, 'partial', 'cash', 'Half payment handed over, remaining due next week'
  );
  insertPayment.run('pay-9a', ownerId, 'cust-9', 'trip-9a', 1500.00, '2026-09-01', 'cash', 'CASH-AGRI-01', 'Part cash at godown');

  insertTrip.run(
    'trip-9b', ownerId, 'TRP-20260826-01', '2026-08-26', 'veh-3', 'driver-1', 'cust-9',
    'LB Nagar Goods Depot', 'Nalgonda Mandi', 'Hybrid Seeds & Organic Compost Sacks', 93420, 93580, 160,
    3600.00, 200.00, 200.00, 0.00, 4000.00,
    1200.00, 120.00, 40.00, 0.00, 2640.00,
    4000.00, 0.00, 'paid', 'upi', 'Settled via Google Pay'
  );
  insertPayment.run('pay-9b', ownerId, 'cust-9', 'trip-9b', 4000.00, '2026-08-26', 'upi', 'UPI/20260826/AGRI9', 'Cleared in full');

  console.log('Gaadi Hisaab customer khata demo successfully populated with 9 realistic transport clients.');
}

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount && userCount.count > 0) return; // Already seeded

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('password123', salt);
  const adminHash = bcrypt.hashSync('admin123', salt);

  const ownerUserId = 'user-owner-1';
  const ownerId = 'owner-1';
  const driverUserId = 'user-driver-1';
  const adminUserId = 'user-admin-1';
  const fleetOwnerUserId = 'user-fleet-1';

  // Seed Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, phone, password_hash, role, status, owner_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(ownerUserId, 'Balwinder Singh', 'owner@gaadihisaab.in', '9876543210', passwordHash, 'owner', 'active', ownerId);
  insertUser.run(driverUserId, 'Ramesh Yadav', 'driver@gaadihisaab.in', '9876543211', passwordHash, 'driver', 'active', ownerId);
  insertUser.run(adminUserId, 'Super Admin', 'admin@gaadihisaab.in', '9876543212', adminHash, 'admin', 'active', null);
  insertUser.run(fleetOwnerUserId, 'Kavitha Transport', 'fleet@gaadihisaab.in', '9876543213', passwordHash, 'fleet_owner', 'active', ownerId);

  // Seed Owner Business Profile
  db.prepare(`
    INSERT INTO owners (id, user_id, business_name, phone, address, city, state, gst_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(ownerId, ownerUserId, 'Singh Roadlines & Logistics', '9876543210', 'Plot 42, Transport Nagar, Autonagar', 'Hyderabad', 'Telangana', '36AAAAA0000A1Z5');

  // Seed Drivers
  const driver1Id = 'driver-1';
  const driver2Id = 'driver-2';
  db.prepare(`
    INSERT INTO drivers (id, owner_id, user_id, name, phone, address, license_number, license_expiry, joining_date, salary_monthly, assigned_vehicle_id, emergency_contact, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(driver1Id, ownerId, driverUserId, 'Ramesh Yadav', '9876543211', 'Amberpet, Hyderabad', 'TS0920190012345', '2027-11-20', '2024-01-15', 18000.00, 'veh-1', '9876500001 (Brother)', 'active');

  db.prepare(`
    INSERT INTO drivers (id, owner_id, user_id, name, phone, address, license_number, license_expiry, joining_date, salary_monthly, assigned_vehicle_id, emergency_contact, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(driver2Id, ownerId, null, 'Suresh Reddy', '9876543214', 'LB Nagar, Hyderabad', 'TS0820200054321', '2026-10-15', '2024-03-01', 19500.00, 'veh-2', '9876500002 (Wife)', 'active');

  // Seed Vehicles
  const veh1Id = 'veh-1';
  const veh2Id = 'veh-2';
  const veh3Id = 'veh-3';
  const insertVeh = db.prepare(`
    INSERT INTO vehicles (id, owner_id, vehicle_number, vehicle_type, brand_model, manufacturing_year, current_km, mileage_expected, assigned_driver_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertVeh.run(veh1Id, ownerId, 'TS 07 UA 4567', 'Tata Ace Gold', 'Tata Ace Petrol/CNG', 2023, 38450, 15.5, driver1Id, 'available');
  insertVeh.run(veh2Id, ownerId, 'AP 29 TA 1234', 'Mahindra Bolero Maxi Truck', 'Bolero Pickup 1.7T', 2022, 62100, 13.0, driver2Id, 'available');
  insertVeh.run(veh3Id, ownerId, 'TS 09 DC 8899', 'Eicher Pro 2049', 'DCM 14 Feet Truck', 2021, 94200, 8.5, null, 'available');

  // Seed Customers
  const cust1Id = 'cust-1';
  const cust2Id = 'cust-2';
  const cust3Id = 'cust-3';
  const insertCust = db.prepare(`
    INSERT INTO customers (id, owner_id, name, phone, address, city, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertCust.run(cust1Id, ownerId, 'ABC Traders & Wholesalers', '9848011223', 'Kattedan Industrial Area', 'Hyderabad', 'Regular grocery loads, payment weekly');
  insertCust.run(cust2Id, ownerId, 'Sri Balaji Hardware & Pipes', '9848033445', 'Ranigunj Hardware Market', 'Secunderabad', 'Iron pipes & fittings, partial advance');
  insertCust.run(cust3Id, ownerId, 'Pooja Plastics & Packaging', '9848055667', 'Balanagar IDPL Colony', 'Hyderabad', 'Box carton rolls, pays via UPI');

  // Helper date for today: 2026-09-03
  const today = '2026-09-03';
  const yesterday = '2026-09-02';
  const twoDaysAgo = '2026-09-01';

  // Seed Trips (Daily Hisaab)
  const insertTrip = db.prepare(`
    INSERT INTO trips (
      id, owner_id, trip_number, date, vehicle_id, driver_id, customer_id,
      pickup_location, drop_location, goods_type, start_km, end_km, total_km,
      freight_amount, loading_charge, unloading_charge, extra_charge, gross_income,
      diesel_cost, toll_cost, parking_cost, other_expenses, net_income,
      paid_amount, pending_amount, payment_status, payment_method, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Trip 1 (Today)
  insertTrip.run(
    'trip-1', ownerId, 'TRP-20260903-01', today, veh1Id, driver1Id, cust1Id,
    'Kattedan', 'Medchal Market', 'Grocery Bags & Oil Cans', 38380, 38450, 70,
    3000.00, 200.00, 100.00, 0.00, 3300.00,
    700.00, 80.00, 50.00, 50.00, 2420.00,
    2500.00, 800.00, 'partial', 'upi', 'Fast delivery, smooth unloading'
  );

  // Trip 2 (Today)
  insertTrip.run(
    'trip-2', ownerId, 'TRP-20260903-02', today, veh2Id, driver2Id, cust2Id,
    'Ranigunj', 'Patancheru Phase 2', 'PVC Pipes & Fitting Boxes', 62020, 62100, 80,
    2200.00, 150.00, 150.00, 100.00, 2600.00,
    600.00, 60.00, 40.00, 0.00, 1900.00,
    2600.00, 0.00, 'paid', 'cash', 'Full cash payment handed over'
  );

  // Trip 3 (Yesterday)
  insertTrip.run(
    'trip-3', ownerId, 'TRP-20260902-01', yesterday, veh1Id, driver1Id, cust3Id,
    'Balanagar', 'Kothapet Fruit Market', 'Plastic Packaging Crates', 38260, 38380, 120,
    3800.00, 200.00, 200.00, 0.00, 4200.00,
    1100.00, 100.00, 50.00, 100.00, 2850.00,
    3000.00, 1200.00, 'partial', 'cash', 'Balance promised on Friday'
  );

  // Trip 4 (Two days ago)
  insertTrip.run(
    'trip-4', ownerId, 'TRP-20260901-01', twoDaysAgo, veh2Id, driver2Id, cust1Id,
    'Kattedan', 'Shamshabad Airport Zone', 'Flour & Rice Sacks', 61900, 62020, 120,
    4000.00, 250.00, 250.00, 200.00, 4700.00,
    1200.00, 120.00, 60.00, 50.00, 3270.00,
    4700.00, 0.00, 'paid', 'bank_transfer', 'Online NEFT received'
  );

  // Seed Customer Payments (Udhaar Ledger)
  const insertPayment = db.prepare(`
    INSERT INTO payments (id, owner_id, customer_id, trip_id, amount, payment_date, payment_method, reference_number, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPayment.run('pay-1', ownerId, cust1Id, 'trip-1', 2500.00, today, 'upi', 'UPI/20260903/88921', 'Advance at unloading');
  insertPayment.run('pay-2', ownerId, cust2Id, 'trip-2', 2600.00, today, 'cash', 'CASH-REC-01', 'Direct cash payment');
  insertPayment.run('pay-3', ownerId, cust3Id, 'trip-3', 3000.00, yesterday, 'cash', 'CASH-REC-02', 'Part payment received');
  insertPayment.run('pay-4', ownerId, cust1Id, null, 5000.00, yesterday, 'bank_transfer', 'NEFT99238411', 'Cleared old pending ledger balance');

  // Seed Fuel Logs
  const insertFuel = db.prepare(`
    INSERT INTO fuel_logs (id, owner_id, vehicle_id, driver_id, trip_id, date, liters, price_per_liter, total_amount, odometer_km, fuel_station, payment_method, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertFuel.run('fuel-1', ownerId, veh1Id, driver1Id, 'trip-1', today, 7.5, 93.50, 701.25, 38385, 'HP Petrol Pump, Aramghar', 'upi', 'Tank refilled before trip');
  insertFuel.run('fuel-2', ownerId, veh2Id, driver2Id, 'trip-2', today, 6.5, 93.50, 607.75, 62025, 'IndianOil Auto Care, Balanagar', 'cash', 'Routine refill');
  insertFuel.run('fuel-3', ownerId, veh1Id, driver1Id, 'trip-3', yesterday, 12.0, 93.50, 1122.00, 38260, 'Bharat Petroleum, Kukatpally', 'cash', 'Full tank start');

  // Seed Expenses
  const insertExp = db.prepare(`
    INSERT INTO expenses (id, owner_id, vehicle_id, driver_id, trip_id, date, category, amount, description, payment_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertExp.run('exp-1', ownerId, veh1Id, driver1Id, 'trip-1', today, 'toll', 80.00, 'ORR Toll Exit 14', 'fastag');
  insertExp.run('exp-2', ownerId, veh1Id, driver1Id, 'trip-1', today, 'parking', 50.00, 'Medchal wholesale mandi parking', 'cash');
  insertExp.run('exp-3', ownerId, veh2Id, driver2Id, 'trip-2', today, 'toll', 60.00, 'Patancheru Toll Plaza', 'fastag');
  insertExp.run('exp-4', ownerId, veh2Id, driver2Id, null, yesterday, 'food', 120.00, 'Driver breakfast & tea allowance', 'cash');
  insertExp.run('exp-5', ownerId, veh1Id, null, null, twoDaysAgo, 'tyre', 150.00, 'Rear tyre tube puncture patch', 'cash');

  // Seed Vehicle Documents (with some expiring soon!)
  const insertDoc = db.prepare(`
    INSERT INTO documents (id, owner_id, vehicle_id, doc_type, doc_number, issue_date, expiry_date, alert_days_before, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDoc.run('doc-1', ownerId, veh1Id, 'insurance', 'POL-HDFC-9923841', '2025-09-15', '2026-09-15', 15, 'HDFC ERGO Commercial Comprehensive');
  insertDoc.run('doc-2', ownerId, veh1Id, 'puc', 'TS-PUC-2026-8812', '2026-03-10', '2026-09-10', 10, 'Green Zone Emission Certified');
  insertDoc.run('doc-3', ownerId, veh1Id, 'fitness', 'TS07-FC-2024-912', '2024-10-01', '2026-10-01', 30, 'RTO Attapur Fitness Valid');
  insertDoc.run('doc-4', ownerId, veh2Id, 'insurance', 'NIC-COMM-8812399', '2025-09-20', '2026-09-20', 15, 'National Insurance Goods Carrier');
  insertDoc.run('doc-5', ownerId, veh2Id, 'permit', 'TS-NP-2024-1188', '2024-05-01', '2029-05-01', 30, 'State Goods Carriage Permit');

  // Seed Maintenance
  db.prepare(`
    INSERT INTO maintenance (id, owner_id, vehicle_id, date, odometer_km, service_type, amount, mechanic_name, mechanic_phone, invoice_number, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('maint-1', ownerId, veh1Id, '2026-08-20', 36500, 'engine_oil', 2850.00, 'Salim Motor Garage', '9849012345', 'INV-SMG-441', 'Castrol 15W40 Oil change + Oil filter replacement');

  db.prepare(`
    INSERT INTO maintenance (id, owner_id, vehicle_id, date, odometer_km, service_type, amount, mechanic_name, mechanic_phone, invoice_number, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('maint-2', ownerId, veh2Id, '2026-08-10', 60200, 'brake', 1600.00, 'Balaji Auto Works', '9849054321', 'INV-BAW-89', 'Front brake shoe replacement & bleeding');

  // Seed Tyres
  const insertTyre = db.prepare(`
    INSERT INTO tyres (id, owner_id, vehicle_id, position, brand, size, purchase_date, purchase_cost, install_km, current_km, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTyre.run('tyre-1', ownerId, veh1Id, 'front_left', 'MRF Steel Muscle', '145 R12 LT', '2025-05-10', 3200.00, 22000, 38450, 'active', 'Good tread depth remaining');
  insertTyre.run('tyre-2', ownerId, veh1Id, 'front_right', 'MRF Steel Muscle', '145 R12 LT', '2025-05-10', 3200.00, 22000, 38450, 'active', 'Even wear pattern');
  insertTyre.run('tyre-3', ownerId, veh1Id, 'rear_left_outer', 'Apollo EnduTrax', '145 R12 LT', '2025-11-12', 3400.00, 30000, 38450, 'active', 'Installed at 30k km');
  insertTyre.run('tyre-4', ownerId, veh1Id, 'rear_right_outer', 'Apollo EnduTrax', '145 R12 LT', '2025-11-12', 3400.00, 30000, 38450, 'active', 'Installed at 30k km');

  // Seed Driver Advances & Salary
  db.prepare(`
    INSERT INTO driver_advances (id, owner_id, driver_id, date, amount, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('adv-1', ownerId, driver1Id, '2026-08-25', 2000.00, 'Family medical emergency', 'deducted');

  db.prepare(`
    INSERT INTO driver_advances (id, owner_id, driver_id, date, amount, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('adv-2', ownerId, driver1Id, '2026-09-01', 1500.00, 'Festival shopping advance', 'pending');

  db.prepare(`
    INSERT INTO salary_payments (id, owner_id, driver_id, month_year, basic_salary, advance_deducted, bonus_incentive, net_paid, payment_date, payment_method, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('sal-1', ownerId, driver1Id, '08/2026', 18000.00, 2000.00, 1000.00, 17000.00, '2026-09-01', 'bank_transfer', 'August salary cleared with bonus');

  // Seed Bills
  db.prepare(`
    INSERT INTO bills (
      id, owner_id, bill_number, trip_id, customer_id, vehicle_id, driver_id,
      date, pickup, destination, goods, freight, loading, unloading, extra_charges,
      total_amount, paid_amount, balance_amount, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'bill-1', ownerId, 'BILL-2026-001', 'trip-1', cust1Id, veh1Id, driver1Id,
    today, 'Kattedan', 'Medchal Market', 'Grocery Bags & Oil Cans',
    3000.00, 200.00, 100.00, 0.00, 3300.00, 2500.00, 800.00, 'partial'
  );

  // Seed Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, owner_id, title, message, type, severity, is_read, link)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotif.run('notif-1', ownerId, 'PUC Expiring Soon', 'Tata Ace (TS 07 UA 4567) PUC certificate expires in 7 days (10 Sep 2026). Renew at RTO emission center.', 'document_expiry', 'warning', 0, '/documents');
  insertNotif.run('notif-2', ownerId, 'Insurance Renewal Due', 'Tata Ace (TS 07 UA 4567) Insurance expires in 12 days (15 Sep 2026). Contact HDFC ERGO agent.', 'document_expiry', 'warning', 0, '/documents');
  insertNotif.run('notif-3', ownerId, 'Pending Payment Alert', 'ABC Traders has pending udhaar balance of ₹800 from today trip. Send WhatsApp statement.', 'payment_reminder', 'info', 0, '/payments');

  // Seed Settings
  db.prepare(`
    INSERT INTO settings (id, owner_id, default_vehicle_id, default_language, currency_symbol, sms_alerts_enabled)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('set-1', ownerId, veh1Id, 'en', '₹', 1);

  console.log('Gaadi Hisaab database seeded with realistic Indian transport data.');
}
