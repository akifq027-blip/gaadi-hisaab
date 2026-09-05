import {
  User,
  Vehicle,
  Driver,
  Customer,
  Trip,
  Payment,
  FuelLog,
  Expense,
  MaintenanceRecord,
  VehicleDocument,
  TyreRecord,
  DriverAdvance,
  SalaryPayment,
  TransportBill,
  NotificationItem,
  DaySummary,
} from './types';

const TOKEN_KEY = 'gaadi_hisaab_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Server request failed');
  }

  return data as T;
}

// Indian Rupee currency formatter with correct commas: ₹1,25,000 or ₹4,500
export function formatINR(amount: number | string | undefined | null): string {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
  });
}

// Format readable date
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = parts[2];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const year = parts[0];
    return `${day} ${months[monthIndex]} ${year}`;
  }
  return dateStr;
}

// API CLIENT
export const api = {
  // Auth
  login: (login: string, password: string) =>
    request<{ token: string; user: User; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    }),

  demoLogin: (role: string = 'owner') =>
    request<{ token: string; user: User; message: string }>('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  register: (data: any) =>
    request<{ token: string; user: User; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<{ user: User; owner: any; settings: any }>('/api/auth/me'),

  logout: () => {
    clearStoredToken();
  },

  switchRole: (role: string) =>
    request<{ user: User; token: string }>('/api/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  // Dashboard
  getDashboard: () =>
    request<{
      date: string;
      today: {
        trips: number;
        income: number;
        expenses: number;
        diesel: number;
        otherExpenses: number;
        netIncome: number;
        pendingToday: number;
      };
      totalPending: number;
      fleet: { vehicles: number; drivers: number };
      recentTrips: Trip[];
      reminders: NotificationItem[];
    }>('/api/dashboard'),

  // Vehicles
  getVehicles: () => request<Vehicle[]>('/api/vehicles'),
  addVehicle: (data: Partial<Vehicle>) =>
    request<{ message: string; vehicle: Vehicle }>('/api/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateVehicle: (id: string, data: Partial<Vehicle>) =>
    request<{ message: string; vehicle: Vehicle }>(`/api/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteVehicle: (id: string) =>
    request<{ message: string }>(`/api/vehicles/${id}`, {
      method: 'DELETE',
    }),

  // Drivers
  getDrivers: () => request<Driver[]>('/api/drivers'),
  addDriver: (data: Partial<Driver>) =>
    request<{ message: string; driver: Driver }>('/api/drivers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateDriver: (id: string, data: Partial<Driver>) =>
    request<{ message: string; driver: Driver }>(`/api/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Customers
  getCustomers: () => request<Customer[]>('/api/customers'),
  seedCustomerDemo: () =>
    request<{ message: string }>('/api/customers/seed-demo', {
      method: 'POST',
    }),
  addCustomer: (data: Partial<Customer>) =>
    request<{ message: string; customer: Customer }>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCustomer: (id: string, data: Partial<Customer>) =>
    request<{ message: string; customer: Customer }>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getCustomerDetail: (id: string) =>
    request<{
      customer: Customer;
      summary: {
        totalBilled: number;
        totalReceived: number;
        totalOutstanding: number;
        tripsCount: number;
        paymentsCount?: number;
      };
      trips: Trip[];
      payments: Payment[];
      ledger?: Array<{
        id: string;
        date: string;
        type: 'trip' | 'payment';
        title: string;
        subtitle: string;
        reference?: string;
        vehicle_number?: string;
        debit: number;
        credit: number;
        balance: number;
      }>;
    }>(`/api/customers/${id}`),

  // Trips & Daily Hisaab
  getTrips: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<Trip[]>(`/api/trips${query}`);
  },
  createTrip: (data: any) =>
    request<{ message: string; trip: Trip }>('/api/trips', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteTrip: (id: string) =>
    request<{ message: string }>(`/api/trips/${id}`, {
      method: 'DELETE',
    }),

  // Day-wise Hisaab Calendar
  getHisaabCalendar: (year?: string, month?: string) => {
    const query = year && month ? `?year=${year}&month=${month}` : '';
    return request<DaySummary[]>(`/api/hisaab/calendar${query}`);
  },

  // Payments / Udhaar
  getPayments: () => request<Payment[]>('/api/payments'),
  receivePayment: (data: any) =>
    request<{ message: string }>('/api/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Fuel / Diesel
  getFuel: () =>
    request<{
      logs: FuelLog[];
      summary: { totalLiters: number; totalAmount: number; avgPrice: number };
    }>('/api/fuel'),
  addFuel: (data: any) =>
    request<{ message: string; id: string }>('/api/fuel', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Expenses
  getExpenses: () =>
    request<{
      expenses: Expense[];
      categoryTotals: Record<string, number>;
      totalExpense: number;
    }>('/api/expenses'),
  addExpense: (data: any) =>
    request<{ message: string; id: string }>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Maintenance
  getMaintenance: () =>
    request<{ records: MaintenanceRecord[]; totalMaintCost: number }>('/api/maintenance'),
  addMaintenance: (data: any) =>
    request<{ message: string; id: string }>('/api/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Documents
  getDocuments: () => request<VehicleDocument[]>('/api/documents'),
  addDocument: (data: any) =>
    request<{ message: string; id: string }>('/api/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Tyres
  getTyres: () => request<TyreRecord[]>('/api/tyres'),
  addTyre: (data: any) =>
    request<{ message: string; id: string }>('/api/tyres', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Salary & Advances
  getSalaryData: () =>
    request<{ advances: DriverAdvance[]; payments: SalaryPayment[] }>('/api/salary'),
  addAdvance: (data: any) =>
    request<{ message: string; id: string }>('/api/salary/advance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteAdvance: (id: string) =>
    request<{ message: string }>(`/api/salary/advance/${id}`, {
      method: 'DELETE',
    }),
  paySalary: (data: any) =>
    request<{ message: string; id: string; netPaid: number }>('/api/salary/pay', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Bills
  getBills: () => request<TransportBill[]>('/api/bills'),
  createBill: (data: any) =>
    request<{ message: string; bill: TransportBill }>('/api/bills', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Reports
  getReports: (range = 'month') =>
    request<{
      summary: any;
      vehicles: any[];
      customers: any[];
      monthlyTrends: any[];
      dailyPnl: any[];
    }>(`/api/reports?range=${range}`),

  // Notifications
  getNotifications: () => request<NotificationItem[]>('/api/notifications'),
  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'PUT' }),

  // Search
  search: (q: string) =>
    request<{
      customers: any[];
      vehicles: any[];
      drivers: any[];
      trips: any[];
      bills: any[];
    }>(`/api/search?q=${encodeURIComponent(q)}`),

  // Admin
  getAdminStats: () =>
    request<{
      metrics: {
        totalUsers: number;
        activeUsers: number;
        totalOwners: number;
        totalDrivers: number;
        totalVehicles: number;
        totalTrips: number;
        totalGrossRevenue: number;
      };
      users: any[];
    }>('/api/admin/stats'),

  updateUserStatus: (id: string, status: string) =>
    request<{ message: string }>(`/api/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // Settings
  getSettings: () => request<any>('/api/settings'),
  updateSettings: (data: any) =>
    request<{ message: string }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
