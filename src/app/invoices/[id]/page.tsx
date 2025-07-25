'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { invoiceService, Invoice, Customer, InvoiceItem } from '@/lib/api';
import PDFDownloadButton from '@/components/ui/PDFDownloadButton';

interface Params {
  id: string;
}

export default function ViewInvoice({ params }: { params: Promise<Params> }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendMethod, setSendMethod] = useState<'email' | 'whatsapp'>('email');
  
  // Reference to the invoice content for PDF generation
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  // Email state
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  
  // WhatsApp state
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  
  // Status messages
  const [sendingStatus, setSendingStatus] = useState('');
  const [statusType, setStatusType] = useState(''); // 'success' or 'error'

  // Unwrap the params object with React.use()
  const unwrappedParams = React.use(params) as Params;
  const invoiceId = unwrappedParams.id;

  useEffect(() => {
    async function fetchInvoice() {
      try {
        setLoading(true);
        const data = await invoiceService.getById(invoiceId);
        setInvoice(data);
        
        // Set email defaults after we have the invoice data
        const customerEmail = typeof data.customer === 'object' ? data.customer?.email : '';
        const customerName = typeof data.customer === 'object' ? data.customer?.name : 'Customer';
        const customerPhone = typeof data.customer === 'object' ? data.customer?.phone : '';
        
        setEmailTo(customerEmail || '');
        setEmailSubject(`Invoice ${data.invoiceNumber || data._id} from Your Company`);
        setEmailBody(`Dear ${customerName},\n\nPlease find attached the invoice ${data.invoiceNumber || data._id} for your recent purchase.\n\nTotal Amount: ₹${parseFloat(String(data.total || 0)).toFixed(2)}\nDue Date: ${new Date(data.dueDate || new Date()).toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        })}\n\nPlease let us know if you have any questions.\n\nThank you for your business!\n\nBest regards,\nYour Company`);
        
        // Set WhatsApp defaults
        setWhatsappNumber(customerPhone || '');
        setWhatsappMessage(`Dear ${customerName},\n\nYour invoice ${data.invoiceNumber || data._id} has been prepared.\n\nTotal Amount: ₹${parseFloat(String(data.total || 0)).toFixed(2)}\nDue Date: ${new Date(data.dueDate || new Date()).toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        })}\n\nThank you for your business!\nYour Company`);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice. Please try again later.');
        setLoading(false);
      }
    }
    
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingStatus('Sending email...');
    setStatusType('');
    
    try {
      const response = await invoiceService.sendEmail(invoiceId, {
        to: emailTo,
        subject: emailSubject,
        body: emailBody
      });
      
      // Check if there was an HTML or parse error
      if (response && typeof response === 'object' && 'error' in response) {
        console.error('Error response:', response);
        const errorResponse = response as { error: string };
        setSendingStatus(`Failed to send email: ${errorResponse.error}`);
        setStatusType('error');
        return;
      }
      
      setSendingStatus('Email sent successfully!');
      setStatusType('success');
      
      // Close the dialog after 2 seconds
      setTimeout(() => {
        setShowSendDialog(false);
        setSendingStatus('');
      }, 2000);
    } catch (error) {
      console.error('Error sending email:', error);
      setSendingStatus('Failed to send email. Please try again.');
      setStatusType('error');
    }
  };
  
  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingStatus('Sending WhatsApp message...');
    setStatusType('');
    
    try {
      const response = await invoiceService.sendWhatsApp(invoiceId, {
        phoneNumber: whatsappNumber,
        message: whatsappMessage
      });
      
      // Check if there was an HTML or parse error
      if (response && typeof response === 'object' && 'error' in response) {
        console.error('Error response:', response);
        const errorResponse = response as { error: string };
        setSendingStatus(`Failed to send WhatsApp message: ${errorResponse.error}`);
        setStatusType('error');
        return;
      }
      
      // Check if this is a development mode response (simulated success)
      if (response && typeof response === 'object' && 'note' in response && 'message' in response) {
        const devResponse = response as { note: string; message: string };
        if (devResponse.note.includes('simulated')) {
          setSendingStatus(`${devResponse.message} (Development mode)`);
          setStatusType('success');
          
          // Show additional info about development mode
          console.info('Development mode WhatsApp message:', devResponse.note);
        } else {
          setSendingStatus('WhatsApp message sent successfully!');
          setStatusType('success');
        }
      } else {
        setSendingStatus('WhatsApp message sent successfully!');
        setStatusType('success');
      }
      
      // Close the dialog after 2 seconds
      setTimeout(() => {
        setShowSendDialog(false);
        setSendingStatus('');
      }, 2000);
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      setSendingStatus('Failed to send WhatsApp message. Please try again.');
      setStatusType('error');
    }
  };

  // Type guard to check if customer is a Customer object
  const getCustomerDisplay = (customer: string | Customer | undefined): {
    name: string;
    email: string;
    phone: string;
    address: string | Record<string, unknown> | undefined;
  } => {
    if (!customer) return { name: 'Unknown Customer', email: 'No email provided', phone: 'No phone provided', address: undefined };
    if (typeof customer === 'string') return { name: customer, email: 'No email provided', phone: 'No phone provided', address: undefined };
    return {
      name: customer.name || 'Unknown Customer',
      email: customer.email || 'No email provided',
      phone: customer.phone || 'No phone provided',
      address: customer.address
    };
  };

  // Format customer address
  const formatAddress = (address: Customer['address']) => {
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
          <p className="text-gray-600 dark:text-gray-300">Loading invoice...</p>
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
            onClick={() => router.push('/invoices')}
          >
            Back to Invoices
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">Invoice not found</p>
          <button 
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            onClick={() => router.push('/invoices')}
          >
            Back to Invoices
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Format dates with error handling
  const issueDate = invoice?.issueDate || invoice?.createdAt 
    ? new Date(invoice.issueDate || invoice.createdAt!).toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })
    : 'N/A';
  
  const dueDate = invoice?.dueDate 
    ? new Date(invoice.dueDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) 
    : 'N/A';

  const paymentDate = invoice?.lastPaymentDate 
    ? new Date(invoice.lastPaymentDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) 
    : 'N/A';

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Invoice #{invoice.invoiceNumber || invoice._id}</h1>
          <p className="text-gray-600 dark:text-gray-300">
            <span className={`inline-flex text-xs leading-5 font-semibold rounded-full px-2 ${
              invoice.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              invoice.paymentStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              invoice.paymentStatus === 'Overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            }`}>
              {invoice.paymentStatus}
            </span>
            <span className="ml-2">Issued on {issueDate}</span>
          </p>
        </div>
        <div className="flex space-x-2">
          <PDFDownloadButton
            elementRef={invoiceRef}
            options={{
              filename: `invoice_${invoice.invoiceNumber || invoice._id}_${getCustomerDisplay(invoice.customer).name.replace(/\s+/g, '_')}.pdf`,
              title: `Invoice ${invoice.invoiceNumber || invoice._id}`,
              orientation: 'portrait',
              format: 'a4'
            }}
            onSuccess={(filename: string) => {
              console.log(`PDF generated successfully: ${filename}`);
            }}
            onError={(error: string) => {
              console.error('PDF generation failed:', error);
              alert(`Failed to generate PDF: ${error}`);
            }}
            variant="primary"
            size="md"
          />
          <button 
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => setShowSendDialog(true)}
          >
            Share Invoice
          </button>
          <button 
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => router.push('/invoices')}
          >
            Back to Invoices
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" ref={invoiceRef}>
        {/* Invoice Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {/* Use the helper function to safely get customer properties */}
              {(() => {
                const customer = getCustomerDisplay(invoice.customer);
                return (
                  <>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Invoice To:</h3>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">{customer.name}</p>
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{formatAddress(customer.address)}</p>
                    <p className="text-gray-600 dark:text-gray-400">{customer.email}</p>
                    <p className="text-gray-600 dark:text-gray-400">{customer.phone}</p>
                  </>
                );
              })()}
            </div>
            <div className="md:text-right">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Invoice Details:</h3>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-600 dark:text-gray-400">Invoice Number: </span>
                <span className="font-medium">{invoice.invoiceNumber || invoice._id}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-600 dark:text-gray-400">Issue Date: </span>
                <span className="font-medium">{issueDate}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-600 dark:text-gray-400">Due Date: </span>
                <span className="font-medium">{dueDate}</span>
              </p>
              {invoice.paymentStatus === 'Paid' && (
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="text-gray-600 dark:text-gray-400">Payment Date: </span>
                  <span className="font-medium">{paymentDate}</span>
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Invoice Items */}
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rate (₹)</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tax</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {invoice.items && invoice.items.map((item: InvoiceItem, index: number) => (
                <tr key={item._id || index}>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{item.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 text-right">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 text-right">{parseFloat(item.price.toString()).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 text-right">{item.tax || 0}%</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 text-right">{(item.quantity * item.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Invoice Summary */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end">
            <div className="w-full md:w-72">
              <div className="flex justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="font-medium text-gray-800 dark:text-white">₹{parseFloat((invoice.subtotal || 0).toString()).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                <span className="font-medium text-gray-800 dark:text-white">₹{parseFloat((invoice.tax || 0).toString()).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-lg font-medium text-gray-800 dark:text-white">Total:</span>
                <span className="text-lg font-bold text-gray-800 dark:text-white">₹{parseFloat((invoice.total || 0).toString()).toFixed(2)}</span>
              </div>
              
              {invoice.paymentStatus === 'Paid' && (
                <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700 text-green-600 dark:text-green-400">
                  <span className="font-medium">Paid:</span>
                  <span className="font-bold">₹{parseFloat((invoice.total || 0).toString()).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Notes Section */}
        {invoice.notes && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Notes:</h3>
            <p className="text-gray-700 dark:text-gray-300">{invoice.notes}</p>
          </div>
        )}
      </div>
      
      {/* Send Invoice Dialog */}
      {showSendDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Share Invoice</h2>
            
            {/* Send Method Tabs */}
            <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
              <button
                className={`py-2 px-4 font-medium ${
                  sendMethod === 'email' 
                    ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
                onClick={() => setSendMethod('email')}
              >
                Email
              </button>
              <button
                className={`py-2 px-4 font-medium ${
                  sendMethod === 'whatsapp' 
                    ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
                onClick={() => setSendMethod('whatsapp')}
              >
                WhatsApp
              </button>
            </div>
            
            {/* Status Message */}
            {sendingStatus && (
              <div className={`mb-4 p-3 rounded-md ${
                statusType === 'success' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : statusType === 'error'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}>
                {sendingStatus}
              </div>
            )}
            
            {/* Email Form */}
            {sendMethod === 'email' && (
              <form onSubmit={handleSendEmail}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To:</label>
                  <input 
                    type="email"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject:</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message:</label>
                  <textarea 
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={6}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    required
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <button 
                    type="button"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => setShowSendDialog(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                    disabled={sendingStatus === 'Sending email...'}
                  >
                    Send Email
                  </button>
                </div>
              </form>
            )}
            
            {/* WhatsApp Form */}
            {sendMethod === 'whatsapp' && (
              <form onSubmit={handleSendWhatsApp}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number:</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+91XXXXXXXXXX"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Include country code (e.g., +91 for India)</p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message:</label>
                  <textarea 
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={6}
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    required
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <button 
                    type="button"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => setShowSendDialog(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                    disabled={sendingStatus === 'Sending WhatsApp message...'}
                  >
                    Send WhatsApp
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}