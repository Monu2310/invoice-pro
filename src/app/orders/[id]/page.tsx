'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { orderService, Order, Customer } from '@/lib/api';
import PDFDownloadButton from '@/components/ui/PDFDownloadButton';

interface Params {
  id: string;
}

interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export default function ViewOrder({ params }: { params: Promise<Params> }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Reference to the order content for PDF generation
  const orderRef = useRef<HTMLDivElement>(null);

  // Unwrap the params object with React.use() with error handling
  let orderId: string;
  try {
    const unwrappedParams = React.use(params) as Params;
    orderId = unwrappedParams?.id;
    console.log('Order ID from params:', orderId);
    
    if (!orderId) {
      console.error('Order ID is undefined or null');
      throw new Error('Order ID is required');
    }
  } catch (error) {
    console.error('Error unwrapping params:', error);
    orderId = 'error';
  }

  // Helper function to get customer name with enhanced error handling
  const getCustomerName = (customer: Customer | string | undefined): string => {
    try {
      console.log('getCustomerName called with:', customer, 'type:', typeof customer);
      
      if (!customer) {
        console.log('Customer is null/undefined');
        return 'Unknown Customer';
      }
      
      if (typeof customer === 'string') {
        console.log('Customer is a string ID:', customer);
        return 'Unknown Customer';
      }
      
      // Check if customer is an object but might be missing properties
      if (typeof customer === 'object' && customer !== null) {
        console.log('Customer object properties:', Object.keys(customer));
        const name = customer.name;
        console.log('Customer name property:', name, 'type:', typeof name);
        
        if (name && typeof name === 'string' && name.trim()) {
          return name.trim();
        }
        
        // If name is missing, try to construct from other fields
        if (customer.email && typeof customer.email === 'string' && customer.email.trim()) {
          try {
            const emailParts = customer.email.split('@');
            return emailParts[0] || 'Unknown Customer';
          } catch (splitError) {
            console.error('Error splitting email:', splitError, 'email:', customer.email);
            return 'Unknown Customer';
          }
        }
        
        return 'Unknown Customer';
      }
      
      console.error('Unexpected customer type:', typeof customer, customer);
      return 'Unknown Customer';
    } catch (error) {
      console.error('Error in getCustomerName:', error);
      return 'Unknown Customer';
    }
  };

  // Helper function to get customer email
  const getCustomerEmail = (customer: Customer | string | undefined): string => {
    if (!customer) return 'No email provided';
    if (typeof customer === 'string') return 'No email provided';
    return customer.email || 'No email provided';
  };

  // Helper function to get customer phone
  const getCustomerPhone = (customer: Customer | string | undefined): string => {
    if (!customer) return 'No phone provided';
    if (typeof customer === 'string') return 'No phone provided';
    return customer.phone || 'No phone provided';
  };

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        const data = await orderService.getById(orderId);
        console.log('Fetched order data:', data);
        console.log('Customer data:', data.customer);
        console.log('Customer type:', typeof data.customer);
        if (data.customer && typeof data.customer === 'object') {
          console.log('Customer name:', data.customer.name);
          console.log('Customer name type:', typeof data.customer.name);
        }
        setOrder(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order. Please try again later.');
        setLoading(false);
      }
    }
    
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // Format customer address
  const formatAddress = (address: Address | string | undefined) => {
    if (!address) return 'No address provided';
    
    if (typeof address === 'string') return address;
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zip) parts.push(address.zip);
    if (address.country) parts.push(address.country);
    
    return parts.length > 0 ? parts.join(', ') : 'No address provided';
  };

  // Early return for loading or error states
  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">Loading order...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            onClick={() => router.push('/orders')}
          >
            Back to Orders
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">Order not found</p>
          <button 
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            onClick={() => router.push('/orders')}
          >
            Back to Orders
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Format dates with error handling
  const orderDate = (() => {
    try {
      const dateValue = order?.orderDate || order?.createdAt;
      if (!dateValue) return 'N/A';
      
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date value:', dateValue);
        return 'N/A';
      }
      
      return date.toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting order date:', error);
      return 'N/A';
    }
  })();
  
  const updatedDate = (() => {
    try {
      if (!order?.updatedAt) return 'N/A';
      
      const date = new Date(order.updatedAt);
      if (isNaN(date.getTime())) {
        console.warn('Invalid updatedAt date:', order.updatedAt);
        return 'N/A';
      }
      
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting updated date:', error);
      return 'N/A';
    }
  })();

  const paidDate = (() => {
    try {
      if (!order?.paymentDetails?.paidDate) return 'N/A';
      
      const date = new Date(order.paymentDetails.paidDate);
      if (isNaN(date.getTime())) {
        console.warn('Invalid paidDate:', order.paymentDetails.paidDate);
        return 'N/A';
      }
      
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting paid date:', error);
      return 'N/A';
    }
  })();

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Order #{order.orderNumber || order._id}</h1>
          <p className="text-gray-600 dark:text-gray-300">
            <span className={`inline-flex text-xs leading-5 font-semibold rounded-full px-2 ${
              order.status === 'Delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              order.status === 'Processing' || order.status === 'Shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              order.status === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              {order.status}
            </span>
            <span className="ml-2">Ordered on {orderDate}</span>
          </p>
        </div>
        <div className="flex space-x-2">
          <PDFDownloadButton
            elementRef={orderRef}
            options={{
              filename: (() => {
                try {
                  // Safe fallback values with extra null checks
                  const orderNumber = (order?.orderNumber || order?._id || 'unknown').toString();
                  const customerName = getCustomerName(order?.customer);
                  
                  console.log('PDF filename generation - orderNumber:', orderNumber);
                  console.log('PDF filename generation - customerName:', customerName);
                  console.log('PDF filename generation - customerName type:', typeof customerName);
                  
                  // Ensure we have a valid string for filename generation
                  let safeName = 'unknown';
                  if (customerName && typeof customerName === 'string' && customerName.trim()) {
                    // More defensive string operations with null checks
                    safeName = String(customerName)
                      .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special chars
                      .replace(/\s+/g, '_') // Replace spaces with underscores
                      .toLowerCase() // Convert to lowercase
                      .substring(0, 20); // Limit length
                  }
                  
                  // Additional validation for safeName
                  if (!safeName || safeName.trim() === '') {
                    safeName = 'customer';
                  }
                  
                  const filename = `order_${String(orderNumber)}_${String(safeName)}.pdf`;
                  console.log('Generated filename:', filename);
                  return filename;
                } catch (error) {
                  console.error('Error generating PDF filename:', error);
                  console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
                  const fallbackName = `order_${Date.now()}_error.pdf`;
                  console.log('Using fallback filename:', fallbackName);
                  return fallbackName;
                }
              })(),
              title: `Order ${order.orderNumber || order._id}`,
              orientation: 'portrait',
              format: 'a4'
            }}
            onError={(error) => {
              console.error('PDF generation error details:', error);
              console.error('Error type:', typeof error);
              console.error('Error string representation:', String(error));
              
              // Try to extract more information about the error
              if (error instanceof Error) {
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
              }
              
              alert(`PDF generation failed: ${error}`);
            }}
            onSuccess={(filename) => {
              console.log('PDF generated successfully:', filename);
            }}
            onGenerating={(generating) => {
              console.log('PDF generating:', generating);
            }}
            variant="primary"
            size="md"
          />
          {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
            <button 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              onClick={() => router.push(`/orders/${order._id}/edit`)}
            >
              Edit Order
            </button>
          )}
          <button 
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => router.push('/orders')}
          >
            Back to Orders
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" ref={orderRef}>
        {/* Order Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Customer Information:</h3>
              <p className="text-gray-700 dark:text-gray-300 font-medium">{getCustomerName(order.customer)}</p>
              <p className="text-gray-600 dark:text-gray-400">{getCustomerEmail(order.customer)}</p>
              <p className="text-gray-600 dark:text-gray-400">{getCustomerPhone(order.customer)}</p>
              
              <div className="mt-4">
                <h4 className="text-md font-bold text-gray-700 dark:text-gray-300 mb-1">Shipping Address:</h4>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{formatAddress(order.shippingAddress)}</p>
              </div>
              
              <div className="mt-4">
                <h4 className="text-md font-bold text-gray-700 dark:text-gray-300 mb-1">Billing Address:</h4>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{formatAddress(order.billingAddress)}</p>
              </div>
            </div>
            <div className="md:text-right">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Order Details:</h3>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-600 dark:text-gray-400">Order Number: </span>
                <span className="font-medium">{order.orderNumber || order._id}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-600 dark:text-gray-400">Order Date: </span>
                <span className="font-medium">{orderDate}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-600 dark:text-gray-400">Last Updated: </span>
                <span className="font-medium">{updatedDate}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-600 dark:text-gray-400">Status: </span>
                <span className={`font-medium ${
                  order.status === 'Delivered' ? 'text-green-600 dark:text-green-400' :
                  order.status === 'Processing' || order.status === 'Shipped' ? 'text-blue-600 dark:text-blue-400' :
                  order.status === 'Pending' ? 'text-yellow-600 dark:text-yellow-400' :
                  order.status === 'Cancelled' ? 'text-red-600 dark:text-red-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}>{order.status}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-600 dark:text-gray-400">Payment Status: </span>
                <span className={`font-medium ${
                  order.paymentStatus === 'Paid' ? 'text-green-600 dark:text-green-400' :
                  order.paymentStatus === 'Partial' ? 'text-yellow-600 dark:text-yellow-400' :
                  order.paymentStatus === 'Refunded' ? 'text-blue-600 dark:text-blue-400' :
                  'text-red-600 dark:text-red-400'
                }`}>{order.paymentStatus}</span>
              </p>
              
              {order.paymentDetails && (
                <div className="mt-4 text-left md:text-right">
                  <h4 className="text-md font-bold text-gray-700 dark:text-gray-300 mb-1">Payment Details:</h4>
                  {order.paymentDetails.method && (
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="text-gray-600 dark:text-gray-400">Method: </span>
                      <span className="font-medium">{order.paymentDetails.method}</span>
                    </p>
                  )}
                  {order.paymentDetails.transactionId && (
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="text-gray-600 dark:text-gray-400">Transaction ID: </span>
                      <span className="font-medium">{order.paymentDetails.transactionId}</span>
                    </p>
                  )}
                  {(order.paymentDetails.paidAmount || 0) > 0 && (
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="text-gray-600 dark:text-gray-400">Amount Paid: </span>
                      <span className="font-medium">₹{parseFloat(String(order.paymentDetails.paidAmount || 0)).toFixed(2)}</span>
                    </p>
                  )}
                  {order.paymentDetails.paidDate && (
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="text-gray-600 dark:text-gray-400">Payment Date: </span>
                      <span className="font-medium">{paidDate}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Order Items */}
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price (₹)</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tax</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {order.items && order.items.map((item, index) => (
                <tr key={item._id || index}>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    <div className="font-medium">{item.name}</div>
                    {item.description && <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">{item.description}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 text-right">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 text-right">{parseFloat(String(item.price)).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 text-right">{item.tax || 0}%</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 text-right">{parseFloat(String(item.quantity * item.price)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Order Summary */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end">
            <div className="w-full md:w-72">
              <div className="flex justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="font-medium text-gray-800 dark:text-white">₹{parseFloat(String(order.subtotal || 0)).toFixed(2)}</span>
              </div>
              
              {(order.taxTotal || 0) > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                  <span className="font-medium text-gray-800 dark:text-white">₹{parseFloat(String(order.taxTotal || 0)).toFixed(2)}</span>
                </div>
              )}
              
              {(order.discount || 0) > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                  <span className="font-medium text-gray-800 dark:text-white">-₹{parseFloat(String(order.discount || 0)).toFixed(2)}</span>
                </div>
              )}
              
              {(order.shippingCost || 0) > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600 dark:text-gray-400">Shipping:</span>
                  <span className="font-medium text-gray-800 dark:text-white">₹{parseFloat(String(order.shippingCost || 0)).toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-lg font-medium text-gray-800 dark:text-white">Total:</span>
                <span className="text-lg font-bold text-gray-800 dark:text-white">₹{parseFloat(String(order.total || 0)).toFixed(2)}</span>
              </div>
              
              {order.paymentStatus === 'Paid' && (
                <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700 text-green-600 dark:text-green-400">
                  <span className="font-medium">Paid:</span>
                  <span className="font-bold">₹{parseFloat(String(order.paymentDetails?.paidAmount || order.total || 0)).toFixed(2)}</span>
                </div>
              )}
              
              {order.paymentStatus === 'Partial' && (
                <>
                  <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700 text-green-600 dark:text-green-400">
                    <span className="font-medium">Paid:</span>
                    <span className="font-bold">₹{parseFloat(String(order.paymentDetails?.paidAmount || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-red-600 dark:text-red-400">
                    <span className="font-medium">Balance Due:</span>
                    <span className="font-bold">₹{String((order.total || 0) - (order.paymentDetails?.paidAmount || 0)).replace(/^/, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Notes Section */}
        {order.notes && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Notes:</h3>
            <p className="text-gray-700 dark:text-gray-300">{order.notes}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}