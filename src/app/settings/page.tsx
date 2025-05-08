'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function Settings() {
  const [settings, setSettings] = useState({
    appearance: {
      theme: 'light',
      fontSize: 'medium',
      compactView: false
    },
    notifications: {
      email: true,
      browser: true,
      paymentReminders: true,
      invoiceDueReminders: true
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30
    },
    exportOptions: {
      defaultFormat: 'pdf',
      includeLogo: true,
      includeSignature: false
    }
  });

  const handleToggle = (section, setting) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [setting]: !settings[section][setting]
      }
    });
  };

  const handleChange = (section, setting, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [setting]: value
      }
    });
  };

  const handleSave = () => {
    // In a real app, this would save to backend
    alert('Settings saved successfully!');
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-300">Customize your dashboard experience</p>
        </div>
        <button 
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          onClick={handleSave}
        >
          Save Changes
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Appearance Settings */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Appearance</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    name="theme"
                    value="light"
                    checked={settings.appearance.theme === 'light'}
                    onChange={() => handleChange('appearance', 'theme', 'light')}
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Light</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    name="theme"
                    value="dark"
                    checked={settings.appearance.theme === 'dark'}
                    onChange={() => handleChange('appearance', 'theme', 'dark')}
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Dark</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    name="theme"
                    value="system"
                    checked={settings.appearance.theme === 'system'}
                    onChange={() => handleChange('appearance', 'theme', 'system')}
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">System</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Font Size</label>
              <select
                className="w-full sm:w-64 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={settings.appearance.fontSize}
                onChange={(e) => handleChange('appearance', 'fontSize', e.target.value)}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                id="compact-view"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={settings.appearance.compactView}
                onChange={() => handleToggle('appearance', 'compactView')}
              />
              <label htmlFor="compact-view" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Use compact view (reduces spacing between elements)
              </label>
            </div>
          </div>
        </div>
        
        {/* Notification Settings */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Notifications</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="email-notifications" className="text-sm text-gray-700 dark:text-gray-300">
                Email Notifications
              </label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  id="email-notifications"
                  type="checkbox"
                  className="sr-only"
                  checked={settings.notifications.email}
                  onChange={() => handleToggle('notifications', 'email')}
                />
                <div className={`block w-14 h-8 rounded-full ${settings.notifications.email ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <div className={`absolute left-1 top-1 bg-white dark:bg-gray-200 w-6 h-6 rounded-full transition-transform ${settings.notifications.email ? 'transform translate-x-6' : ''}`}></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label htmlFor="browser-notifications" className="text-sm text-gray-700 dark:text-gray-300">
                Browser Notifications
              </label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  id="browser-notifications"
                  type="checkbox"
                  className="sr-only"
                  checked={settings.notifications.browser}
                  onChange={() => handleToggle('notifications', 'browser')}
                />
                <div className={`block w-14 h-8 rounded-full ${settings.notifications.browser ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <div className={`absolute left-1 top-1 bg-white dark:bg-gray-200 w-6 h-6 rounded-full transition-transform ${settings.notifications.browser ? 'transform translate-x-6' : ''}`}></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label htmlFor="payment-reminders" className="text-sm text-gray-700 dark:text-gray-300">
                Payment Reminders
              </label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  id="payment-reminders"
                  type="checkbox"
                  className="sr-only"
                  checked={settings.notifications.paymentReminders}
                  onChange={() => handleToggle('notifications', 'paymentReminders')}
                />
                <div className={`block w-14 h-8 rounded-full ${settings.notifications.paymentReminders ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <div className={`absolute left-1 top-1 bg-white dark:bg-gray-200 w-6 h-6 rounded-full transition-transform ${settings.notifications.paymentReminders ? 'transform translate-x-6' : ''}`}></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label htmlFor="invoice-due-reminders" className="text-sm text-gray-700 dark:text-gray-300">
                Invoice Due Reminders
              </label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  id="invoice-due-reminders"
                  type="checkbox"
                  className="sr-only"
                  checked={settings.notifications.invoiceDueReminders}
                  onChange={() => handleToggle('notifications', 'invoiceDueReminders')}
                />
                <div className={`block w-14 h-8 rounded-full ${settings.notifications.invoiceDueReminders ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <div className={`absolute left-1 top-1 bg-white dark:bg-gray-200 w-6 h-6 rounded-full transition-transform ${settings.notifications.invoiceDueReminders ? 'transform translate-x-6' : ''}`}></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Security Settings */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Security</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label htmlFor="two-factor-auth" className="text-sm text-gray-700 dark:text-gray-300">
                Two-Factor Authentication
              </label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  id="two-factor-auth"
                  type="checkbox"
                  className="sr-only"
                  checked={settings.security.twoFactorAuth}
                  onChange={() => handleToggle('security', 'twoFactorAuth')}
                />
                <div className={`block w-14 h-8 rounded-full ${settings.security.twoFactorAuth ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <div className={`absolute left-1 top-1 bg-white dark:bg-gray-200 w-6 h-6 rounded-full transition-transform ${settings.security.twoFactorAuth ? 'transform translate-x-6' : ''}`}></div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Session Timeout (minutes)</label>
              <select
                className="w-full sm:w-64 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={settings.security.sessionTimeout}
                onChange={(e) => handleChange('security', 'sessionTimeout', parseInt(e.target.value))}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Export Options */}
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Export Options</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Export Format</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    name="exportFormat"
                    value="pdf"
                    checked={settings.exportOptions.defaultFormat === 'pdf'}
                    onChange={() => handleChange('exportOptions', 'defaultFormat', 'pdf')}
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">PDF</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    name="exportFormat"
                    value="excel"
                    checked={settings.exportOptions.defaultFormat === 'excel'}
                    onChange={() => handleChange('exportOptions', 'defaultFormat', 'excel')}
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Excel</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    name="exportFormat"
                    value="csv"
                    checked={settings.exportOptions.defaultFormat === 'csv'}
                    onChange={() => handleChange('exportOptions', 'defaultFormat', 'csv')}
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">CSV</span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                id="include-logo"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={settings.exportOptions.includeLogo}
                onChange={() => handleToggle('exportOptions', 'includeLogo')}
              />
              <label htmlFor="include-logo" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Include company logo in exported documents
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="include-signature"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={settings.exportOptions.includeSignature}
                onChange={() => handleToggle('exportOptions', 'includeSignature')}
              />
              <label htmlFor="include-signature" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Include digital signature in exported documents
              </label>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}