'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { orderService } from '@/lib/api';

export default function ViewOrder({ params }) {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Unwrap the params object with React.use()
  const unwrappedParams = React.use(params);
  const orderId = unwrappedParams.id;

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        const data = await orderService.getById(orderId);
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
  const formatAddress = (address) => {
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
  const orderDate = order?.orderDate || order?.createdAt 
    ? new Date(order.orderDate || order.createdAt).toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })
    : 'N/A';
  
  const updatedDate = order?.updatedAt 
    ? new Date(order.updatedAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) 
    : 'N/A';

  const paidDate = order?.paymentDetails?.paidDate 
    ? new Date(order.paymentDetails.paidDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) 
    : 'N/A';

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
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Order Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Customer Information:</h3>
              <p className="text-gray-700 dark:text-gray-300 font-medium">{order.customer?.name || 'Unknown Customer'}</p>
              <p className="text-gray-600 dark:text-gray-400">{order.customer?.email || 'No email provided'}</p>
              <p className="text-gray-600 dark:text-gray-400">{order.customer?.phone || 'No phone provided'}</p>
              
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
                  {order.paymentDetails.paidAmount > 0 && (
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="text-gray-600 dark:text-gray-400">Amount Paid: </span>
                      <span className="font-medium">₹{parseFloat(order.paymentDetails.paidAmount).toFixed(2)}</span>
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
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 text-right">{parseFloat(item.price).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 text-right">{item.tax || 0}%</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 text-right">{parseFloat(item.amount).toFixed(2)}</td>
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
                <span className="font-medium text-gray-800 dark:text-white">₹{parseFloat(order.subtotal || 0).toFixed(2)}</span>
              </div>
              
              {order.taxTotal > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                  <span className="font-medium text-gray-800 dark:text-white">₹{parseFloat(order.taxTotal || 0).toFixed(2)}</span>
                </div>
              )}
              
              {order.discount > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                  <span className="font-medium text-gray-800 dark:text-white">-₹{parseFloat(order.discount || 0).toFixed(2)}</span>
                </div>
              )}
              
              {order.shippingCost > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600 dark:text-gray-400">Shipping:</span>
                  <span className="font-medium text-gray-800 dark:text-white">₹{parseFloat(order.shippingCost || 0).toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-lg font-medium text-gray-800 dark:text-white">Total:</span>
                <span className="text-lg font-bold text-gray-800 dark:text-white">₹{parseFloat(order.total || 0).toFixed(2)}</span>
              </div>
              
              {order.paymentStatus === 'Paid' && (
                <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700 text-green-600 dark:text-green-400">
                  <span className="font-medium">Paid:</span>
                  <span className="font-bold">₹{parseFloat(order.paymentDetails?.paidAmount || order.total || 0).toFixed(2)}</span>
                </div>
              )}
              
              {order.paymentStatus === 'Partial' && (
                <>
                  <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700 text-green-600 dark:text-green-400">
                    <span className="font-medium">Paid:</span>
                    <span className="font-bold">₹{parseFloat(order.paymentDetails?.paidAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-red-600 dark:text-red-400">
                    <span className="font-medium">Balance Due:</span>
                    <span className="font-bold">₹{parseFloat(order.total - (order.paymentDetails?.paidAmount || 0)).toFixed(2)}</span>
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