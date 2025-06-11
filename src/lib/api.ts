// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

// Define interfaces for API responses
export interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string | {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceItem {
  _id?: string;
  description: string;
  quantity: number;
  price: number;
  tax?: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber?: string;
  customer?: Customer | string; // Allow both Customer object and string ID
  items?: InvoiceItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
  paymentStatus?: string;
  issueDate?: string;
  createdAt?: string;
  dueDate?: string;
  lastPaymentDate?: string;
  notes?: string;
}

export interface Transaction {
  _id: string;
  transactionId?: string;
  amount: number;
  type?: string;
  method?: string;
  date?: string;
  customer?: Customer | string;
  invoice?: Invoice | string;
  invoiceId?: string;
  reference?: string;
  status?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  _id: string;
  orderNumber?: string;
  customer?: Customer | string;
  items?: Array<{
    _id?: string;
    name: string;
    description?: string;
    quantity: number;
    price: number;
    tax?: number;
  }>;
  subtotal?: number;
  taxTotal?: number;
  discount?: number;
  shippingCost?: number;
  total?: number;
  status?: string;
  paymentStatus?: string;
  paymentDetails?: {
    method?: string;
    transactionId?: string;
    paidAmount?: number;
    paidDate?: string;
  };
  shippingAddress?: Record<string, unknown>;
  billingAddress?: Record<string, unknown>;
  orderDate?: string;
  fulfillment?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

// Simple wrapper for local storage to avoid SSR issues
const storage = {
  getToken: (): string | null => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  },
  getItem: (key: string): string | null => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  }
};

// Ultra-simplified API fetch with direct error handling
const fetchApi = async <T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  // Identify collection endpoints that should always return arrays
  // Only treat base collection endpoints as collections, not when fetching by ID
  const isCollectionEndpoint = 
    (endpoint === '/transactions' || 
     endpoint === '/invoices' || 
     endpoint === '/customers' || 
     endpoint === '/orders');
  
  try {
    console.log(`Fetching API: ${endpoint}`);
    
    // Get token from storage
    const token = storage.getToken();
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Make the request
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    // Handle auth errors
    if (response.status === 401) {
      storage.removeItem('token');
      storage.removeItem('user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = '/';
      }
      throw new Error('Authentication failed');
    }
    
    // Parse the response
    let data;
    try {
      const text = await response.text();
      
      // Check if the response is HTML (which is not valid JSON)
      if (text && text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        console.error(`Received HTML instead of JSON from ${endpoint}`);
        return isCollectionEndpoint ? ([] as T) : ({ error: 'Received HTML instead of JSON', htmlReceived: true } as T);
      }
      
      data = text ? JSON.parse(text) : null;
    } catch (parseError: unknown) {
      console.error(`Failed to parse response from ${endpoint}:`, parseError);
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      return isCollectionEndpoint ? ([] as T) : ({ error: errorMessage, parseError: true } as T);
    }
    
    // For collection endpoints, ensure we return an array
    if (isCollectionEndpoint) {
      if (!data) return ([] as T);
      if (Array.isArray(data)) return (data as T);
      return ([data] as T); // Wrap in array if single object
    }
    
    return data as T;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    
    // For collection endpoints, always return empty array instead of throwing
    if (isCollectionEndpoint) {
      console.warn(`Returning empty array for ${endpoint}`);
      return ([] as T);
    }
    
    throw error;
  }
};

// Auth API service
export const authService = {
  register: (data: Record<string, unknown>) => fetchApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  login: (data: Record<string, unknown>) => fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getCurrentUser: () => fetchApi('/auth/me'),
};

// Customer API service
export const customerService = {
  getAll: (): Promise<Customer[]> => fetchApi<Customer[]>('/customers'),
  getById: (id: string): Promise<Customer> => fetchApi<Customer>(`/customers/${id}`),
  create: (data: Partial<Customer>) => fetchApi('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<Customer>) => fetchApi(`/customers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchApi(`/customers/${id}`, {
    method: 'DELETE',
  }),
};

// Invoice API service
export const invoiceService = {
  getAll: (): Promise<Invoice[]> => fetchApi<Invoice[]>('/invoices'),
  getById: (id: string): Promise<Invoice> => fetchApi<Invoice>(`/invoices/${id}`),
  create: (data: Partial<Invoice>) => fetchApi('/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<Invoice>) => fetchApi(`/invoices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchApi(`/invoices/${id}`, {
    method: 'DELETE',
  }),
  sendEmail: (id: string, emailData: {
    to: string;
    subject: string;
    body: string;
  }) => fetchApi(`/invoices/${id}/send-email`, {
    method: 'POST',
    body: JSON.stringify(emailData),
  }),
  sendWhatsApp: (id: string, whatsAppData: {
    phoneNumber: string;
    message: string;
  }) => fetchApi(`/invoices/${id}/send-whatsapp`, {
    method: 'POST',
    body: JSON.stringify(whatsAppData),
  }),
};

// Order API service
export const orderService = {
  getAll: (): Promise<Order[]> => fetchApi<Order[]>('/orders'),
  getById: (id: string): Promise<Order> => fetchApi<Order>(`/orders/${id}`),
  create: (data: Partial<Order>) => fetchApi('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<Order>) => fetchApi(`/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchApi(`/orders/${id}`, {
    method: 'DELETE',
  }),
};

// Transaction API service
export const transactionService = {
  getAll: (): Promise<Transaction[]> => fetchApi<Transaction[]>('/transactions'),
  getById: (id: string): Promise<Transaction> => fetchApi<Transaction>(`/transactions/${id}`),
  create: (data: Partial<Transaction>) => fetchApi('/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<Transaction>) => fetchApi(`/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchApi(`/transactions/${id}`, {
    method: 'DELETE',
  }),
};

// Business Profile API service
export const businessProfileService = {
  get: () => fetchApi('/business-profile'),
  update: (data: Record<string, unknown>) => fetchApi('/business-profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  uploadLogo: (formData: FormData) => {
    // Get auth token from localStorage if available
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    
    const headers: Record<string, string> = {};
    // Add auth token to headers if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetch(`${API_URL}/business-profile/logo`, {
      method: 'POST',
      body: formData,
      headers,
      // Don't add Content-Type header for multipart/form-data
    }).then(response => {
      if (!response.ok) {
        throw new Error('Logo upload failed');
      }
      return response.json();
    }).catch(error => {
      console.error('Error uploading logo:', error);
      throw error;
    });
  },
};