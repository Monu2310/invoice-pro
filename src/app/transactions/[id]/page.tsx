'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { transactionService } from "@/lib/api";

// Utility function to check if a date is valid
const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

export default function TransactionDetail({ params }) {
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const transactionId = unwrappedParams.id;
  
  const router = useRouter();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        console.log('Fetching transaction with ID:', transactionId);
        const data = await transactionService.getById(transactionId);
        
        // Add detailed debugging to see the structure of the returned data
        console.log('Transaction data received (stringified):', JSON.stringify(data, null, 2));
        console.log('Transaction data structure:', {
          dataType: typeof data,
          hasCustomer: data && 'customer' in data,
          customerType: data?.customer ? typeof data.customer : 'undefined',
          amount: data?.amount,
          amountType: data?.amount ? typeof data.amount : 'undefined',
          date: data?.date,
          dateValid: data?.date ? !isNaN(new Date(data.date)) : false
        });
        
        if (!data) {
          console.error('No transaction data returned from API');
          setError('Transaction not found');
          setLoading(false);
          return;
        }
        
        // For MongoDB ObjectId that might be stored as string
        if (data.customer && typeof data.customer === 'string') {
          console.warn('Customer is a string ID and not populated:', data.customer);
        }
        
        // Check date validity
        if (data.date) {
          const dateObj = new Date(data.date);
          console.log('Date parsed as:', dateObj, 'Valid:', !isNaN(dateObj));
        } else {
          console.warn('Transaction has no date field');
        }
        
        setTransaction(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching transaction:', err);
        setError('Failed to load transaction. Please try again later.');
        setLoading(false);
      }
    };

    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      try {
        await transactionService.delete(transaction._id);
        router.push('/transactions?refresh=true');
      } catch (err) {
        console.error('Error deleting transaction:', err);
        alert('Failed to delete transaction. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!transaction) {
    return (
      <DashboardLayout>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Not Found! </strong>
          <span className="block sm:inline">The requested transaction could not be found.</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Transaction Details</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Transaction #{transaction.transactionId || transaction._id}
          </p>
        </div>
        <div className="flex gap-2">
          <Link 
            href="/transactions" 
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
          >
            Back to Transactions
          </Link>
          <Link 
            href={`/transactions/${transaction._id}/edit`}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Edit Transaction
          </Link>
          <button 
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Delete Transaction
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white border-b pb-2">Transaction Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Transaction ID</label>
                  <div className="mt-1 text-gray-900 dark:text-white">{transaction.transactionId || transaction._id}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Amount</label>
                  <div className="mt-1 text-gray-900 dark:text-white text-xl font-semibold">
                    {transaction.amount ? `₹${parseFloat(transaction.amount).toLocaleString('en-IN')}` : 'Not specified'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Type</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.type === 'Payment' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      transaction.type === 'Refund' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {transaction.type || 'Payment'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Method</label>
                  <div className="mt-1 text-gray-900 dark:text-white">{transaction.method || 'Not specified'}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Date</label>
                  <div className="mt-1 text-gray-900 dark:text-white">
                    {isValidDate(transaction.date || transaction.createdAt) ? 
                      new Date(transaction.date || transaction.createdAt).toLocaleDateString('en-IN', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric',
                        weekday: 'long'
                      }) : 'Not specified'}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white border-b pb-2">Related Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Customer</label>
                  <div className="mt-1 text-gray-900 dark:text-white">
                    {transaction.customer && typeof transaction.customer !== 'string' ? (
                      <Link 
                        href={`/customers/${transaction.customer._id}`}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        {transaction.customer.name || 'Customer'}
                      </Link>
                    ) : (
                      'Unknown Customer'
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Reference</label>
                  <div className="mt-1 text-gray-900 dark:text-white">
                    {transaction.invoice ? (
                      <Link 
                        href={`/invoices/${transaction.invoice._id || transaction.invoice}`}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Invoice #{transaction.invoice.invoiceNumber || transaction.invoice._id || transaction.invoice}
                      </Link>
                    ) : transaction.invoiceId ? (
                      <Link 
                        href={`/invoices/${transaction.invoiceId}`}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Invoice #{transaction.invoiceId}
                      </Link>
                    ) : (
                      transaction.reference || 'No reference'
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      transaction.status === 'Failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      transaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {transaction.status || 'Completed'}
                    </span>
                  </div>
                </div>
              </div>
              
              {transaction.notes && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notes</label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                    {transaction.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}