'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { transactionService, customerService, invoiceService, Customer, Invoice } from "@/lib/api";
import Link from 'next/link';

export default function CreateTransaction() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    amount: '',
    type: 'Payment',
    method: 'Cash',
    date: new Date().toISOString().split('T')[0],
    customerId: '',
    invoiceId: '',
    reference: '',
    notes: '',
    status: 'Completed'
  });
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [customersData, invoicesData] = await Promise.all([
          customerService.getAll(),
          invoiceService.getAll()
        ]);
        
        setCustomers(customersData);
        setInvoices(invoicesData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load necessary data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Helper function to get customer ID from invoice
  const getCustomerId = (customer: Customer | string | undefined): string | undefined => {
    if (!customer) return undefined;
    if (typeof customer === 'string') return customer;
    return customer._id;
  };

  // Update available invoices when customer changes
  useEffect(() => {
    if (formData.customerId && invoices.length > 0) {
      const filteredInvoices = invoices.filter(
        invoice => getCustomerId(invoice.customer) === formData.customerId
      );
      setCustomerInvoices(filteredInvoices);
    } else {
      setCustomerInvoices([]);
    }
  }, [formData.customerId, invoices]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // If changing customer, reset invoice
    if (name === 'customerId' && value !== formData.customerId) {
      setFormData({
        ...formData,
        [name]: value,
        invoiceId: '' // Reset selected invoice when customer changes
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Format the data for submission
      const transactionData: Partial<{
        amount: number;
        type: string;
        method: string;
        date: string;
        reference: string; 
        notes: string;
        status: string;
        customer: string;
        invoice: string;
      }> = {
        amount: parseFloat(formData.amount), // Ensure amount is a number
        type: formData.type,
        method: formData.method,
        date: formData.date,
        reference: formData.reference,
        notes: formData.notes,
        status: formData.status
      };
      
      // Set customer ID correctly (MongoDB expects just the ID, not an object)
      if (formData.customerId) {
        transactionData.customer = formData.customerId;
      }
      
      // Set invoice ID if provided
      if (formData.invoiceId) {
        transactionData.invoice = formData.invoiceId;
      }
      
      console.log('Sending transaction data:', transactionData);
      await transactionService.create(transactionData);
      router.push('/transactions?refresh=true');
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError('Failed to create transaction. Please check your data and try again.');
      setSubmitting(false);
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

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Record New Transaction</h1>
          <p className="text-gray-600 dark:text-gray-300">Create a new payment or refund transaction</p>
        </div>
        <Link
          href="/transactions"
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white border-b pb-2">Transaction Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                  />
                </div>
                
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Transaction Type *
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Payment">Payment</option>
                    <option value="Refund">Refund</option>
                    <option value="Advance">Advance</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="method" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Method *
                  </label>
                  <select
                    id="method"
                    name="method"
                    value={formData.method}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Check">Check</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Transaction Date *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white border-b pb-2">Related Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Customer *
                  </label>
                  <select
                    id="customerId"
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a customer</option>
                    {customers.map(customer => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="invoiceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Link to Invoice
                  </label>
                  <select
                    id="invoiceId"
                    name="invoiceId"
                    value={formData.invoiceId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={!formData.customerId || customerInvoices.length === 0}
                  >
                    <option value="">Select an invoice (optional)</option>
                    {customerInvoices.map(invoice => (
                      <option key={invoice._id} value={invoice._id}>
                        Invoice #{invoice.invoiceNumber || invoice._id} - ₹{parseFloat(String(invoice.total || 0)).toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                  {formData.customerId && customerInvoices.length === 0 && (
                    <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                      No invoices found for this customer.
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="reference" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reference
                  </label>
                  <input
                    type="text"
                    id="reference"
                    name="reference"
                    value={formData.reference}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Transaction reference, check number, etc."
                  />
                </div>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Add any additional details about this transaction"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <Link
              href="/transactions"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 mr-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                'Save Transaction'
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}