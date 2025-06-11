'use client';

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { invoiceService, customerService, orderService, transactionService, Invoice, Customer, Transaction } from "@/lib/api";
import Link from "next/link";

interface DashboardTransaction {
  id: string;
  uniqueKey: string;
  customer: string;
  amount: string;
  status: string;
  date: string;
}

interface UpcomingPayment {
  customer: string;
  amount: string;
  dueDate: Date;
  daysLeft: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState([
    { title: 'Total Revenue', value: '₹0', change: '0%', positive: true },
    { title: 'Pending Invoices', value: '0', change: '0', positive: true },
    { title: 'New Customers', value: '0', change: '0', positive: true },
    { title: 'Active Orders', value: '0', change: '0', positive: true },
  ]);
  
  const [recentTransactions, setRecentTransactions] = useState<DashboardTransaction[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
  const [customerActivity, setCustomerActivity] = useState({
    newCustomers: 0,
    returningCustomers: 0,
    referrals: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // Fetch all required data in parallel
        const [invoices, customers, orders, transactions] = await Promise.all([
          invoiceService.getAll(),
          customerService.getAll(),
          orderService.getAll(),
          transactionService.getAll()
        ]);
        
        // Calculate total revenue from paid invoices
        const totalRevenue = invoices
          .filter((invoice: Invoice) => invoice.paymentStatus === 'Paid')
          .reduce((sum, invoice) => sum + (parseFloat(String(invoice.total || 0)) || 0), 0);
        
        // Count pending invoices
        const pendingInvoices = invoices.filter(invoice => invoice.paymentStatus === 'Pending').length;
        
        // Get new customers (added in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newCustomersCount = customers.filter((customer: Customer) => {
          return customer.createdAt && new Date(customer.createdAt) > thirtyDaysAgo;
        }).length;
        
        // Count active orders
        const activeOrders = orders.filter(order => order.status !== 'Completed' && order.status !== 'Cancelled').length;
        
        // Update stats with real data
        setStats([
          { 
            title: 'Total Revenue', 
            value: `₹${totalRevenue.toLocaleString('en-IN')}`, 
            change: '+15%', // This would ideally be calculated from historical data
            positive: true 
          },
          { 
            title: 'Pending Invoices', 
            value: pendingInvoices.toString(), 
            change: '-3', // This would ideally be calculated from historical data
            positive: true 
          },
          { 
            title: 'New Customers', 
            value: newCustomersCount.toString(), 
            change: '+2', // This would ideally be calculated from historical data
            positive: true 
          },
          { 
            title: 'Active Orders', 
            value: activeOrders.toString(), 
            change: '+4', // This would ideally be calculated from historical data
            positive: true 
          },
        ]);
        
        // Set recent transactions (latest 5)
        const sortedTransactions = [...transactions]
          .sort((a, b) => {
            const dateA = new Date(a.date || a.createdAt || 0).getTime();
            const dateB = new Date(b.date || b.createdAt || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 5)
          .map((transaction: Transaction, index: number): DashboardTransaction => ({
            id: transaction.invoiceId || transaction._id || `unknown-${index}`,
            uniqueKey: `tx-${transaction._id || index}`, // Guaranteed unique key for React
            customer: typeof transaction.customer === 'string' ? transaction.customer : transaction.customer?.name || 'Unknown Customer',
            amount: `₹${parseFloat(String(transaction.amount || 0)).toLocaleString('en-IN')}`,
            status: transaction.status || 'Pending',
            date: new Date(transaction.date || transaction.createdAt || new Date()).toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            })
          }));
        setRecentTransactions(sortedTransactions);
        
        // Set upcoming payments (pending invoices with nearest due dates)
        const upcomingPaymentsList = invoices
          .filter((invoice: Invoice) => invoice.paymentStatus === 'Pending')
          .sort((a, b) => {
            const dateA = new Date(a.dueDate || 0).getTime();
            const dateB = new Date(b.dueDate || 0).getTime();
            return dateA - dateB;
          })
          .slice(0, 3)
          .map((invoice: Invoice): UpcomingPayment => ({
            customer: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.name || 'Unknown Customer',
            amount: `₹${parseFloat(String(invoice.total || 0)).toLocaleString('en-IN')}`,
            dueDate: new Date(invoice.dueDate || new Date()),
            daysLeft: Math.ceil((new Date(invoice.dueDate || new Date()).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          }));
        setUpcomingPayments(upcomingPaymentsList);
        
        // Calculate customer activity percentages
        const totalCustomers = customers.length;
        if (totalCustomers > 0) {
          const newCustomersPercentage = Math.round((newCustomersCount / totalCustomers) * 100);
          
          // For returning customers and referrals, we'd ideally have this data in the database
          // For now we'll use placeholder calculations based on available data
          const returningCustomersPercentage = 85; // Placeholder - would be calculated from real data
          const referralsPercentage = 45; // Placeholder - would be calculated from real data
          
          setCustomerActivity({
            newCustomers: newCustomersPercentage,
            returningCustomers: returningCustomersPercentage,
            referrals: referralsPercentage
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);

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

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard Overview</h1>
        <p className="text-gray-600 dark:text-gray-300">Welcome back! Here&apos;s what&apos;s happening with your business today.</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</h3>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
              <p className={`ml-2 text-sm font-medium ${
                stat.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {stat.change}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-8 border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Invoice ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <tr key={transaction.uniqueKey} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400">{transaction.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{transaction.customer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{transaction.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        transaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        transaction.status === 'Overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{transaction.date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4">
          <Link href="/transactions" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
            View all transactions →
          </Link>
        </div>
      </div>
      
      {/* Business Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Upcoming Payments</h2>
          <div className="space-y-4">
            {upcomingPayments.length > 0 ? (
              upcomingPayments.map((payment, index) => (
                <div key={index} className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{payment.customer}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {payment.daysLeft > 0 ? `Due in ${payment.daysLeft} days` : 'Overdue'}
                    </p>
                  </div>
                  <p className="font-medium text-gray-800 dark:text-white">{payment.amount}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">No upcoming payments</p>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Customer Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full" style={{ width: `${customerActivity.newCustomers}%` }}></div>
              </div>
              <span className="min-w-[4rem] text-right text-sm font-medium text-gray-700 dark:text-gray-300 ml-2">{customerActivity.newCustomers}%</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">New customers this month</p>
            
            <div className="flex items-center mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-green-600 dark:bg-green-500 h-2.5 rounded-full" style={{ width: `${customerActivity.returningCustomers}%` }}></div>
              </div>
              <span className="min-w-[4rem] text-right text-sm font-medium text-gray-700 dark:text-gray-300 ml-2">{customerActivity.returningCustomers}%</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Returning customers</p>
            
            <div className="flex items-center mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-yellow-600 dark:bg-yellow-500 h-2.5 rounded-full" style={{ width: `${customerActivity.referrals}%` }}></div>
              </div>
              <span className="min-w-[4rem] text-right text-sm font-medium text-gray-700 dark:text-gray-300 ml-2">{customerActivity.referrals}%</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Customer referrals</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}