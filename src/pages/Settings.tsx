import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Bell, 
  Key,
  Database,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    dhanClientId: user?.dhanClientId || '',
    dhanAccessToken: '',
    notifications: {
      signals: true,
      trades: true,
      risks: true,
      email: false
    }
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'trading', label: 'Trading API', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  const handleSave = async () => {
    const success = await updateProfile({
      dhanClientId: formData.dhanClientId
    });
    
    if (success) {
      // Show success message
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and trading preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Created
                      </label>
                      <p className="text-sm text-gray-600">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'trading' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Trading API Configuration</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dhan Client ID
                      </label>
                      <input
                        type="text"
                        value={formData.dhanClientId}
                        onChange={(e) => setFormData({...formData, dhanClientId: e.target.value})}
                        placeholder="Enter your Dhan Client ID"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dhan Access Token
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={formData.dhanAccessToken}
                          onChange={(e) => setFormData({...formData, dhanAccessToken: e.target.value})}
                          placeholder="Enter your Dhan Access Token"
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showApiKey ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Your API keys are encrypted and stored securely
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <Database className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-medium text-blue-800">How to get Dhan API credentials</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            1. Login to your Dhan account<br/>
                            2. Go to API section in settings<br/>
                            3. Generate API credentials<br/>
                            4. Copy Client ID and Access Token here
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Preferences</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Trading Signals</h3>
                        <p className="text-sm text-gray-600">Get notified when new trading signals are generated</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.notifications.signals}
                          onChange={(e) => setFormData({
                            ...formData,
                            notifications: {...formData.notifications, signals: e.target.checked}
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Trade Executions</h3>
                        <p className="text-sm text-gray-600">Get notified when trades are executed</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.notifications.trades}
                          onChange={(e) => setFormData({
                            ...formData,
                            notifications: {...formData.notifications, trades: e.target.checked}
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Risk Alerts</h3>
                        <p className="text-sm text-gray-600">Get notified about risk management alerts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.notifications.risks}
                          onChange={(e) => setFormData({
                            ...formData,
                            notifications: {...formData.notifications, risks: e.target.checked}
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 text-green-600 mr-3" />
                        <div>
                          <h3 className="text-sm font-medium text-green-800">Account Security</h3>
                          <p className="text-sm text-green-700 mt-1">
                            Your account is secured with JWT authentication and encrypted API storage.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Security Features</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Encrypted API key storage</li>
                        <li>• Secure JWT token authentication</li>
                        <li>• Rate limiting protection</li>
                        <li>• Real-time risk monitoring</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;