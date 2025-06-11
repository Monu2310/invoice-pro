'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';

interface SettingsState {
  appearance: {
    theme: string;
    fontSize: string;
    compactView: boolean;
  };
  notifications: {
    email: boolean;
    paymentReminders: boolean;
    invoiceDueReminders: boolean;
  };
  preferences: {
    defaultCurrency: string;
    dateFormat: string;
    timeZone: string;
  };
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>({
    appearance: {
      theme: 'light',
      fontSize: 'medium',
      compactView: false
    },
    notifications: {
      email: true,
      paymentReminders: true,
      invoiceDueReminders: true
    },
    preferences: {
      defaultCurrency: 'INR',
      dateFormat: 'DD/MM/YYYY',
      timeZone: 'Asia/Kolkata'
    }
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('invoiceSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }

    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setSettings(prev => ({
        ...prev,
        appearance: {
          ...prev.appearance,
          theme: savedTheme
        }
      }));
    }
  }, []);

  const handleToggle = (section: keyof SettingsState, setting: string) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [setting]: !((prev[section] as Record<string, unknown>)[setting] as boolean)
      }
    }));
  };

  const handleChange = (section: keyof SettingsState, setting: string, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [setting]: value
      }
    }));
  };

  const handleSave = () => {
    // Save theme preference to localStorage
    if (settings.appearance.theme !== 'system') {
      localStorage.setItem('theme', settings.appearance.theme);
      document.documentElement.classList.toggle('dark', settings.appearance.theme === 'dark');
    } else {
      // Handle system theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }
    
    // Save other preferences to localStorage
    localStorage.setItem('invoiceSettings', JSON.stringify(settings));
    
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
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Note: Font size changes require a page refresh to take effect.</p>
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
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Configure which notifications you want to receive (preferences only)</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="email-notifications" className="text-sm text-gray-700 dark:text-gray-300">
                Email Notifications (Preference)
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
              <label htmlFor="payment-reminders" className="text-sm text-gray-700 dark:text-gray-300">
                Payment Reminders (Preference)
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
                Invoice Due Reminders (Preference)
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
        
        {/* Application Preferences */}
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Application Preferences</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Currency</label>
              <select
                className="w-full sm:w-64 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={settings.preferences.defaultCurrency}
                onChange={(e) => handleChange('preferences', 'defaultCurrency', e.target.value)}
              >
                <option value="INR">Indian Rupee (₹)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">British Pound (£)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Format</label>
              <select
                className="w-full sm:w-64 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={settings.preferences.dateFormat}
                onChange={(e) => handleChange('preferences', 'dateFormat', e.target.value)}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD-MMM-YYYY">DD-MMM-YYYY</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Zone</label>
              <select
                className="w-full sm:w-64 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={settings.preferences.timeZone}
                onChange={(e) => handleChange('preferences', 'timeZone', e.target.value)}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Information Section */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> These settings are saved locally in your browser. Currently functional: Theme switching, font size preferences, and currency/date format preferences. Advanced features like email notifications, two-factor authentication, and session management are not yet implemented.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}