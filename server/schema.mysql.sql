-- ==========================================================
-- GAADI HISAAB: PRODUCTION-READY MYSQL DATABASE SCHEMA
-- "Hisaab, Trip aur Gaadi — Sab Ek Jagah"
-- ==========================================================

CREATE DATABASE IF NOT EXISTS gaadi_hisaab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gaadi_hisaab;

-- 1. Users Table (Authentication & System Roles)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('driver', 'owner', 'fleet_owner', 'admin') NOT NULL DEFAULT 'owner',
    status ENUM('active', 'suspended', 'pending') NOT NULL DEFAULT 'active',
    owner_id VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_phone (phone)
) ENGINE=InnoDB;

-- 2. Owners Table (Business profile)
CREATE TABLE IF NOT EXISTS owners (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    business_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    city VARCHAR(80),
    state VARCHAR(80),
    gst_number VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_owner_user (user_id)
) ENGINE=InnoDB;

-- 3. Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    vehicle_number VARCHAR(30) NOT NULL,
    vehicle_type VARCHAR(60) NOT NULL, -- e.g. Tata Ace, Bolero Pickup, DCM, Eicher
    brand_model VARCHAR(80),
    manufacturing_year INT,
    current_km INT NOT NULL DEFAULT 0,
    mileage_expected DECIMAL(6,2) DEFAULT 12.00,
    assigned_driver_id VARCHAR(36) NULL,
    status ENUM('available', 'on_trip', 'maintenance') NOT NULL DEFAULT 'available',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    INDEX idx_vehicle_owner (owner_id),
    INDEX idx_vehicle_number (vehicle_number)
) ENGINE=InnoDB;

-- 4. Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    license_number VARCHAR(50),
    license_expiry DATE,
    joining_date DATE,
    salary_monthly DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    assigned_vehicle_id VARCHAR(36) NULL,
    emergency_contact VARCHAR(50),
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    INDEX idx_driver_owner (owner_id),
    INDEX idx_driver_phone (phone)
) ENGINE=InnoDB;

-- Add foreign key back to vehicles for assigned driver
ALTER TABLE vehicles 
ADD CONSTRAINT fk_vehicle_driver 
FOREIGN KEY (assigned_driver_id) REFERENCES drivers(id) ON DELETE SET NULL;

-- 5. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    city VARCHAR(80),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    INDEX idx_customer_owner (owner_id),
    INDEX idx_customer_phone (phone)
) ENGINE=InnoDB;

-- 6. Trips Table (Core Hisaab & Trip Records)
CREATE TABLE IF NOT EXISTS trips (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    trip_number VARCHAR(40) NOT NULL,
    date DATE NOT NULL,
    vehicle_id VARCHAR(36) NOT NULL,
    driver_id VARCHAR(36) NULL,
    customer_id VARCHAR(36) NULL,
    pickup_location VARCHAR(120) NOT NULL,
    drop_location VARCHAR(120) NOT NULL,
    goods_type VARCHAR(100),
    start_km INT DEFAULT 0,
    end_km INT DEFAULT 0,
    total_km INT DEFAULT 0,
    freight_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    loading_charge DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    unloading_charge DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    extra_charge DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    gross_income DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    diesel_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    toll_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    parking_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    other_expenses DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    net_income DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    pending_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    payment_status ENUM('paid', 'partial', 'pending') NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(40) DEFAULT 'cash',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    INDEX idx_trip_owner_date (owner_id, date),
    INDEX idx_trip_vehicle (vehicle_id),
    INDEX idx_trip_customer (customer_id),
    INDEX idx_trip_payment_status (payment_status)
) ENGINE=InnoDB;

-- 7. Payments Table (Udhaar / Receipts Ledger)
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    trip_id VARCHAR(36) NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method ENUM('cash', 'upi', 'bank_transfer', 'cheque') NOT NULL DEFAULT 'cash',
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
    INDEX idx_payment_owner_cust (owner_id, customer_id),
    INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB;

-- 8. Fuel Logs Table (Diesel Tracker)
CREATE TABLE IF NOT EXISTS fuel_logs (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    vehicle_id VARCHAR(36) NOT NULL,
    driver_id VARCHAR(36) NULL,
    trip_id VARCHAR(36) NULL,
    date DATE NOT NULL,
    liters DECIMAL(8,2) NOT NULL,
    price_per_liter DECIMAL(8,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    odometer_km INT NOT NULL DEFAULT 0,
    fuel_station VARCHAR(120),
    payment_method VARCHAR(40) DEFAULT 'cash',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
    INDEX idx_fuel_owner_vehicle (owner_id, vehicle_id),
    INDEX idx_fuel_date (date)
) ENGINE=InnoDB;

-- 9. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    vehicle_id VARCHAR(36) NULL,
    driver_id VARCHAR(36) NULL,
    trip_id VARCHAR(36) NULL,
    date DATE NOT NULL,
    category ENUM('diesel', 'toll', 'parking', 'loading', 'unloading', 'maintenance', 'tyre', 'battery', 'food', 'challan', 'misc') NOT NULL DEFAULT 'misc',
    amount DECIMAL(12,2) NOT NULL,
    description TEXT NOT NULL,
    payment_method VARCHAR(40) DEFAULT 'cash',
    receipt_url TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
    INDEX idx_expense_owner_date (owner_id, date),
    INDEX idx_expense_cat (category)
) ENGINE=InnoDB;

-- 10. Vehicle Maintenance Table
CREATE TABLE IF NOT EXISTS maintenance (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    vehicle_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    odometer_km INT DEFAULT 0,
    service_type ENUM('engine_oil', 'brake', 'clutch', 'tyre', 'battery', 'general_service', 'electrical', 'suspension', 'other') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    mechanic_name VARCHAR(120),
    mechanic_phone VARCHAR(30),
    invoice_number VARCHAR(60),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    INDEX idx_maint_owner_veh (owner_id, vehicle_id)
) ENGINE=InnoDB;

-- 11. Vehicle Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    vehicle_id VARCHAR(36) NOT NULL,
    doc_type ENUM('rc', 'insurance', 'puc', 'fitness', 'permit', 'tax', 'other') NOT NULL,
    doc_number VARCHAR(80) NOT NULL,
    issue_date DATE NULL,
    expiry_date DATE NOT NULL,
    alert_days_before INT DEFAULT 15,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    INDEX idx_doc_expiry (expiry_date)
) ENGINE=InnoDB;

-- 12. Tyre Management Table
CREATE TABLE IF NOT EXISTS tyres (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    vehicle_id VARCHAR(36) NOT NULL,
    position ENUM('front_left', 'front_right', 'rear_left_outer', 'rear_left_inner', 'rear_right_outer', 'rear_right_inner', 'spare') NOT NULL,
    brand VARCHAR(60) NOT NULL,
    size VARCHAR(40) NOT NULL,
    purchase_date DATE,
    purchase_cost DECIMAL(12,2) DEFAULT 0.00,
    install_km INT DEFAULT 0,
    current_km INT DEFAULT 0,
    status ENUM('active', 'replaced', 'retreaded') NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 13. Driver Advances Table
CREATE TABLE IF NOT EXISTS driver_advances (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    driver_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    reason TEXT,
    status ENUM('pending', 'deducted') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    INDEX idx_advance_driver (driver_id)
) ENGINE=InnoDB;

-- 14. Salary Payments Table
CREATE TABLE IF NOT EXISTS salary_payments (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    driver_id VARCHAR(36) NOT NULL,
    month_year VARCHAR(10) NOT NULL, -- e.g. "09/2026"
    basic_salary DECIMAL(12,2) NOT NULL,
    advance_deducted DECIMAL(12,2) DEFAULT 0.00,
    bonus_incentive DECIMAL(12,2) DEFAULT 0.00,
    net_paid DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(40) DEFAULT 'cash',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 15. Bills / Invoices Table
CREATE TABLE IF NOT EXISTS bills (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    bill_number VARCHAR(50) NOT NULL,
    trip_id VARCHAR(36) NULL,
    customer_id VARCHAR(36) NOT NULL,
    vehicle_id VARCHAR(36) NOT NULL,
    driver_id VARCHAR(36) NULL,
    date DATE NOT NULL,
    pickup VARCHAR(120) NOT NULL,
    destination VARCHAR(120) NOT NULL,
    goods VARCHAR(100),
    freight DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    loading DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    unloading DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    extra_charges DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    balance_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status ENUM('paid', 'partial', 'pending') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_bill_num (bill_number)
) ENGINE=InnoDB;

-- 16. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('document_expiry', 'payment_reminder', 'service_due', 'salary_due', 'system') NOT NULL,
    severity ENUM('info', 'warning', 'danger') NOT NULL DEFAULT 'info',
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    link VARCHAR(120) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    INDEX idx_notif_unread (owner_id, is_read)
) ENGINE=InnoDB;

-- 17. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    action VARCHAR(60) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    INDEX idx_audit_owner (owner_id)
) ENGINE=InnoDB;

-- 18. Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) UNIQUE NOT NULL,
    default_vehicle_id VARCHAR(36) NULL,
    default_language VARCHAR(10) DEFAULT 'en',
    currency_symbol VARCHAR(10) DEFAULT '₹',
    business_logo TEXT NULL,
    sms_alerts_enabled TINYINT(1) DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
) ENGINE=InnoDB;
