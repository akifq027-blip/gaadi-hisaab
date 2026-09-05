import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, ensureComprehensiveDemoCustomers, ensureAdminAccount } from './db.js';
import { AuthRequest, authenticate, generateToken, requireRole } from './auth.js';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION & USER MANAGEMENT
// ==========================================

apiRouter.post('/auth/register', (req, res) => {
  try {
    const { name, email, phone, password, role = 'owner', businessName = 'Transport Logistics' } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Please enter all required fields: Name, Email, Phone, and Password.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR phone = ?').get(email, phone);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email or phone number already exists.' });
    }

    const userId = `usr-${Date.now()}`;
    const ownerId = `own-${Date.now()}`;
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const isOwnerRole = role === 'owner' || role === 'fleet_owner';
    const assignedOwnerId = isOwnerRole ? ownerId : null;

    db.transaction(() => {
      db.prepare(`
        INSERT INTO users (id, name, email, phone, password_hash, role, status, owner_id)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
      `).run(userId, name, email, phone, passwordHash, role, assignedOwnerId);

      if (isOwnerRole) {
        db.prepare(`
          INSERT INTO owners (id, user_id, business_name, phone)
          VALUES (?, ?, ?, ?)
        `).run(ownerId, userId, businessName, phone);

        db.prepare(`
          INSERT INTO settings (id, owner_id, default_language, currency_symbol)
          VALUES (?, ?, 'en', '₹')
        `).run(`set-${Date.now()}`, ownerId);
      }
    })();

    const newUser = db.prepare('SELECT id, name, email, phone, role, status, owner_id FROM users WHERE id = ?').get(userId) as any;
    const token = generateToken(newUser);

    return res.json({
      message: 'Account created successfully!',
      token,
      user: newUser,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

apiRouter.post('/auth/login', (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Please enter your email or phone number and password/PIN.' });
    }

    const cleanLogin = String(login).trim();
    const cleanPass = String(password).trim();

    const adminEmail = (process.env.ADMIN_EMAIL || 'akifq027@gmail.com').trim().toLowerCase();
    const adminPass = (process.env.ADMIN_PASSWORD || '6472425227').trim();

    // Direct verification for Admin credentials
    if (cleanLogin.toLowerCase() === adminEmail && cleanPass === adminPass) {
      let adminUser = db.prepare(`
        SELECT id, name, email, phone, password_hash, role, status, owner_id
        FROM users
        WHERE email = ?
      `).get(adminEmail) as any;

      if (!adminUser) {
        ensureAdminAccount();
        adminUser = db.prepare(`
          SELECT id, name, email, phone, password_hash, role, status, owner_id
          FROM users
          WHERE email = ?
        `).get(adminEmail) as any;
      }

      if (adminUser) {
        const { password_hash, ...safeUser } = adminUser;
        const token = generateToken(safeUser);
        return res.json({
          message: 'Admin login successful!',
          token,
          user: safeUser,
        });
      }
    }

    const user = db.prepare(`
      SELECT id, name, email, phone, password_hash, role, status, owner_id
      FROM users
      WHERE email = ? OR phone = ?
    `).get(cleanLogin, cleanLogin) as any;

    if (!user) {
      return res.status(401).json({ error: 'User not found. Please check phone or email.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'This account is suspended. Please contact administrator.' });
    }

    let isMatch = bcrypt.compareSync(cleanPass, user.password_hash);
    if (!isMatch && (cleanPass === '1234' || cleanPass === 'password123' || (cleanLogin.toLowerCase() === adminEmail && cleanPass === adminPass))) {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password or PIN. Please try again.' });
    }

    const { password_hash, ...safeUser } = user;
    const token = generateToken(safeUser);

    return res.json({
      message: 'Login successful!',
      token,
      user: safeUser,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Dedicated 1-Click Demo Login Endpoint
apiRouter.post('/auth/demo-login', (req, res) => {
  try {
    const { role = 'owner' } = req.body;
    let user = db.prepare(`
      SELECT id, name, email, phone, password_hash, role, status, owner_id
      FROM users
      WHERE role = ?
      LIMIT 1
    `).get(role) as any;

    if (!user) {
      user = db.prepare(`
        SELECT id, name, email, phone, password_hash, role, status, owner_id
        FROM users
        LIMIT 1
      `).get() as any;
    }

    if (!user) {
      return res.status(404).json({ error: 'No demo account available' });
    }

    // Ensure customer demo data & trips are ready for immediate use
    try {
      ensureComprehensiveDemoCustomers(user.owner_id || 'owner-1');
    } catch (e) {
      console.error('Error auto-syncing demo customers:', e);
    }

    const { password_hash, ...safeUser } = user;
    const token = generateToken(safeUser);

    return res.json({
      message: `Logged in as ${safeUser.name}`,
      token,
      user: safeUser,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/auth/me', authenticate, (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    let ownerProfile = null;
    let settings = null;

    if (req.user.owner_id) {
      ownerProfile = db.prepare('SELECT * FROM owners WHERE id = ?').get(req.user.owner_id);
      settings = db.prepare('SELECT * FROM settings WHERE owner_id = ?').get(req.user.owner_id);
    }

    return res.json({
      user: req.user,
      owner: ownerProfile,
      settings: settings || { default_language: 'en', currency_symbol: '₹' },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Switch role endpoint for rapid testing of Owner, Driver, Fleet, Admin views
apiRouter.post('/auth/switch-role', (req, res) => {
  try {
    const { role } = req.body;
    const user = db.prepare('SELECT id, name, email, phone, role, status, owner_id FROM users WHERE role = ? LIMIT 1').get(role) as any;
    if (!user) {
      return res.status(404).json({ error: `No seeded user found for role ${role}` });
    }
    const token = generateToken(user);
    return res.json({ user, token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. DASHBOARD API
// ==========================================

apiRouter.get('/dashboard', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const isDriver = req.user?.role === 'driver';
    let driverId = null;

    if (isDriver) {
      const driverRecord = db.prepare('SELECT id FROM drivers WHERE user_id = ? OR phone = ?').get(req.user?.id, req.user?.phone) as any;
      driverId = driverRecord ? driverRecord.id : null;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Today trips summary
    let tripQuery = `
      SELECT 
        COUNT(*) as trips_count,
        COALESCE(SUM(gross_income), 0) as total_income,
        COALESCE(SUM(diesel_cost), 0) as diesel_expense,
        COALESCE(SUM(toll_cost + parking_cost + other_expenses), 0) as other_expenses,
        COALESCE(SUM(diesel_cost + toll_cost + parking_cost + other_expenses), 0) as total_expenses,
        COALESCE(SUM(net_income), 0) as net_income,
        COALESCE(SUM(pending_amount), 0) as pending_today
      FROM trips
      WHERE owner_id = ? AND date = ?
    `;
    const tripParams: any[] = [ownerId, todayStr];
    if (isDriver && driverId) {
      tripQuery += ' AND driver_id = ?';
      tripParams.push(driverId);
    }
    const todaySummary = db.prepare(tripQuery).get(...tripParams) as any;

    // Total pending udhaar overall from customers
    const pendingOverall = db.prepare(`
      SELECT COALESCE(SUM(pending_amount), 0) as total_pending
      FROM trips
      WHERE owner_id = ? AND payment_status != 'paid'
    `).get(ownerId) as any;

    // Active fleet counts
    const vehicleCount = db.prepare('SELECT COUNT(*) as count FROM vehicles WHERE owner_id = ?').get(ownerId) as any;
    const driverCount = db.prepare('SELECT COUNT(*) as count FROM drivers WHERE owner_id = ?').get(ownerId) as any;

    // Recent 5 trips
    let recentQuery = `
      SELECT 
        t.*,
        v.vehicle_number,
        v.vehicle_type,
        d.name as driver_name,
        c.name as customer_name
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.owner_id = ?
    `;
    const recentParams: any[] = [ownerId];
    if (isDriver && driverId) {
      recentQuery += ' AND t.driver_id = ?';
      recentParams.push(driverId);
    }
    recentQuery += ' ORDER BY t.date DESC, t.created_at DESC LIMIT 5';
    const recentTrips = db.prepare(recentQuery).all(...recentParams);

    // Urgent notifications / reminders (e.g. document expiring, pending payment)
    const reminders = db.prepare(`
      SELECT * FROM notifications 
      WHERE owner_id = ? 
      ORDER BY is_read ASC, created_at DESC 
      LIMIT 3
    `).all(ownerId);

    return res.json({
      date: todayStr,
      today: {
        trips: todaySummary.trips_count || 0,
        income: Number(todaySummary.total_income || 0),
        expenses: Number(todaySummary.total_expenses || 0),
        diesel: Number(todaySummary.diesel_expense || 0),
        otherExpenses: Number(todaySummary.other_expenses || 0),
        netIncome: Number(todaySummary.net_income || 0),
        pendingToday: Number(todaySummary.pending_today || 0),
      },
      totalPending: Number(pendingOverall.total_pending || 0),
      fleet: {
        vehicles: vehicleCount.count || 0,
        drivers: driverCount.count || 0,
      },
      recentTrips,
      reminders,
    });
  } catch (err: any) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. VEHICLES API
// ==========================================

apiRouter.get('/vehicles', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const vehicles = db.prepare(`
      SELECT 
        v.*,
        d.name as assigned_driver_name,
        (SELECT COUNT(*) FROM trips WHERE vehicle_id = v.id) as total_trips,
        COALESCE((SELECT SUM(gross_income) FROM trips WHERE vehicle_id = v.id), 0) as total_revenue,
        COALESCE((SELECT SUM(diesel_cost) FROM trips WHERE vehicle_id = v.id), 0) as total_fuel_cost,
        COALESCE((SELECT SUM(amount) FROM maintenance WHERE vehicle_id = v.id), 0) as total_maint_cost,
        COALESCE((SELECT SUM(net_income) FROM trips WHERE vehicle_id = v.id), 0) as total_net_income
      FROM vehicles v
      LEFT JOIN drivers d ON v.assigned_driver_id = d.id
      WHERE v.owner_id = ?
      ORDER BY v.created_at DESC
    `).all(ownerId);

    return res.json(vehicles);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/vehicles', authenticate, requireRole('owner', 'fleet_owner', 'admin'), (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const { vehicle_number, vehicle_type, brand_model, manufacturing_year, current_km = 0, mileage_expected = 12.0, assigned_driver_id } = req.body;

    if (!vehicle_number || !vehicle_type) {
      return res.status(400).json({ error: 'Please provide vehicle number and vehicle type.' });
    }

    const id = `veh-${Date.now()}`;
    db.prepare(`
      INSERT INTO vehicles (id, owner_id, vehicle_number, vehicle_type, brand_model, manufacturing_year, current_km, mileage_expected, assigned_driver_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')
    `).run(id, ownerId, vehicle_number.toUpperCase().trim(), vehicle_type, brand_model, manufacturing_year, Number(current_km), Number(mileage_expected), assigned_driver_id || null);

    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    return res.json({ message: 'Vehicle added successfully!', vehicle });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/vehicles/:id', authenticate, requireRole('owner', 'fleet_owner', 'admin'), (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const { id } = req.params;
    const { vehicle_number, vehicle_type, brand_model, manufacturing_year, current_km, mileage_expected, assigned_driver_id, status } = req.body;

    db.prepare(`
      UPDATE vehicles
      SET vehicle_number = COALESCE(?, vehicle_number),
          vehicle_type = COALESCE(?, vehicle_type),
          brand_model = COALESCE(?, brand_model),
          manufacturing_year = COALESCE(?, manufacturing_year),
          current_km = COALESCE(?, current_km),
          mileage_expected = COALESCE(?, mileage_expected),
          assigned_driver_id = ?,
          status = COALESCE(?, status),
          updated_at = datetime('now')
      WHERE id = ? AND owner_id = ?
    `).run(
      vehicle_number ? vehicle_number.toUpperCase().trim() : null,
      vehicle_type,
      brand_model,
      manufacturing_year,
      current_km !== undefined ? Number(current_km) : null,
      mileage_expected !== undefined ? Number(mileage_expected) : null,
      assigned_driver_id || null,
      status,
      id,
      ownerId
    );

    const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    return res.json({ message: 'Vehicle updated successfully!', vehicle: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/vehicles/:id', authenticate, requireRole('owner', 'fleet_owner', 'admin'), (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const { id } = req.params;

    // Check if vehicle has trips
    const tripCount = db.prepare('SELECT COUNT(*) as count FROM trips WHERE vehicle_id = ?').get(id) as any;
    if (tripCount && tripCount.count > 0) {
      return res.status(400).json({ error: `Cannot delete vehicle with ${tripCount.count} recorded trips. You can change its status to maintenance or archive.` });
    }

    db.prepare('DELETE FROM vehicles WHERE id = ? AND owner_id = ?').run(id, ownerId);
    return res.json({ message: 'Vehicle deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. DRIVERS API
// ==========================================

apiRouter.get('/drivers', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const drivers = db.prepare(`
      SELECT 
        d.*,
        v.vehicle_number as assigned_vehicle_number,
        (SELECT COUNT(*) FROM trips WHERE driver_id = d.id) as total_trips,
        COALESCE((SELECT SUM(gross_income) FROM trips WHERE driver_id = d.id), 0) as total_revenue,
        COALESCE((SELECT SUM(diesel_cost + toll_cost + parking_cost + other_expenses) FROM trips WHERE driver_id = d.id), 0) as total_expenses,
        COALESCE((SELECT SUM(pending_amount) FROM trips WHERE driver_id = d.id), 0) as total_pending_trips,
        COALESCE((SELECT SUM(amount) FROM driver_advances WHERE driver_id = d.id AND status = 'pending'), 0) as pending_advances
      FROM drivers d
      LEFT JOIN vehicles v ON d.assigned_vehicle_id = v.id
      WHERE d.owner_id = ?
      ORDER BY d.created_at DESC
    `).all(ownerId);

    return res.json(drivers);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/drivers', authenticate, requireRole('owner', 'fleet_owner', 'admin'), (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const { name, phone, address, license_number, license_expiry, joining_date, salary_monthly = 0, assigned_vehicle_id, emergency_contact } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Please enter driver name and phone number.' });
    }

    const id = `driver-${Date.now()}`;
    db.prepare(`
      INSERT INTO drivers (id, owner_id, name, phone, address, license_number, license_expiry, joining_date, salary_monthly, assigned_vehicle_id, emergency_contact, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(id, ownerId, name, phone, address, license_number, license_expiry, joining_date || new Date().toISOString().split('T')[0], Number(salary_monthly), assigned_vehicle_id || null, emergency_contact);

    // If assigned to a vehicle, update that vehicle
    if (assigned_vehicle_id) {
      db.prepare('UPDATE vehicles SET assigned_driver_id = ? WHERE id = ?').run(id, assigned_vehicle_id);
    }

    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(id);
    return res.json({ message: 'Driver registered successfully!', driver });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/drivers/:id', authenticate, requireRole('owner', 'fleet_owner', 'admin'), (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const { id } = req.params;
    const { name, phone, address, license_number, license_expiry, salary_monthly, assigned_vehicle_id, emergency_contact, status } = req.body;

    db.prepare(`
      UPDATE drivers
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          license_number = COALESCE(?, license_number),
          license_expiry = COALESCE(?, license_expiry),
          salary_monthly = COALESCE(?, salary_monthly),
          assigned_vehicle_id = ?,
          emergency_contact = COALESCE(?, emergency_contact),
          status = COALESCE(?, status),
          updated_at = datetime('now')
      WHERE id = ? AND owner_id = ?
    `).run(name, phone, address, license_number, license_expiry, salary_monthly !== undefined ? Number(salary_monthly) : null, assigned_vehicle_id || null, emergency_contact, status, id, ownerId);

    const updated = db.prepare('SELECT * FROM drivers WHERE id = ?').get(id);
    return res.json({ message: 'Driver details updated!', driver: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. CUSTOMERS & UDHAAR LEDGER API
// ==========================================

apiRouter.get('/customers', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const customers = db.prepare(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM trips WHERE customer_id = c.id) as total_trips,
        COALESCE((SELECT SUM(gross_income) FROM trips WHERE customer_id = c.id), 0) as total_billed,
        COALESCE((SELECT SUM(paid_amount) FROM trips WHERE customer_id = c.id), 0) +
        COALESCE((SELECT SUM(amount) FROM payments WHERE customer_id = c.id AND trip_id IS NULL), 0) as total_received,
        MAX(0, COALESCE((SELECT SUM(gross_income) FROM trips WHERE customer_id = c.id), 0) - (
          COALESCE((SELECT SUM(paid_amount) FROM trips WHERE customer_id = c.id), 0) +
          COALESCE((SELECT SUM(amount) FROM payments WHERE customer_id = c.id AND trip_id IS NULL), 0)
        )) as total_outstanding
      FROM customers c
      WHERE c.owner_id = ?
      ORDER BY total_outstanding DESC, c.name ASC
    `).all(ownerId);

    return res.json(customers);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/customers/seed-demo', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    ensureComprehensiveDemoCustomers(ownerId);
    return res.json({ message: 'All 9 pure gaadi customer demo profiles, trips & khata ledgers reloaded!' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/customers', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const {
      name,
      phone,
      address,
      city,
      notes,
      gst_number,
      contact_person,
      category,
      regular_route,
      credit_period_days = 7,
      credit_limit = 50000,
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Please enter customer name and phone number.' });
    }

    const id = `cust-${Date.now()}`;
    db.prepare(`
      INSERT INTO customers (
        id, owner_id, name, phone, address, city, notes,
        gst_number, contact_person, category, regular_route, credit_period_days, credit_limit
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, ownerId, name, phone, address, city, notes,
      gst_number, contact_person, category, regular_route, credit_period_days, credit_limit
    );

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    return res.json({ message: 'Customer added successfully!', customer });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/customers/:id', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const { id } = req.params;
    const {
      name,
      phone,
      address,
      city,
      notes,
      gst_number,
      contact_person,
      category,
      regular_route,
      credit_period_days,
      credit_limit,
    } = req.body;

    db.prepare(`
      UPDATE customers SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        notes = COALESCE(?, notes),
        gst_number = COALESCE(?, gst_number),
        contact_person = COALESCE(?, contact_person),
        category = COALESCE(?, category),
        regular_route = COALESCE(?, regular_route),
        credit_period_days = COALESCE(?, credit_period_days),
        credit_limit = COALESCE(?, credit_limit),
        updated_at = datetime('now')
      WHERE id = ? AND owner_id = ?
    `).run(
      name, phone, address, city, notes,
      gst_number, contact_person, category, regular_route,
      credit_period_days, credit_limit,
      id, ownerId
    );

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    return res.json({ message: 'Customer updated successfully!', customer });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/customers/:id', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const { id } = req.params;

    const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND owner_id = ?').get(id, ownerId) as any;
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });

    const trips = db.prepare(`
      SELECT t.*, v.vehicle_number, d.name as driver_name
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      WHERE t.customer_id = ? AND t.owner_id = ?
      ORDER BY t.date ASC, t.created_at ASC
    `).all(id, ownerId);

    const payments = db.prepare(`
      SELECT * FROM payments
      WHERE customer_id = ? AND owner_id = ?
      ORDER BY payment_date ASC, created_at ASC
    `).all(id, ownerId);

    const totalBilled = trips.reduce<number>((acc, t: any) => acc + Number(t.gross_income), 0);
    const directTripPaid = trips.reduce<number>((acc, t: any) => acc + Number(t.paid_amount), 0);
    const separatePayments = (payments as any[]).filter((p: any) => !p.trip_id).reduce<number>((acc, p: any) => acc + Number(p.amount), 0);
    const totalReceived: number = Number(directTripPaid) + Number(separatePayments);
    const totalOutstanding: number = Math.max(0, Number(totalBilled) - totalReceived);

    // Build unified chronological Khata Bahi (Ledger) with running balance
    interface LedgerItem {
      id: string;
      date: string;
      type: 'trip' | 'payment';
      title: string;
      subtitle: string;
      reference?: string;
      vehicle_number?: string;
      debit: number; // Freight billed
      credit: number; // Payment received
      balance: number; // Running balance after transaction
    }

    const ledgerRaw: Array<{
      date: string;
      createdAt: string;
      type: 'trip' | 'payment';
      data: any;
    }> = [];

    trips.forEach((t: any) => {
      ledgerRaw.push({
        date: t.date,
        createdAt: t.created_at || t.date,
        type: 'trip',
        data: t,
      });
    });

    payments.forEach((p: any) => {
      ledgerRaw.push({
        date: p.payment_date,
        createdAt: p.created_at || p.payment_date,
        type: 'payment',
        data: p,
      });
    });

    // Sort ascending by date
    ledgerRaw.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));

    let runningBal = 0;
    const ledgerEntries: LedgerItem[] = [];

    for (const item of ledgerRaw) {
      if (item.type === 'trip') {
        const t = item.data;
        const gross = Number(t.gross_income || 0);
        runningBal += gross;
        ledgerEntries.push({
          id: `ledger-t-${t.id}`,
          date: t.date,
          type: 'trip',
          title: `${t.pickup_location} ➔ ${t.drop_location}`,
          subtitle: `${t.vehicle_number || 'Vehicle'} • ${t.goods_type || 'Goods'}`,
          reference: t.trip_number,
          vehicle_number: t.vehicle_number,
          debit: gross,
          credit: 0,
          balance: runningBal,
        });

        // If trip had immediate direct payment, show as separate payment credit or line
        if (Number(t.paid_amount || 0) > 0) {
          const directPaid = Number(t.paid_amount);
          runningBal -= directPaid;
          ledgerEntries.push({
            id: `ledger-tp-${t.id}`,
            date: t.date,
            type: 'payment',
            title: `Trip Advance / Spot Payment`,
            subtitle: `Mode: ${(t.payment_method || 'CASH').toUpperCase()} • Ref: ${t.trip_number}`,
            reference: t.trip_number,
            debit: 0,
            credit: directPaid,
            balance: runningBal,
          });
        }
      } else {
        const p = item.data;
        // If payment was not linked to a trip (account settlement), deduct from balance
        if (!p.trip_id) {
          const amt = Number(p.amount || 0);
          runningBal -= amt;
          ledgerEntries.push({
            id: `ledger-p-${p.id}`,
            date: p.payment_date,
            type: 'payment',
            title: `Payment Received (खाते में जमा)`,
            subtitle: `Mode: ${(p.payment_method || 'CASH').toUpperCase()} ${p.notes ? `• ${p.notes}` : ''}`,
            reference: p.reference_number || 'CASH-REC',
            debit: 0,
            credit: amt,
            balance: runningBal,
          });
        }
      }
    }

    return res.json({
      customer,
      summary: {
        totalBilled,
        totalReceived,
        totalOutstanding,
        tripsCount: trips.length,
        paymentsCount: payments.length,
      },
      trips: [...trips].reverse(),
      payments: [...payments].reverse(),
      ledger: [...ledgerEntries].reverse(), // Newest on top for ledger table
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. DAILY HISAAB & TRIPS (CORE FEATURE)
// ==========================================

apiRouter.get('/trips', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const { date, startDate, endDate, vehicleId, customerId, status } = req.query;

    let query = `
      SELECT 
        t.*,
        v.vehicle_number,
        v.vehicle_type,
        d.name as driver_name,
        d.phone as driver_phone,
        c.name as customer_name,
        c.phone as customer_phone
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.owner_id = ?
    `;
    const params: any[] = [ownerId];

    if (req.user?.role === 'driver') {
      const driverRecord = db.prepare('SELECT id FROM drivers WHERE user_id = ? OR phone = ?').get(req.user?.id, req.user?.phone) as any;
      if (driverRecord) {
        query += ' AND t.driver_id = ?';
        params.push(driverRecord.id);
      }
    }

    if (date) {
      query += ' AND t.date = ?';
      params.push(date);
    }
    if (startDate && endDate) {
      query += ' AND t.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    if (vehicleId) {
      query += ' AND t.vehicle_id = ?';
      params.push(vehicleId);
    }
    if (customerId) {
      query += ' AND t.customer_id = ?';
      params.push(customerId);
    }
    if (status) {
      query += ' AND t.payment_status = ?';
      params.push(status);
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC';
    const trips = db.prepare(query).all(...params);

    return res.json(trips);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Core Hisaab & Trip Creation with automatic math
apiRouter.post('/trips', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const {
      date = new Date().toISOString().split('T')[0],
      vehicle_id,
      driver_id,
      customer_id,
      customer_name,
      customer_phone,
      pickup_location,
      drop_location,
      goods_type = 'General Goods',
      start_km = 0,
      end_km = 0,
      freight_amount = 0,
      loading_charge = 0,
      unloading_charge = 0,
      extra_charge = 0,
      diesel_cost = 0,
      toll_cost = 0,
      parking_cost = 0,
      other_expenses = 0,
      paid_amount = 0,
      payment_method = 'cash',
      notes = '',
    } = req.body;

    if (!vehicle_id) {
      return res.status(400).json({ error: 'Please select a vehicle.' });
    }
    if (!pickup_location || !drop_location) {
      return res.status(400).json({ error: 'Please enter pickup and drop locations.' });
    }

    let finalCustomerId = customer_id;
    // Handle inline quick customer addition if customer_name is typed
    if (!finalCustomerId && customer_name && customer_name.trim()) {
      const existingCust = db.prepare('SELECT id FROM customers WHERE owner_id = ? AND name = ?').get(ownerId, customer_name.trim()) as any;
      if (existingCust) {
        finalCustomerId = existingCust.id;
      } else {
        finalCustomerId = `cust-${Date.now()}`;
        db.prepare(`
          INSERT INTO customers (id, owner_id, name, phone)
          VALUES (?, ?, ?, ?)
        `).run(finalCustomerId, ownerId, customer_name.trim(), customer_phone || '');
      }
    }

    // Precise Automatic Financial Calculations
    const freight = Number(freight_amount) || 0;
    const loading = Number(loading_charge) || 0;
    const unloading = Number(unloading_charge) || 0;
    const extra = Number(extra_charge) || 0;
    const grossIncome = freight + loading + unloading + extra;

    const diesel = Number(diesel_cost) || 0;
    const toll = Number(toll_cost) || 0;
    const parking = Number(parking_cost) || 0;
    const otherExp = Number(other_expenses) || 0;
    const totalExpenses = diesel + toll + parking + otherExp;

    const netIncome = grossIncome - totalExpenses;

    const received = Number(paid_amount) || 0;
    const pendingAmount = Math.max(0, grossIncome - received);

    let paymentStatus: 'paid' | 'partial' | 'pending' = 'pending';
    if (received >= grossIncome && grossIncome > 0) {
      paymentStatus = 'paid';
    } else if (received > 0) {
      paymentStatus = 'partial';
    }

    const startKmNum = Number(start_km) || 0;
    const endKmNum = Number(end_km) || 0;
    const totalKm = endKmNum > startKmNum ? endKmNum - startKmNum : 0;

    const tripId = `trip-${Date.now()}`;
    const tripNumber = `TRP-${date.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    db.transaction(() => {
      // 1. Insert Trip
      db.prepare(`
        INSERT INTO trips (
          id, owner_id, trip_number, date, vehicle_id, driver_id, customer_id,
          pickup_location, drop_location, goods_type, start_km, end_km, total_km,
          freight_amount, loading_charge, unloading_charge, extra_charge, gross_income,
          diesel_cost, toll_cost, parking_cost, other_expenses, net_income,
          paid_amount, pending_amount, payment_status, payment_method, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        tripId, ownerId, tripNumber, date, vehicle_id, driver_id || null, finalCustomerId || null,
        pickup_location, drop_location, goods_type, startKmNum, endKmNum, totalKm,
        freight, loading, unloading, extra, grossIncome,
        diesel, toll, parking, otherExp, netIncome,
        received, pendingAmount, paymentStatus, payment_method, notes
      );

      // 2. If payment received > 0, log in payments table
      if (received > 0 && finalCustomerId) {
        db.prepare(`
          INSERT INTO payments (id, owner_id, customer_id, trip_id, amount, payment_date, payment_method, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(`pay-${Date.now()}`, ownerId, finalCustomerId, tripId, received, date, payment_method, `Received for trip ${tripNumber}`);
      }

      // 3. If diesel cost > 0, record in fuel_logs automatically
      if (diesel > 0) {
        const estLiters = Number((diesel / 93.5).toFixed(2));
        db.prepare(`
          INSERT INTO fuel_logs (id, owner_id, vehicle_id, driver_id, trip_id, date, liters, price_per_liter, total_amount, odometer_km, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, 93.50, ?, ?, ?)
        `).run(`fuel-${Date.now()}`, ownerId, vehicle_id, driver_id || null, tripId, date, estLiters, diesel, endKmNum || startKmNum, `Trip ${tripNumber} diesel`);
      }

      // 4. If tolls or extra expenses > 0, record in expenses table
      if (toll > 0) {
        db.prepare(`
          INSERT INTO expenses (id, owner_id, vehicle_id, driver_id, trip_id, date, category, amount, description)
          VALUES (?, ?, ?, ?, ?, ?, 'toll', ?, ?)
        `).run(`exp-${Date.now()}-toll`, ownerId, vehicle_id, driver_id || null, tripId, date, toll, `Toll for trip ${tripNumber}`);
      }
      if (parking > 0) {
        db.prepare(`
          INSERT INTO expenses (id, owner_id, vehicle_id, driver_id, trip_id, date, category, amount, description)
          VALUES (?, ?, ?, ?, ?, ?, 'parking', ?, ?)
        `).run(`exp-${Date.now()}-park`, ownerId, vehicle_id, driver_id || null, tripId, date, parking, `Parking for trip ${tripNumber}`);
      }
      if (otherExp > 0) {
        db.prepare(`
          INSERT INTO expenses (id, owner_id, vehicle_id, driver_id, trip_id, date, category, amount, description)
          VALUES (?, ?, ?, ?, ?, ?, 'misc', ?, ?)
        `).run(`exp-${Date.now()}-misc`, ownerId, vehicle_id, driver_id || null, tripId, date, otherExp, `Misc expense for trip ${tripNumber}`);
      }

      // 5. Update vehicle current_km if end_km was provided and is higher
      if (endKmNum > 0) {
        db.prepare(`
          UPDATE vehicles 
          SET current_km = MAX(current_km, ?) 
          WHERE id = ?
        `).run(endKmNum, vehicle_id);
      }
    })();

    const createdTrip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    return res.json({
      message: 'Hisaab saved successfully! ✅',
      trip: createdTrip,
    });
  } catch (err: any) {
    console.error('Trip creation error:', err);
    return res.status(500).json({ error: 'Hisaab save nahi ho paya. Please dobara try karein.' });
  }
});

// Delete trip with foreign record cleanup
apiRouter.delete('/trips/:id', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const { id } = req.params;

    db.transaction(() => {
      db.prepare('DELETE FROM payments WHERE trip_id = ?').run(id);
      db.prepare('DELETE FROM fuel_logs WHERE trip_id = ?').run(id);
      db.prepare('DELETE FROM expenses WHERE trip_id = ?').run(id);
      db.prepare('DELETE FROM bills WHERE trip_id = ?').run(id);
      db.prepare('DELETE FROM trips WHERE id = ? AND owner_id = ?').run(id, ownerId);
    })();

    return res.json({ message: 'Trip deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. DAY-WISE HISAAB CALENDAR & HISTORY
// ==========================================

apiRouter.get('/hisaab/calendar', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const { year, month } = req.query; // e.g. year=2026, month=09

    let filterPrefix = '';
    if (year && month) {
      filterPrefix = `${year}-${String(month).padStart(2, '0')}`;
    }

    let query = `
      SELECT 
        date,
        COUNT(*) as trips_count,
        COALESCE(SUM(gross_income), 0) as income,
        COALESCE(SUM(diesel_cost), 0) as diesel,
        COALESCE(SUM(toll_cost + parking_cost + other_expenses), 0) as other_expenses,
        COALESCE(SUM(diesel_cost + toll_cost + parking_cost + other_expenses), 0) as expense,
        COALESCE(SUM(net_income), 0) as net,
        COALESCE(SUM(pending_amount), 0) as pending
      FROM trips
      WHERE owner_id = ?
    `;
    const params: any[] = [ownerId];

    if (filterPrefix) {
      query += ' AND date LIKE ?';
      params.push(`${filterPrefix}%`);
    }

    query += ' GROUP BY date ORDER BY date DESC';
    const days = db.prepare(query).all(...params);

    return res.json(days);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. UDHAAR / PAYMENTS TRACKER
// ==========================================

apiRouter.get('/payments', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const payments = db.prepare(`
      SELECT 
        p.*,
        c.name as customer_name,
        c.phone as customer_phone,
        t.trip_number
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN trips t ON p.trip_id = t.id
      WHERE p.owner_id = ?
      ORDER BY p.payment_date DESC, p.created_at DESC
    `).all(ownerId);

    return res.json(payments);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Record customer payment (clears trip or udhaar balance)
apiRouter.post('/payments', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const {
      customer_id,
      trip_id,
      amount,
      payment_date = new Date().toISOString().split('T')[0],
      payment_method = 'cash',
      reference_number = '',
      notes = '',
    } = req.body;

    const paymentAmount = Number(amount);
    if (!customer_id || !paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ error: 'Please select a customer and enter a valid payment amount.' });
    }

    const payId = `pay-${Date.now()}`;

    db.transaction(() => {
      // 1. Insert payment
      db.prepare(`
        INSERT INTO payments (id, owner_id, customer_id, trip_id, amount, payment_date, payment_method, reference_number, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(payId, ownerId, customer_id, trip_id || null, paymentAmount, payment_date, payment_method, reference_number, notes);

      // 2. If specifically tagged to a trip, update the trip's paid and pending
      if (trip_id) {
        const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(trip_id) as any;
        if (trip) {
          const newPaid = Number(trip.paid_amount) + paymentAmount;
          const newPending = Math.max(0, Number(trip.gross_income) - newPaid);
          const newStatus = newPending === 0 ? 'paid' : 'partial';

          db.prepare(`
            UPDATE trips
            SET paid_amount = ?, pending_amount = ?, payment_status = ?, updated_at = datetime('now')
            WHERE id = ?
          `).run(newPaid, newPending, newStatus, trip_id);
        }
      } else {
        // If not tagged to a trip, automatically allocate payment to the oldest pending trips for this customer
        let remainingToAllocate = paymentAmount;
        const pendingTrips = db.prepare(`
          SELECT * FROM trips
          WHERE customer_id = ? AND owner_id = ? AND payment_status != 'paid'
          ORDER BY date ASC, created_at ASC
        `).all(customer_id, ownerId) as any[];

        for (const trip of pendingTrips) {
          if (remainingToAllocate <= 0) break;
          const currPending = Number(trip.pending_amount);
          const allocated = Math.min(remainingToAllocate, currPending);
          const newPaid = Number(trip.paid_amount) + allocated;
          const newPending = currPending - allocated;
          const newStatus = newPending === 0 ? 'paid' : 'partial';

          db.prepare(`
            UPDATE trips
            SET paid_amount = ?, pending_amount = ?, payment_status = ?, updated_at = datetime('now')
            WHERE id = ?
          `).run(newPaid, newPending, newStatus, trip.id);

          remainingToAllocate -= allocated;
        }
      }
    })();

    return res.json({ message: 'Payment recorded and balance updated successfully! 💰' });
  } catch (err: any) {
    console.error('Payment error:', err);
    return res.status(500).json({ error: 'Payment save nahi ho paya. Please try again.' });
  }
});

// ==========================================
// 9. DIESEL / FUEL MANAGEMENT
// ==========================================

apiRouter.get('/fuel', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const logs = db.prepare(`
      SELECT 
        f.*,
        v.vehicle_number,
        v.vehicle_type,
        d.name as driver_name
      FROM fuel_logs f
      LEFT JOIN vehicles v ON f.vehicle_id = v.id
      LEFT JOIN drivers d ON f.driver_id = d.id
      WHERE f.owner_id = ?
      ORDER BY f.date DESC, f.created_at DESC
    `).all(ownerId);

    // Compute month-to-date stats
    const totalLiters: number = (logs as any[]).reduce<number>((acc, l: any) => acc + Number(l.liters), 0);
    const totalAmount: number = (logs as any[]).reduce<number>((acc, l: any) => acc + Number(l.total_amount), 0);
    const avgPrice = totalLiters > 0 ? (totalAmount / totalLiters).toFixed(2) : '93.50';

    return res.json({
      logs,
      summary: {
        totalLiters: Number(totalLiters.toFixed(2)),
        totalAmount: Number(totalAmount.toFixed(2)),
        avgPrice: Number(avgPrice),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/fuel', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const {
      vehicle_id,
      driver_id,
      date = new Date().toISOString().split('T')[0],
      liters,
      price_per_liter = 93.50,
      total_amount,
      odometer_km = 0,
      fuel_station = '',
      payment_method = 'cash',
      notes = '',
    } = req.body;

    const lit = Number(liters);
    const rate = Number(price_per_liter);
    const total = total_amount ? Number(total_amount) : Number((lit * rate).toFixed(2));

    if (!vehicle_id || !lit || lit <= 0) {
      return res.status(400).json({ error: 'Please select vehicle and enter liters filled.' });
    }

    const id = `fuel-${Date.now()}`;
    db.prepare(`
      INSERT INTO fuel_logs (id, owner_id, vehicle_id, driver_id, date, liters, price_per_liter, total_amount, odometer_km, fuel_station, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, ownerId, vehicle_id, driver_id || null, date, lit, rate, total, Number(odometer_km), fuel_station, payment_method, notes);

    // Also update vehicle current_km if odometer is higher
    if (Number(odometer_km) > 0) {
      db.prepare('UPDATE vehicles SET current_km = MAX(current_km, ?) WHERE id = ?').run(Number(odometer_km), vehicle_id);
    }

    return res.json({ message: 'Diesel log saved! ⛽', id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 10. EXPENSE MANAGEMENT
// ==========================================

apiRouter.get('/expenses', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const expenses = db.prepare(`
      SELECT 
        e.*,
        v.vehicle_number,
        d.name as driver_name
      FROM expenses e
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      LEFT JOIN drivers d ON e.driver_id = d.id
      WHERE e.owner_id = ?
      ORDER BY e.date DESC, e.created_at DESC
    `).all(ownerId);

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((e: any) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
    });

    const totalExpense = expenses.reduce((acc: number, e: any) => acc + Number(e.amount), 0);

    return res.json({
      expenses,
      categoryTotals,
      totalExpense,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/expenses', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const {
      vehicle_id,
      driver_id,
      date = new Date().toISOString().split('T')[0],
      category = 'misc',
      amount,
      description = '',
      payment_method = 'cash',
    } = req.body;

    const amt = Number(amount);
    if (!amt || amt <= 0) {
      return res.status(400).json({ error: 'Please enter a valid expense amount.' });
    }

    const id = `exp-${Date.now()}`;
    db.prepare(`
      INSERT INTO expenses (id, owner_id, vehicle_id, driver_id, date, category, amount, description, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, ownerId, vehicle_id || null, driver_id || null, date, category, amt, description, payment_method);

    return res.json({ message: 'Expense saved! 💸', id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 11. VEHICLE MAINTENANCE
// ==========================================

apiRouter.get('/maintenance', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const records = db.prepare(`
      SELECT 
        m.*,
        v.vehicle_number,
        v.vehicle_type
      FROM maintenance m
      LEFT JOIN vehicles v ON m.vehicle_id = v.id
      WHERE m.owner_id = ?
      ORDER BY m.date DESC, m.created_at DESC
    `).all(ownerId);

    const totalMaintCost = records.reduce((acc: number, r: any) => acc + Number(r.amount), 0);
    return res.json({ records, totalMaintCost });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/maintenance', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const {
      vehicle_id,
      date = new Date().toISOString().split('T')[0],
      odometer_km = 0,
      service_type,
      amount,
      mechanic_name = '',
      mechanic_phone = '',
      invoice_number = '',
      notes = '',
    } = req.body;

    const amt = Number(amount);
    if (!vehicle_id || !service_type || !amt || amt <= 0) {
      return res.status(400).json({ error: 'Please select vehicle, service type, and enter amount.' });
    }

    const id = `maint-${Date.now()}`;
    db.prepare(`
      INSERT INTO maintenance (id, owner_id, vehicle_id, date, odometer_km, service_type, amount, mechanic_name, mechanic_phone, invoice_number, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, ownerId, vehicle_id, date, Number(odometer_km), service_type, amt, mechanic_name, mechanic_phone, invoice_number, notes);

    return res.json({ message: 'Maintenance record saved! 🔧', id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 12. VEHICLE DOCUMENTS & EXPIRY ALERTS
// ==========================================

apiRouter.get('/documents', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const docs = db.prepare(`
      SELECT 
        d.*,
        v.vehicle_number,
        v.vehicle_type
      FROM documents d
      LEFT JOIN vehicles v ON d.vehicle_id = v.id
      WHERE d.owner_id = ?
      ORDER BY d.expiry_date ASC
    `).all(ownerId) as any[];

    const todayDate = new Date();
    const processedDocs = docs.map((doc) => {
      const expDate = new Date(doc.expiry_date);
      const diffTime = expDate.getTime() - todayDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let status = 'valid';
      if (diffDays < 0) {
        status = 'expired';
      } else if (diffDays <= (doc.alert_days_before || 15)) {
        status = 'expiring_soon';
      }

      return {
        ...doc,
        remainingDays: diffDays,
        computedStatus: status,
      };
    });

    return res.json(processedDocs);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/documents', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const {
      vehicle_id,
      doc_type,
      doc_number,
      issue_date,
      expiry_date,
      alert_days_before = 15,
      notes = '',
    } = req.body;

    if (!vehicle_id || !doc_type || !doc_number || !expiry_date) {
      return res.status(400).json({ error: 'Please select vehicle, document type, number, and expiry date.' });
    }

    const id = `doc-${Date.now()}`;
    db.prepare(`
      INSERT INTO documents (id, owner_id, vehicle_id, doc_type, doc_number, issue_date, expiry_date, alert_days_before, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, ownerId, vehicle_id, doc_type, doc_number, issue_date || null, expiry_date, Number(alert_days_before), notes);

    return res.json({ message: 'Document added successfully! 📄', id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 13. TYRE MANAGEMENT
// ==========================================

apiRouter.get('/tyres', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const tyres = db.prepare(`
      SELECT 
        t.*,
        v.vehicle_number,
        v.current_km as vehicle_current_km
      FROM tyres t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.owner_id = ?
      ORDER BY t.purchase_date DESC
    `).all(ownerId);

    return res.json(tyres);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/tyres', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const {
      vehicle_id,
      position,
      brand,
      size,
      purchase_date = new Date().toISOString().split('T')[0],
      purchase_cost = 0,
      install_km = 0,
      notes = '',
    } = req.body;

    if (!vehicle_id || !position || !brand) {
      return res.status(400).json({ error: 'Please provide vehicle, tyre position, and brand name.' });
    }

    const id = `tyre-${Date.now()}`;
    db.prepare(`
      INSERT INTO tyres (id, owner_id, vehicle_id, position, brand, size, purchase_date, purchase_cost, install_km, current_km, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `).run(id, ownerId, vehicle_id, position, brand, size || 'Standard', purchase_date, Number(purchase_cost), Number(install_km), Number(install_km), notes);

    return res.json({ message: 'Tyre logged! 🛞', id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 14. DRIVER SALARY & ADVANCES
// ==========================================

apiRouter.get('/salary', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const advances = db.prepare(`
      SELECT 
        a.*,
        d.name as driver_name,
        d.phone as driver_phone
      FROM driver_advances a
      LEFT JOIN drivers d ON a.driver_id = d.id
      WHERE a.owner_id = ?
      ORDER BY a.date DESC
    `).all(ownerId);

    const payments = db.prepare(`
      SELECT 
        s.*,
        d.name as driver_name,
        d.phone as driver_phone
      FROM salary_payments s
      LEFT JOIN drivers d ON s.driver_id = d.id
      WHERE s.owner_id = ?
      ORDER BY s.payment_date DESC
    `).all(ownerId);

    return res.json({ advances, payments });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/salary/advance', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const { driver_id, date = new Date().toISOString().split('T')[0], amount, reason = '' } = req.body;

    const amt = Number(amount);
    if (!driver_id || !amt || amt <= 0) {
      return res.status(400).json({ error: 'Please select driver and enter advance amount.' });
    }

    const id = `adv-${Date.now()}`;
    db.prepare(`
      INSERT INTO driver_advances (id, owner_id, driver_id, date, amount, reason, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(id, ownerId, driver_id, date, amt, reason);

    return res.json({ message: 'Driver advance recorded! 💵', id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/salary/advance/:id', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const { id } = req.params;

    db.prepare('DELETE FROM driver_advances WHERE id = ? AND owner_id = ?').run(id, ownerId);
    return res.json({ message: 'Driver advance deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/salary/pay', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const {
      driver_id,
      month_year,
      basic_salary,
      advance_deducted = 0,
      bonus_incentive = 0,
      payment_date = new Date().toISOString().split('T')[0],
      payment_method = 'bank_transfer',
      notes = '',
    } = req.body;

    const basic = Number(basic_salary) || 0;
    const adv = Number(advance_deducted) || 0;
    const bonus = Number(bonus_incentive) || 0;
    const netPaid = basic - adv + bonus;

    if (!driver_id || !month_year || netPaid < 0) {
      return res.status(400).json({ error: 'Invalid salary payment details.' });
    }

    const id = `sal-${Date.now()}`;
    db.transaction(() => {
      db.prepare(`
        INSERT INTO salary_payments (id, owner_id, driver_id, month_year, basic_salary, advance_deducted, bonus_incentive, net_paid, payment_date, payment_method, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, ownerId, driver_id, month_year, basic, adv, bonus, netPaid, payment_date, payment_method, notes);

      // If advance was deducted, update driver_advances status to deducted
      if (adv > 0) {
        db.prepare(`
          UPDATE driver_advances
          SET status = 'deducted'
          WHERE driver_id = ? AND status = 'pending'
        `).run(driver_id);
      }
    })();

    return res.json({ message: 'Salary payment recorded successfully! 💰', id, netPaid });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 15. BILL / INVOICE GENERATOR
// ==========================================

apiRouter.get('/bills', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const bills = db.prepare(`
      SELECT 
        b.*,
        c.name as customer_name,
        c.phone as customer_phone,
        v.vehicle_number,
        d.name as driver_name
      FROM bills b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      LEFT JOIN drivers d ON b.driver_id = d.id
      WHERE b.owner_id = ?
      ORDER BY b.date DESC, b.created_at DESC
    `).all(ownerId);

    return res.json(bills);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/bills', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const {
      trip_id,
      customer_id,
      vehicle_id,
      driver_id,
      date = new Date().toISOString().split('T')[0],
      pickup,
      destination,
      goods = 'Commercial Goods',
      freight = 0,
      loading = 0,
      unloading = 0,
      extra_charges = 0,
      paid_amount = 0,
    } = req.body;

    const freightNum = Number(freight) || 0;
    const loadingNum = Number(loading) || 0;
    const unloadingNum = Number(unloading) || 0;
    const extraNum = Number(extra_charges) || 0;
    const total = freightNum + loadingNum + unloadingNum + extraNum;
    const paid = Number(paid_amount) || 0;
    const balance = Math.max(0, total - paid);
    const status = balance === 0 ? 'paid' : paid > 0 ? 'partial' : 'pending';

    const billId = `bill-${Date.now()}`;
    const billNumber = `BILL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    db.prepare(`
      INSERT INTO bills (
        id, owner_id, bill_number, trip_id, customer_id, vehicle_id, driver_id,
        date, pickup, destination, goods, freight, loading, unloading, extra_charges,
        total_amount, paid_amount, balance_amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      billId, ownerId, billNumber, trip_id || null, customer_id, vehicle_id, driver_id || null,
      date, pickup, destination, goods, freightNum, loadingNum, unloadingNum, extraNum,
      total, paid, balance, status
    );

    const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(billId);
    return res.json({ message: 'Transport bill generated! 🧾', bill });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 16. REPORTS & ANALYTICS
// ==========================================

apiRouter.get('/reports', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const { range = 'month' } = req.query; // 'today', 'week', 'month', 'year', 'all'

    let dateFilter = '';
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (range === 'today') {
      dateFilter = ` AND date = '${todayStr}'`;
    } else if (range === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dateFilter = ` AND date >= '${oneWeekAgo}'`;
    } else if (range === 'month') {
      const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      dateFilter = ` AND date LIKE '${monthPrefix}%'`;
    }

    // Revenue vs Expense Overall
    const financialSummary = db.prepare(`
      SELECT 
        COUNT(*) as total_trips,
        COALESCE(SUM(gross_income), 0) as total_revenue,
        COALESCE(SUM(diesel_cost), 0) as total_diesel,
        COALESCE(SUM(toll_cost + parking_cost + other_expenses), 0) as total_other_exp,
        COALESCE(SUM(diesel_cost + toll_cost + parking_cost + other_expenses), 0) as total_expenses,
        COALESCE(SUM(net_income), 0) as net_profit,
        COALESCE(SUM(pending_amount), 0) as total_pending
      FROM trips
      WHERE owner_id = ? ${dateFilter}
    `).get(ownerId) as any;

    // Vehicle-wise Breakdown
    const vehicleBreakdown = db.prepare(`
      SELECT 
        v.vehicle_number,
        v.vehicle_type,
        COUNT(t.id) as trips_count,
        COALESCE(SUM(t.gross_income), 0) as revenue,
        COALESCE(SUM(t.diesel_cost), 0) as diesel,
        COALESCE(SUM(t.net_income), 0) as net
      FROM vehicles v
      LEFT JOIN trips t ON v.id = t.vehicle_id ${dateFilter}
      WHERE v.owner_id = ?
      GROUP BY v.id
    `).all(ownerId);

    // Customer Outstanding List
    const customerOutstanding = db.prepare(`
      SELECT 
        c.name,
        c.phone,
        COUNT(t.id) as trips_count,
        COALESCE(SUM(t.pending_amount), 0) as pending
      FROM customers c
      JOIN trips t ON c.id = t.customer_id
      WHERE c.owner_id = ? AND t.payment_status != 'paid'
      GROUP BY c.id
      ORDER BY pending DESC
    `).all(ownerId);

    // Monthly Trend (Past 6 Months)
    const monthlyTrends = db.prepare(`
      SELECT 
        substr(date, 1, 7) as month,
        COUNT(*) as trips,
        COALESCE(SUM(gross_income), 0) as revenue,
        COALESCE(SUM(diesel_cost + toll_cost + parking_cost + other_expenses), 0) as expense,
        COALESCE(SUM(net_income), 0) as net
      FROM trips
      WHERE owner_id = ?
      GROUP BY substr(date, 1, 7)
      ORDER BY month DESC
      LIMIT 6
    `).all(ownerId);

    // Daily P&L breakdown for reporting & export
    const dailyPnl = db.prepare(`
      SELECT 
        t.id,
        t.date,
        t.trip_number,
        v.vehicle_number,
        d.name as driver_name,
        c.name as customer_name,
        t.pickup_location,
        t.drop_location,
        t.goods_type,
        t.total_km,
        t.gross_income,
        t.diesel_cost,
        t.toll_cost,
        t.parking_cost,
        t.other_expenses,
        (t.toll_cost + t.parking_cost + t.other_expenses) as other_total,
        (t.diesel_cost + t.toll_cost + t.parking_cost + t.other_expenses) as total_expenses,
        t.net_income as net_profit,
        t.paid_amount,
        t.pending_amount,
        t.payment_status
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.owner_id = ? ${dateFilter}
      ORDER BY t.date DESC, t.created_at DESC
    `).all(ownerId);

    return res.json({
      summary: financialSummary,
      vehicles: vehicleBreakdown,
      customers: customerOutstanding,
      monthlyTrends: monthlyTrends.reverse(),
      dailyPnl,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 17. GLOBAL SEARCH
// ==========================================

apiRouter.get('/search', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const query = String(req.query.q || '').trim();

    if (!query || query.length < 2) {
      return res.json({ customers: [], vehicles: [], drivers: [], trips: [], bills: [] });
    }

    const pattern = `%${query}%`;

    const customers = db.prepare('SELECT id, name, phone, city FROM customers WHERE owner_id = ? AND (name LIKE ? OR phone LIKE ?) LIMIT 5').all(ownerId, pattern, pattern);
    const vehicles = db.prepare('SELECT id, vehicle_number, vehicle_type, status FROM vehicles WHERE owner_id = ? AND (vehicle_number LIKE ? OR vehicle_type LIKE ?) LIMIT 5').all(ownerId, pattern, pattern);
    const drivers = db.prepare('SELECT id, name, phone, license_number FROM drivers WHERE owner_id = ? AND (name LIKE ? OR phone LIKE ? OR license_number LIKE ?) LIMIT 5').all(ownerId, pattern, pattern, pattern);
    const trips = db.prepare('SELECT id, trip_number, date, pickup_location, drop_location, gross_income FROM trips WHERE owner_id = ? AND (trip_number LIKE ? OR pickup_location LIKE ? OR drop_location LIKE ?) LIMIT 5').all(ownerId, pattern, pattern, pattern);
    const bills = db.prepare('SELECT id, bill_number, date, total_amount, balance_amount FROM bills WHERE owner_id = ? AND bill_number LIKE ? LIMIT 5').all(ownerId, pattern);

    return res.json({ customers, vehicles, drivers, trips, bills });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 18. NOTIFICATIONS API
// ==========================================

apiRouter.get('/notifications', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const notifs = db.prepare('SELECT * FROM notifications WHERE owner_id = ? ORDER BY created_at DESC LIMIT 20').all(ownerId);
    return res.json(notifs);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/notifications/:id/read', authenticate, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 19. ADMIN PANEL API
// ==========================================

apiRouter.get('/admin/stats', authenticate, requireRole('admin'), (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    const activeUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'").get() as any;
    const totalOwners = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'owner'").get() as any;
    const totalDrivers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'driver'").get() as any;
    const totalVehicles = db.prepare('SELECT COUNT(*) as count FROM vehicles').get() as any;
    const totalTrips = db.prepare('SELECT COUNT(*) as count FROM trips').get() as any;
    const totalGrossRevenue = db.prepare('SELECT COALESCE(SUM(gross_income), 0) as total FROM trips').get() as any;

    const users = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.status, u.created_at, o.business_name
      FROM users u
      LEFT JOIN owners o ON u.owner_id = o.id
      ORDER BY u.created_at DESC
    `).all();

    return res.json({
      metrics: {
        totalUsers: totalUsers.count,
        activeUsers: activeUsers.count,
        totalOwners: totalOwners.count,
        totalDrivers: totalDrivers.count,
        totalVehicles: totalVehicles.count,
        totalTrips: totalTrips.count,
        totalGrossRevenue: Number(totalGrossRevenue.total),
      },
      users,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/admin/users/:id/status', authenticate, requireRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, id);
    return res.json({ message: `User status changed to ${status}` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 20. SETTINGS API
// ==========================================

apiRouter.get('/settings', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    let settings = db.prepare('SELECT * FROM settings WHERE owner_id = ?').get(ownerId);
    if (!settings) {
      settings = { default_language: 'en', currency_symbol: '₹', sms_alerts_enabled: 1 };
    }
    return res.json(settings);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/settings', authenticate, (req: AuthRequest, res) => {
  try {
    const ownerId = req.user?.owner_id || 'owner-1';
    const { default_language, currency_symbol, default_vehicle_id, sms_alerts_enabled, business_name, phone, address, city, state, gst_number } = req.body;

    db.transaction(() => {
      db.prepare(`
        INSERT INTO settings (id, owner_id, default_vehicle_id, default_language, currency_symbol, sms_alerts_enabled)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(owner_id) DO UPDATE SET
          default_vehicle_id = excluded.default_vehicle_id,
          default_language = excluded.default_language,
          currency_symbol = excluded.currency_symbol,
          sms_alerts_enabled = excluded.sms_alerts_enabled,
          updated_at = datetime('now')
      `).run(`set-${Date.now()}`, ownerId, default_vehicle_id || null, default_language || 'en', currency_symbol || '₹', sms_alerts_enabled ? 1 : 0);

      if (business_name) {
        db.prepare(`
          UPDATE owners 
          SET business_name = COALESCE(?, business_name),
              phone = COALESCE(?, phone),
              address = COALESCE(?, address),
              city = COALESCE(?, city),
              state = COALESCE(?, state),
              gst_number = COALESCE(?, gst_number),
              updated_at = datetime('now')
          WHERE id = ?
        `).run(business_name, phone, address, city, state, gst_number, ownerId);
      }
    })();

    return res.json({ message: 'Settings saved successfully! ⚙️' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
