// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

// Simple wrapper for local storage to avoid SSR issues
const storage = {
  getToken: () => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  },
  getItem: (key) => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  },
  setItem: (key, value) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  }
};

// Ultra-simplified API fetch with direct error handling
const fetchApi = async (endpoint, options = {}) => {
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
    const headers = {
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
        return isCollectionEndpoint ? [] : { error: 'Received HTML instead of JSON', htmlReceived: true };
      }
      
      data = text ? JSON.parse(text) : null;
    } catch (parseError) {
      console.error(`Failed to parse response from ${endpoint}:`, parseError);
      return isCollectionEndpoint ? [] : { error: parseError.message, parseError: true };
    }
    
    // For collection endpoints, ensure we return an array
    if (isCollectionEndpoint) {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      return [data]; // Wrap in array if single object
    }
    
    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    
    // For collection endpoints, always return empty array instead of throwing
    if (isCollectionEndpoint) {
      console.warn(`Returning empty array for ${endpoint}`);
      return [];
    }
    
    throw error;
  }
};

// Auth API service
export const authService = {
  register: (data) => fetchApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  login: (data) => fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getCurrentUser: () => fetchApi('/auth/me'),
};

// Customer API service
export const customerService = {
  getAll: () => fetchApi('/customers'),
  getById: (id) => fetchApi(`/customers/${id}`),
  create: (data) => fetchApi('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchApi(`/customers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchApi(`/customers/${id}`, {
    method: 'DELETE',
  }),
};

// Invoice API service
export const invoiceService = {
  getAll: () => fetchApi('/invoices'),
  getById: (id) => fetchApi(`/invoices/${id}`),
  create: (data) => fetchApi('/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchApi(`/invoices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchApi(`/invoices/${id}`, {
    method: 'DELETE',
  }),
  sendEmail: (id, emailData) => fetchApi(`/invoices/${id}/send-email`, {
    method: 'POST',
    body: JSON.stringify(emailData),
  }),
  sendWhatsApp: (id, whatsAppData) => fetchApi(`/invoices/${id}/send-whatsapp`, {
    method: 'POST',
    body: JSON.stringify(whatsAppData),
  }),
};

// Order API service
export const orderService = {
  getAll: () => fetchApi('/orders'),
  getById: (id) => fetchApi(`/orders/${id}`),
  create: (data) => fetchApi('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchApi(`/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchApi(`/orders/${id}`, {
    method: 'DELETE',
  }),
};

// Transaction API service
export const transactionService = {
  getAll: () => fetchApi('/transactions'),
  getById: (id) => fetchApi(`/transactions/${id}`),
  create: (data) => fetchApi('/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchApi(`/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchApi(`/transactions/${id}`, {
    method: 'DELETE',
  }),
};

// Business Profile API service
export const businessProfileService = {
  get: () => fetchApi('/business-profile'),
  update: (data) => fetchApi('/business-profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  uploadLogo: (formData) => {
    // Get auth token from localStorage if available
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    
    const headers = {};
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