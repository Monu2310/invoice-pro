'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { businessProfileService } from '@/lib/api';

export default function BusinessProfile() {
  // Initialize with empty states, will be populated from API
  const [businessProfile, setBusinessProfile] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    taxIdentification: {
      gstin: '',
      pan: ''
    },
    bankDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      branchName: ''
    },
    invoiceSettings: {
      prefix: '',
      nextNumber: 1001,
      termsAndConditions: ''
    },
    logo: null
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(businessProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch business profile from API
    async function fetchBusinessProfile() {
      try {
        setLoading(true);
        const data = await businessProfileService.get();
        setBusinessProfile(data);
        setFormData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching business profile:', err);
        // Create a default profile to avoid breaking the app
        const defaultProfile = {
          name: 'My Business',
          email: 'contact@mybusiness.com',
          phone: '',
          website: '',
          address: 'Default Address',
          taxIdentification: {
            gstin: '',
            pan: ''
          },
          bankDetails: {
            accountName: '',
            accountNumber: '',
            bankName: '',
            ifscCode: '',
            branchName: ''
          },
          invoiceSettings: {
            prefix: 'INV',
            nextNumber: 1001,
            termsAndConditions: 'Default terms and conditions'
          },
          logo: null
        };
        
        setBusinessProfile(defaultProfile);
        setFormData(defaultProfile);
        setError('Failed to load business profile. Using default values.');
        setLoading(false);
      }
    }
    
    fetchBusinessProfile();
  }, []);

  const handleInputChange = (section: string | null, field: string, value: string | number) => {
    if (section) {
      // Create a type-safe way to access the nested object
      const sectionKey = section as keyof typeof formData;
      const sectionData = formData[sectionKey];
      
      // Make sure we're dealing with an object before spreading
      if (sectionData && typeof sectionData === 'object') {
        setFormData({
          ...formData,
          [section]: {
            ...sectionData,
            [field]: value
          }
        });
      }
    } else {
      setFormData({
        ...formData,
        [field]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const updatedProfile = await businessProfileService.update(formData);
      setBusinessProfile(updatedProfile);
      setIsEditing(false);
      setLoading(false);
      alert('Business profile updated successfully!');
    } catch (err) {
      setError('Failed to update business profile. Please try again.');
      setLoading(false);
      console.error('Error updating business profile:', err);
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

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Business Profile</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your business information that appears on invoices</p>
        </div>
        {!isEditing && (
          <button 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>
        )}
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="p-6">
            {/* Business Information */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Business Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Name</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.name}
                    onChange={(e) => handleInputChange(null, 'name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input 
                    type="email"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.email}
                    onChange={(e) => handleInputChange(null, 'email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input 
                    type="tel"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.phone}
                    onChange={(e) => handleInputChange(null, 'phone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                  <input 
                    type="url"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.website}
                    onChange={(e) => handleInputChange(null, 'website', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                  <textarea 
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    value={formData.address}
                    onChange={(e) => handleInputChange(null, 'address', e.target.value)}
                    required
                  ></textarea>
                </div>
              </div>
            </div>
            
            {/* Tax Information */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Tax Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GSTIN</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.taxIdentification.gstin}
                    onChange={(e) => handleInputChange('taxIdentification', 'gstin', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PAN</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.taxIdentification.pan}
                    onChange={(e) => handleInputChange('taxIdentification', 'pan', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Bank Details */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Bank Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.bankDetails.accountName}
                    onChange={(e) => handleInputChange('bankDetails', 'accountName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.bankDetails.accountNumber}
                    onChange={(e) => handleInputChange('bankDetails', 'accountNumber', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Name</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.bankDetails.bankName}
                    onChange={(e) => handleInputChange('bankDetails', 'bankName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IFSC Code</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.bankDetails.ifscCode}
                    onChange={(e) => handleInputChange('bankDetails', 'ifscCode', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch Name</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.bankDetails.branchName}
                    onChange={(e) => handleInputChange('bankDetails', 'branchName', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Invoice Settings */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Invoice Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Number Prefix</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.invoiceSettings.prefix}
                    onChange={(e) => handleInputChange('invoiceSettings', 'prefix', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next Invoice Number</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.invoiceSettings.nextNumber}
                    onChange={(e) => handleInputChange('invoiceSettings', 'nextNumber', parseInt(e.target.value))}
                    min="1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Terms and Conditions</label>
                  <textarea 
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    value={formData.invoiceSettings.termsAndConditions}
                    onChange={(e) => handleInputChange('invoiceSettings', 'termsAndConditions', e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-4">
              <button 
                type="button"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => {
                  setFormData(businessProfile);
                  setIsEditing(false);
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6">
            {/* Business Information Display */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Business Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Business Name</p>
                  <p className="text-gray-800 dark:text-white">{businessProfile.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</p>
                  <p className="text-gray-800 dark:text-white">{businessProfile.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</p>
                  <p className="text-gray-800 dark:text-white">{businessProfile.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Website</p>
                  <p className="text-gray-800 dark:text-white">{businessProfile.website}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</p>
                  <p className="text-gray-800 dark:text-white whitespace-pre-line">{businessProfile.address}</p>
                </div>
              </div>
            </div>
            
            {/* Tax Information */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Tax Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">GSTIN</p>
                  <p className="text-gray-800 dark:text-white">{businessProfile.taxIdentification.gstin}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">PAN</p>
                  <p className="text-gray-800 dark:text-white">{businessProfile.taxIdentification.pan}</p>
                </div>
              </div>
            </div>
            
            {/* Bank Details */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Bank Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Name</p>
                  <p className="text-gray-800 dark:text-white">{businessProfile.bankDetails.accountName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Number</p>
                  <p className="text-gray-800 dark:text-white">{businessProfile.bankDetails.accountNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bank Name</p>
                  <p className="text-gray-800 dark:text-white">{businessProfile.bankDetails.bankName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">IFSC Code</p>
                  <p className="text-gray-800 dark:text-white">{businessProfile.bankDetails.ifscCode}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Branch Name</p>
                  <p className="text-gray-800 dark:text-white">{businessProfile.bankDetails.branchName}</p>
                </div>
              </div>
            </div>
            
            {/* Invoice Settings */}
            <div>
              <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Invoice Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Invoice Number Prefix</p>
                  <p className="text-gray-800 dark:text-white">{businessProfile.invoiceSettings.prefix}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Invoice Number</p>
                  <p className="text-gray-800 dark:text-white">{businessProfile.invoiceSettings.nextNumber}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Terms and Conditions</p>
                  <p className="text-gray-800 dark:text-white">{businessProfile.invoiceSettings.termsAndConditions}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}