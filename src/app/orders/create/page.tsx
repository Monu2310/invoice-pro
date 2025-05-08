'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { orderService, customerService } from '@/lib/api';

// Define types
interface OrderItem {
  id: number;
  name: string;
  description: string;
  quantity: number;
  price: string | number;
  tax: number;
  amount: number;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  // Add other customer fields as needed
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export default function CreateOrder() {
  const router = useRouter();
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Customer state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  
  // Order status and payment status
  const [status, setStatus] = useState('Pending');
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');
  
  // Shipping address
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: ''
  });
  
  // Billing address (same as shipping by default)
  const [billingAddress, setBillingAddress] = useState<ShippingAddress>({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: ''
  });
  
  const [sameAsBilling, setSameAsBilling] = useState(true);
  
  // Payment details
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');
  
  // Load customers from API
  useEffect(() => {
    async function loadCustomers() {
      try {
        console.log('Fetching customers for order...');
        
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
          alert('No customers found. Please create a customer first before creating an order.');
          router.push('/customers');
        }
      } catch (error) {
        console.error('Error loading customers for order:', error);
        alert('Error loading customers. Please make sure your server is running at http://localhost:5002');
      }
    }
    
    loadCustomers();
  }, [router]);
  
  // Order items state
  const [items, setItems] = useState<OrderItem[]>([
    { id: 1, name: '', description: '', quantity: 1, price: '', tax: 18, amount: 0 }
  ]);
  
  const calculateAmount = (quantity: number, price: number): number => {
    return quantity * price;
  };
  
  const addItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
    setItems([...items, { id: newId, name: '', description: '', quantity: 1, price: '', tax: 18, amount: 0 }]);
  };
  
  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };
  
  const updateItem = (id: number, field: keyof OrderItem, value: string | number) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate amount if quantity or price changes
        if (field === 'quantity' || field === 'price') {
          updatedItem.amount = calculateAmount(
            field === 'quantity' ? Number(value) : item.quantity,
            field === 'price' ? Number(value) : Number(item.price)
          );
        }
        
        return updatedItem;
      }
      return item;
    });
    
    setItems(updatedItems);
  };
  
  // Handle shipping address change
  const handleShippingAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
    
    // Update billing address if same as shipping is checked
    if (sameAsBilling) {
      setBillingAddress(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Handle billing address change
  const handleBillingAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBillingAddress(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle same as billing checkbox
  const handleSameAsBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSameAsBilling(checked);
    
    if (checked) {
      setBillingAddress(shippingAddress);
    }
  };
  
  // Calculate subtotal, tax, and total
  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const taxTotal = items.reduce((sum, item) => sum + ((item.amount || 0) * (item.tax || 0) / 100), 0);
  const total = subtotal + taxTotal;
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }
    
    // Validate that all items have names and prices
    const invalidItems = items.filter(item => 
      !item.name || !item.price || item.quantity <= 0
    );
    
    if (invalidItems.length > 0) {
      alert('Please fill in all item details (name, quantity, and price)');
      return;
    }
    
    try {
      setLoading(true);
      
      // Format items for the API
      const formattedItems = items.map(item => ({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        price: Number(item.price),
        tax: item.tax,
        amount: item.amount
      }));
      
      // Prepare order data
      const orderData = {
        customer: selectedCustomer,
        orderNumber: orderNumber || undefined, // Let server generate if not provided
        orderDate: orderDate,
        items: formattedItems,
        subtotal: subtotal,
        taxTotal: taxTotal,
        total: total,
        notes: notes,
        status: status,
        paymentStatus: paymentStatus,
        shippingAddress: shippingAddress,
        billingAddress: billingAddress,
        paymentDetails: {
          method: paymentMethod || undefined,
          transactionId: transactionId || undefined,
          paidAmount: paidAmount ? Number(paidAmount) : 0,
          paidDate: paidAmount && Number(paidAmount) > 0 ? new Date() : undefined
        }
      };
      
      // Send to API
      await orderService.create(orderData);
      
      alert('Order created successfully!');
      router.push('/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Create New Order</h1>
          <p className="text-gray-600 dark:text-gray-300">Enter the details to create a new order</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {/* Order Header */}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order Number</label>
            <input 
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="ORD-2023-001"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order Date</label>
            <input 
              type="date"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select 
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Status</label>
            <select 
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              required
            >
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
              <option value="Paid">Paid</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>
        </div>
        
        {/* Shipping Address */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Shipping Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Street</label>
              <input 
                type="text"
                name="street"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={shippingAddress.street}
                onChange={handleShippingAddressChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
              <input 
                type="text"
                name="city"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={shippingAddress.city}
                onChange={handleShippingAddressChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
              <input 
                type="text"
                name="state"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={shippingAddress.state}
                onChange={handleShippingAddressChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ZIP Code</label>
              <input 
                type="text"
                name="zip"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={shippingAddress.zip}
                onChange={handleShippingAddressChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
              <input 
                type="text"
                name="country"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={shippingAddress.country}
                onChange={handleShippingAddressChange}
              />
            </div>
          </div>
        </div>
        
        {/* Billing Address */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800 dark:text-white">Billing Address</h2>
            <div className="ml-4">
              <input 
                type="checkbox" 
                id="sameAsBilling" 
                checked={sameAsBilling}
                onChange={handleSameAsBillingChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="sameAsBilling" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Same as shipping address
              </label>
            </div>
          </div>
          
          {!sameAsBilling && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Street</label>
                <input 
                  type="text"
                  name="street"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={billingAddress.street}
                  onChange={handleBillingAddressChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                <input 
                  type="text"
                  name="city"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={billingAddress.city}
                  onChange={handleBillingAddressChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                <input 
                  type="text"
                  name="state"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={billingAddress.state}
                  onChange={handleBillingAddressChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ZIP Code</label>
                <input 
                  type="text"
                  name="zip"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={billingAddress.zip}
                  onChange={handleBillingAddressChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                <input 
                  type="text"
                  name="country"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={billingAddress.country}
                  onChange={handleBillingAddressChange}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Payment Details */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Payment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
              <select 
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="">Select payment method</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="UPI">UPI</option>
                <option value="PayPal">PayPal</option>
                <option value="Check">Check</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction ID</label>
              <input 
                type="text"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount Paid (₹)</label>
              <input 
                type="number"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Order Items */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Order Items</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full mb-4">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2 w-24">Quantity</th>
                  <th className="px-4 py-2 w-32">Price (₹)</th>
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
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        required
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="text"
                        className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
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
                        value={item.price}
                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
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
        
        {/* Order Summary */}
        <div className="mb-8 flex justify-end">
          <div className="w-full md:w-72">
            <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="font-medium text-gray-800 dark:text-white">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Tax:</span>
              <span className="font-medium text-gray-800 dark:text-white">₹{taxTotal.toFixed(2)}</span>
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
            placeholder="Any additional notes..."
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
            onClick={() => router.push('/orders')}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}