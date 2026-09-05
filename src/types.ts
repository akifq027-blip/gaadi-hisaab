export type UserRole = 'driver' | 'owner' | 'fleet_owner' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'pending';
  owner_id: string | null;
}

export interface Owner {
  id: string;
  user_id: string;
  business_name: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  gst_number?: string;
}

export interface Vehicle {
  id: string;
  owner_id: string;
  vehicle_number: string;
  vehicle_type: string;
  brand_model?: string;
  manufacturing_year?: number;
  current_km: number;
  mileage_expected: number;
  assigned_driver_id?: string | null;
  assigned_driver_name?: string | null;
  status: 'available' | 'on_trip' | 'maintenance';
  is_active: number;
  total_trips?: number;
  total_revenue?: number;
  total_fuel_cost?: number;
  total_maint_cost?: number;
  total_net_income?: number;
}

export interface Driver {
  id: string;
  owner_id: string;
  user_id?: string | null;
  name: string;
  phone: string;
  address?: string;
  license_number?: string;
  license_expiry?: string;
  joining_date?: string;
  salary_monthly: number;
  monthly_salary?: number;
  assigned_vehicle_id?: string | null;
  assigned_vehicle_number?: string | null;
  vehicle_number?: string;
  emergency_contact?: string;
  status: 'active' | 'inactive';
  total_trips?: number;
  total_revenue?: number;
  total_expenses?: number;
  total_pending_trips?: number;
  pending_advances?: number;
}

export interface Customer {
  id: string;
  owner_id: string;
  name: string;
  phone: string;
  address?: string;
  city?: string;
  notes?: string;
  gst_number?: string;
  contact_person?: string;
  category?: string;
  regular_route?: string;
  credit_period_days?: number;
  credit_limit?: number;
  total_trips?: number;
  total_billed?: number;
  total_received?: number;
  total_outstanding?: number;
}

export interface Trip {
  id: string;
  owner_id: string;
  trip_number: string;
  date: string;
  vehicle_id: string;
  vehicle_number?: string;
  vehicle_type?: string;
  driver_id?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  pickup_location: string;
  drop_location: string;
  goods_type: string;
  start_km: number;
  end_km: number;
  total_km: number;
  freight_amount: number;
  loading_charge: number;
  unloading_charge: number;
  extra_charge: number;
  gross_income: number;
  diesel_cost: number;
  toll_cost: number;
  parking_cost: number;
  other_expenses: number;
  net_income: number;
  paid_amount: number;
  pending_amount: number;
  payment_status: 'paid' | 'partial' | 'pending';
  payment_method: string;
  notes?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  owner_id: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  trip_id?: string | null;
  trip_number?: string | null;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  reference_number?: string;
  notes?: string;
}

export interface FuelLog {
  id: string;
  owner_id: string;
  vehicle_id: string;
  vehicle_number?: string;
  vehicle_type?: string;
  driver_id?: string | null;
  driver_name?: string | null;
  trip_id?: string | null;
  date: string;
  liters: number;
  price_per_liter: number;
  total_amount: number;
  odometer_km: number;
  fuel_station?: string;
  payment_method?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  owner_id: string;
  vehicle_id?: string | null;
  vehicle_number?: string | null;
  driver_id?: string | null;
  driver_name?: string | null;
  date: string;
  category: 'diesel' | 'toll' | 'parking' | 'loading' | 'unloading' | 'maintenance' | 'tyre' | 'battery' | 'food' | 'challan' | 'misc';
  amount: number;
  description: string;
  payment_method: string;
  receipt_url?: string;
}

export interface MaintenanceRecord {
  id: string;
  owner_id: string;
  vehicle_id: string;
  vehicle_number?: string;
  vehicle_type?: string;
  date: string;
  odometer_km: number;
  service_type: string;
  amount: number;
  mechanic_name?: string;
  mechanic_phone?: string;
  invoice_number?: string;
  notes?: string;
}

export type MaintenanceLog = MaintenanceRecord;

export interface VehicleDocument {
  id: string;
  owner_id: string;
  vehicle_id: string;
  vehicle_number?: string;
  vehicle_type?: string;
  doc_type: 'rc' | 'insurance' | 'puc' | 'fitness' | 'permit' | 'tax' | 'other';
  doc_number: string;
  issue_date?: string;
  expiry_date: string;
  alert_days_before: number;
  notes?: string;
  remainingDays?: number;
  computedStatus?: 'valid' | 'expiring_soon' | 'expired';
}

export interface TyreRecord {
  id: string;
  owner_id: string;
  vehicle_id: string;
  vehicle_number?: string;
  position: string;
  brand: string;
  size: string;
  purchase_date?: string;
  purchase_cost: number;
  install_km: number;
  current_km: number;
  status: 'active' | 'replaced' | 'retreaded';
  notes?: string;
}

export interface DriverAdvance {
  id: string;
  owner_id: string;
  driver_id: string;
  driver_name?: string;
  date: string;
  amount: number;
  reason?: string;
  status: 'pending' | 'deducted';
}

export interface SalaryPayment {
  id: string;
  owner_id: string;
  driver_id: string;
  driver_name?: string;
  month_year: string;
  basic_salary: number;
  advance_deducted: number;
  bonus_incentive: number;
  net_paid: number;
  payment_date: string;
  payment_method: string;
  notes?: string;
}

export interface TransportBill {
  id: string;
  owner_id: string;
  bill_number: string;
  trip_id?: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  vehicle_id: string;
  vehicle_number?: string;
  driver_id?: string;
  driver_name?: string;
  date: string;
  pickup: string;
  destination: string;
  goods?: string;
  freight: number;
  loading: number;
  unloading: number;
  extra_charges: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: 'paid' | 'partial' | 'pending';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  severity: 'info' | 'warning' | 'danger';
  is_read: number;
  link?: string;
  created_at: string;
}

export interface DaySummary {
  date: string;
  trips_count: number;
  income: number;
  diesel: number;
  other_expenses: number;
  expense: number;
  net: number;
  pending: number;
}
