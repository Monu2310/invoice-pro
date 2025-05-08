'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { invoiceService, customerService } from '@/lib/api';

// Define type for invoice items
interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  rate: string | number;
  amount: number;
  tax: number;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  // Add other customer fields as needed
}

export default function CreateInvoice() {
  const router = useRouter();
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  
  // Customer state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Load customers from API
  useEffect(() => {
    async function loadCustomers() {
      try {
        console.log('Fetching customers for invoice...');
        
        // Check localStorage for token
        const token = localStorage.getItem('token');
        console.log('Auth token available:', !!token);
        
        // Show the fetch URL being used
        console.log('Fetching from:', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api'}/customers`);
        
        const data = await customerService.getAll();
        console.log('Customers data received:', data);
        
        if (Array.isArray(data) && data.length > 0) {
          setCustomers(data);
        } else {
          console.warn('No customers found in database. You need to create customers first.');
          alert('No customers found. Please create a customer first before creating an invoice.');
          router.push('/customers');
        }
      } catch (error) {
        console.error('Error loading customers for invoice:', error);
        alert('Error loading customers. Please make sure your server is running at http://localhost:5002');
      }
    }
    
    loadCustomers();
  }, [router]);
  
  // Invoice items state
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, description: '', quantity: 1, rate: '', amount: 0, tax: 18 }
  ]);
  
  const calculateAmount = (quantity: number, rate: number): number => {
    return quantity * rate;
  };
  
  const addItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
    setItems([...items, { id: newId, description: '', quantity: 1, rate: '', amount: 0, tax: 18 }]);
  };
  
  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };
  
  const updateItem = (id: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate amount if quantity or rate changes
        if (field === 'quantity' || field === 'rate') {
          updatedItem.amount = calculateAmount(
            field === 'quantity' ? Number(value) : item.quantity,
            field === 'rate' ? Number(value) : Number(item.rate)
          );
        }
        
        return updatedItem;
      }
      return item;
    });
    
    setItems(updatedItems);
  };
  
  // Calculate subtotal, tax, and total
  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const taxAmount = items.reduce((sum, item) => sum + ((item.amount || 0) * (item.tax || 0) / 100), 0);
  const total = subtotal + taxAmount;
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }
    
    // Validate that all items have descriptions and prices
    const invalidItems = items.filter(item => 
      !item.description || !item.rate || item.quantity <= 0
    );
    
    if (invalidItems.length > 0) {
      alert('Please fill in all item details (description, quantity, and rate)');
      return;
    }
    
    try {
      setLoading(true);
      
      // Format items for the API
      const formattedItems = items.map(item => ({
        name: item.description, // Use description as name since we don't have a separate name field
        description: item.description,
        quantity: item.quantity,
        price: Number(item.rate),
        tax: item.tax,
        amount: item.amount // Include the calculated amount
      }));
      
      // Prepare invoice data exactly matching the server's expected fields
      const invoiceData = {
        customer: selectedCustomer,
        invoiceNumber: invoiceNumber || undefined, // Let server generate if not provided
        invoiceDate: invoiceDate,
        dueDate: dueDate,
        items: formattedItems,
        subtotal: subtotal,
        tax: taxAmount, // Use 'tax' instead of 'taxTotal' to match server's field
        total: total,
        notes: notes,
        status: 'Draft', // Set initial status
        paymentStatus: 'Unpaid' // Set initial payment status
      };
      
      console.log('Sending invoice data:', JSON.stringify(invoiceData, null, 2));
      
      try {
        // Send to API with explicit error handling
        const response = await invoiceService.create(invoiceData);
        console.log('Invoice creation response:', response);
        
        alert('Invoice created successfully!');
        router.push('/invoices');
      } catch (error) {
        console.error('Error creating invoice:', error);
        // Show more detailed error message if available
        if (error.message) {
          alert(`Failed to create invoice: ${error.message}`);
        } else {
          alert('Failed to create invoice. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Create New Invoice</h1>
          <p className="text-gray-600 dark:text-gray-300">Enter the details to create a new invoice</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {/* Invoice Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer</label>
            <select 
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              required
            >
              <option value="">Select a customer</option>
              {customers.map(customer => (
                <option key={customer._id} value={customer._id}>{customer.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Number</label>
            <input 
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="INV-2023-001"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Date</label>
            <input 
              type="date"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
            <input 
              type="date"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
        </div>
        
        {/* Invoice Items */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Invoice Items</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full mb-4">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2 w-24">Quantity</th>
                  <th className="px-4 py-2 w-32">Rate (₹)</th>
                  <th className="px-4 py-2 w-32">Amount (₹)</th>
                  <th className="px-4 py-2 w-24">Tax (%)</th>
                  <th className="px-4 py-2 w-24">Actions</th>
                </tr>
              </thead>
              
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2">
                      <input 
                        type="text"
                        className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        required
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="number"
                        min="1"
                        className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        required
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="0.00"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-gray-700 dark:text-gray-300">
                        {item.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <select 
                        className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={item.tax}
                        onChange={(e) => updateItem(item.id, 'tax', parseInt(e.target.value))}
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <button 
                        type="button"
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 focus:outline-none"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <button 
            type="button"
            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
            onClick={addItem}
          >
            + Add Item
          </button>
        </div>
        
        {/* Invoice Summary */}
        <div className="mb-8 flex justify-end">
          <div className="w-full md:w-72">
            <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="font-medium text-gray-800 dark:text-white">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Tax:</span>
              <span className="font-medium text-gray-800 dark:text-white">₹{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-b border-gray-200 dark:border-gray-700">
              <span className="text-lg font-medium text-gray-800 dark:text-white">Total:</span>
              <span className="text-lg font-bold text-gray-800 dark:text-white">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        {/* Notes */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
          <textarea 
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Any additional notes for the customer..."
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          ></textarea>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <button 
            type="button"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => router.push('/invoices')}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}