import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Settings, Bell, Lock, Globe, Palette, Database, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // General Settings
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    
    // Notification Settings
    emailNotifications: true,
    lowStockAlerts: true,
    expirationAlerts: true,
    approvalNotifications: true,
    
    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: '30',
    
    // System Settings
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: '90',
  });

  const handleSave = () => {
    toast.success('Settings saved successfully');
    onClose();
  };

  const handleExportData = () => {
    toast.success('Data export started. You will receive an email when complete.');
  };

  const handleImportData = () => {
    toast.info('Please select a file to import');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'system', label: 'System', icon: Database },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 flex-shrink-0 border-r pr-4 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 150px)' }}>
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <select
                        id="language"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={settings.language}
                        onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="zh">Chinese</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <select
                        id="timezone"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={settings.timezone}
                        onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      >
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateFormat">Date Format</Label>
                        <select
                          id="dateFormat"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={settings.dateFormat}
                          onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <select
                          id="currency"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={settings.currency}
                          onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="JPY">JPY (¥)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Appearance
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        defaultChecked
                      />
                      <span className="text-sm text-gray-700">Use compact mode</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Show product images in tables</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive email updates for important events</p>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={settings.emailNotifications}
                        onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">Low Stock Alerts</p>
                        <p className="text-sm text-gray-500">Get notified when products fall below minimum stock</p>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={settings.lowStockAlerts}
                        onChange={(e) => setSettings({ ...settings, lowStockAlerts: e.target.checked })}
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">Expiration Alerts</p>
                        <p className="text-sm text-gray-500">Alerts for products nearing expiration</p>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={settings.expirationAlerts}
                        onChange={(e) => setSettings({ ...settings, expirationAlerts: e.target.checked })}
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">Approval Notifications</p>
                        <p className="text-sm text-gray-500">Notifications for transactions requiring approval</p>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={settings.approvalNotifications}
                        onChange={(e) => setSettings({ ...settings, approvalNotifications: e.target.checked })}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={settings.twoFactorAuth}
                        onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                      />
                    </label>

                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min="5"
                        max="120"
                        value={settings.sessionTimeout}
                        onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                      />
                      <p className="text-xs text-gray-500">Auto logout after period of inactivity</p>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Change Password</h4>
                      <p className="text-sm text-blue-700 mb-3">It's a good practice to change your password regularly</p>
                      <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                        Change Password
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Settings */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">Automatic Backup</p>
                        <p className="text-sm text-gray-500">Automatically backup data at scheduled intervals</p>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={settings.autoBackup}
                        onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                      />
                    </label>

                    <div className="space-y-2">
                      <Label htmlFor="backupFrequency">Backup Frequency</Label>
                      <select
                        id="backupFrequency"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={settings.backupFrequency}
                        onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                        disabled={!settings.autoBackup}
                      >
                        <option value="hourly">Every Hour</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dataRetention">Data Retention Period (days)</Label>
                      <Input
                        id="dataRetention"
                        type="number"
                        min="30"
                        max="365"
                        value={settings.dataRetention}
                        onChange={(e) => setSettings({ ...settings, dataRetention: e.target.value })}
                      />
                      <p className="text-xs text-gray-500">How long to keep historical data</p>
                    </div>

                    <div className="pt-4 border-t space-y-3">
                      <h4 className="font-medium text-gray-900">Data Management</h4>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={handleExportData}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export Data
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={handleImportData}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Import Data
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
