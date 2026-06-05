import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Bell, Lock, Globe, Database, Mail,
  Shield, Smartphone, Download, Upload,
  Save, RefreshCw, AlertTriangle, Eye, EyeOff,
  CheckCircle, FileSpreadsheet, PackageOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { User } from '../types';
import { authApi, productsApi } from '../services/api';
import { useApp } from '../context/AppContext';
// @ts-ignore
import * as XLSX from 'xlsx';

interface SettingsPageProps {
  currentUser: User | null;
}

// ─── Defaults ─────────────────────────────────────────────────
const GENERAL_DEFAULTS = {
  companyName: 'Inventory Pro Co.,Ltd.',
  companyEmail: 'Inventorypro@gmail.com',
  phone: '+855 965313757',
  timezone: 'asia-phnom-penh',
  currency: 'usd',
  language: 'en',
  address: 'Royal University of Phnom Penh',
  city: 'Phnom Penh',
  stateProvince: 'Toul Kork',
  zip: '12151',
  lowStockThreshold: '20',
  reorderPoint: 'min',
  stockValuation: 'fifo',
  defaultCategory: 'general',
};

const NOTIF_DEFAULTS = {
  emailNotifications: true,
  lowStockAlerts: true,
  orderNotifications: true,
  pushNotifications: false,
  emailDigest: 'daily',
};

const SECURITY_DEFAULTS = {
  twoFactorAuth: false,
  sessionTimeout: '30',
  ipWhitelist: '',
  auditLogging: true,
};

const DATA_DEFAULTS = {
  autoBackup: true,
  backupFrequency: 'daily',
};

// ─── localStorage helpers ──────────────────────────────────────
const GENERAL_KEY = 'inv_settings_general';

function loadFromStorage<T>(key: string, defaults: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

function saveToStorage(key: string, value: object) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ─── Component ────────────────────────────────────────────────
export const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser }) => {
  const { products, suppliers, transactions, invoices, users, setProducts } = useApp();
  const isAdmin = currentUser?.role === 'Admin';
  const notifKey  = `inv_settings_notif_${currentUser?.id || 'default'}`;
  const securityKey = `inv_settings_security_${currentUser?.id || 'default'}`;
  const dataKey   = `inv_settings_data_${currentUser?.id || 'default'}`;

  // ── General ───────────────────────────────────────────────
  const [companyName,      setCompanyName]      = useState(GENERAL_DEFAULTS.companyName);
  const [companyEmail,     setCompanyEmail]     = useState(GENERAL_DEFAULTS.companyEmail);
  const [phone,            setPhone]            = useState(GENERAL_DEFAULTS.phone);
  const [timezone,         setTimezone]         = useState(GENERAL_DEFAULTS.timezone);
  const [currency,         setCurrency]         = useState(GENERAL_DEFAULTS.currency);
  const [language,         setLanguage]         = useState(GENERAL_DEFAULTS.language);
  const [address,          setAddress]          = useState(GENERAL_DEFAULTS.address);
  const [city,             setCity]             = useState(GENERAL_DEFAULTS.city);
  const [stateProvince,    setStateProvince]    = useState(GENERAL_DEFAULTS.stateProvince);
  const [zip,              setZip]              = useState(GENERAL_DEFAULTS.zip);
  const [lowStockThreshold,setLowStockThreshold]= useState(GENERAL_DEFAULTS.lowStockThreshold);
  const [reorderPoint,     setReorderPoint]     = useState(GENERAL_DEFAULTS.reorderPoint);
  const [stockValuation,   setStockValuation]   = useState(GENERAL_DEFAULTS.stockValuation);
  const [defaultCategory,  setDefaultCategory]  = useState(GENERAL_DEFAULTS.defaultCategory);

  // ── Notifications ─────────────────────────────────────────
  const [emailNotifications, setEmailNotifications] = useState(NOTIF_DEFAULTS.emailNotifications);
  const [lowStockAlerts,     setLowStockAlerts]     = useState(NOTIF_DEFAULTS.lowStockAlerts);
  const [orderNotifications, setOrderNotifications] = useState(NOTIF_DEFAULTS.orderNotifications);
  const [pushNotifications,  setPushNotifications]  = useState(NOTIF_DEFAULTS.pushNotifications);
  const [emailDigest,        setEmailDigest]        = useState(NOTIF_DEFAULTS.emailDigest);

  // ── Security ──────────────────────────────────────────────
  const [twoFactorAuth,   setTwoFactorAuth]   = useState(SECURITY_DEFAULTS.twoFactorAuth);
  const [sessionTimeout,  setSessionTimeout]  = useState(SECURITY_DEFAULTS.sessionTimeout);
  const [ipWhitelist,     setIpWhitelist]     = useState(SECURITY_DEFAULTS.ipWhitelist);
  const [auditLogging,    setAuditLogging]    = useState(SECURITY_DEFAULTS.auditLogging);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw,   setShowCurrentPw]   = useState(false);
  const [showNewPw,       setShowNewPw]       = useState(false);
  const [showConfirmPw,   setShowConfirmPw]   = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // ── Data & Backup ─────────────────────────────────────────
  const [autoBackup,       setAutoBackup]       = useState(DATA_DEFAULTS.autoBackup);
  const [backupFrequency,  setBackupFrequency]  = useState(DATA_DEFAULTS.backupFrequency);
  const [importLoading,    setImportLoading]    = useState(false);
  const [lastExport,       setLastExport]       = useState<string>('—');
  const [clearStep,        setClearStep]        = useState<0 | 1>(0);
  const [clearInput,       setClearInput]       = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  // ── Load from localStorage ────────────────────────────────
  const applyGeneral = useCallback((g: typeof GENERAL_DEFAULTS) => {
    setCompanyName(g.companyName); setCompanyEmail(g.companyEmail); setPhone(g.phone);
    setTimezone(g.timezone); setCurrency(g.currency); setLanguage(g.language);
    setAddress(g.address); setCity(g.city); setStateProvince(g.stateProvince); setZip(g.zip);
    setLowStockThreshold(g.lowStockThreshold); setReorderPoint(g.reorderPoint);
    setStockValuation(g.stockValuation); setDefaultCategory(g.defaultCategory);
  }, []);

  const applyNotif = useCallback((n: typeof NOTIF_DEFAULTS) => {
    setEmailNotifications(n.emailNotifications); setLowStockAlerts(n.lowStockAlerts);
    setOrderNotifications(n.orderNotifications); setPushNotifications(n.pushNotifications);
    setEmailDigest(n.emailDigest);
  }, []);

  const applySecurity = useCallback((s: typeof SECURITY_DEFAULTS) => {
    setTwoFactorAuth(s.twoFactorAuth); setSessionTimeout(s.sessionTimeout);
    setIpWhitelist(s.ipWhitelist); setAuditLogging(s.auditLogging);
  }, []);

  const applyData = useCallback((d: typeof DATA_DEFAULTS) => {
    setAutoBackup(d.autoBackup); setBackupFrequency(d.backupFrequency);
  }, []);

  useEffect(() => {
    applyGeneral(loadFromStorage(GENERAL_KEY, GENERAL_DEFAULTS));
    applyNotif(loadFromStorage(notifKey, NOTIF_DEFAULTS));
    applySecurity(loadFromStorage(securityKey, SECURITY_DEFAULTS));
    applyData(loadFromStorage(dataKey, DATA_DEFAULTS));
    const ts = localStorage.getItem('inv_last_export');
    if (ts) setLastExport(new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
  }, [applyGeneral, applyNotif, applySecurity, applyData, notifKey, securityKey, dataKey]);

  // ── Save / Cancel ─────────────────────────────────────────
  const handleSaveSettings = () => {
    if (isAdmin) saveToStorage(GENERAL_KEY, { companyName, companyEmail, phone, timezone, currency, language, address, city, stateProvince, zip, lowStockThreshold, reorderPoint, stockValuation, defaultCategory });
    saveToStorage(notifKey, { emailNotifications, lowStockAlerts, orderNotifications, pushNotifications, emailDigest });
    saveToStorage(securityKey, { twoFactorAuth, sessionTimeout, ipWhitelist, auditLogging });
    saveToStorage(dataKey, { autoBackup, backupFrequency });
    toast.success('Settings saved successfully');
  };

  const handleCancelSettings = () => {
    applyGeneral(loadFromStorage(GENERAL_KEY, GENERAL_DEFAULTS));
    applyNotif(loadFromStorage(notifKey, NOTIF_DEFAULTS));
    applySecurity(loadFromStorage(securityKey, SECURITY_DEFAULTS));
    applyData(loadFromStorage(dataKey, DATA_DEFAULTS));
    toast.info('Changes discarded');
  };

  // ── Password change ───────────────────────────────────────
  const handleUpdatePassword = async () => {
    if (!currentPassword) return toast.error('Enter your current password');
    if (newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    setPasswordLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      toast.success('Password updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Export All Data ───────────────────────────────────────
  const handleExportAllData = () => {
    try {
      const wb = XLSX.utils.book_new();
      const today = new Date().toISOString().split('T')[0];

      // Products
      const prodRows = products.map(p => ({
        'SKU': p.sku,
        'Name': p.name,
        'Category': p.category,
        'Unit': p.unit,
        'Cost Price': p.costPrice,
        'Stock Quantity': p.stockQuantity,
        'Min Stock': p.minStock,
        'Status': p.status,
        'Has Expiration': p.hasExpiration ? 'Yes' : 'No',
        'Expiration Date': p.expirationDate ? new Date(p.expirationDate).toLocaleDateString('en-GB') : '',
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prodRows), 'Products');

      // Suppliers
      const suppRows = suppliers.map(s => ({
        'Name': s.name,
        'Contact': s.contact,
        'Email': s.email,
        'Address': s.address,
        'Products Count': s.productsSupplied.length,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(suppRows), 'Suppliers');

      // Transactions
      const txnRows = transactions.map(t => ({
        'Date': new Date(t.date).toLocaleString('en-GB'),
        'Product': t.productName,
        'Type': t.type,
        'Quantity': t.quantity,
        'Warehouse': t.warehouse,
        'User': t.userName || t.user || '',
        'Note': t.note || '',
        'Status': t.status,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txnRows), 'Transactions');

      // Invoices
      const invRows = invoices.map(inv => ({
        'Invoice #': inv.invoiceNumber,
        'Supplier': inv.supplierName,
        'Invoice Date': inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-GB') : '',
        'Due Date': inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB') : '',
        'Subtotal': inv.subtotal,
        'Tax': inv.tax,
        'Total Amount': inv.totalAmount,
        'Status': inv.status,
        'Notes': inv.notes || '',
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invRows), 'Invoices');

      XLSX.writeFile(wb, `inventory_export_${today}.xlsx`);

      const now = new Date().toISOString();
      localStorage.setItem('inv_last_export', now);
      setLastExport(new Date(now).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }));

      toast.success(
        `Exported ${products.length} products · ${suppliers.length} suppliers · ${transactions.length} transactions · ${invoices.length} invoices`
      );
    } catch (err) {
      console.error('Export error', err);
      toast.error('Export failed. Please try again.');
    }
  };

  // ── Download Import Template ──────────────────────────────
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['SKU', 'Name', 'Category', 'Unit', 'Cost Price', 'Stock Quantity', 'Min Stock', 'Status', 'Has Expiration', 'Expiration Date'],
      ['PRD-001', 'Sample Product', 'General', 'pcs', 10.00, 100, 10, 'Active', 'No', ''],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'import_template_products.xlsx');
    toast.success('Template downloaded — fill in your products and use Import Data');
  };

  // ── Import Data ───────────────────────────────────────────
  const handleImportClick = () => importRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // allow re-selecting same file
    setImportLoading(true);

    try {
      const buf = await file.arrayBuffer();
      const wb  = XLSX.read(buf, { type: 'array' });

      // Find a "Products" sheet (case-insensitive)
      const sheetName = wb.SheetNames.find((n: string) => /product/i.test(n)) ?? wb.SheetNames[0];
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);

      if (!rows.length) {
        toast.error('No rows found in the file. Use Download Template to get the correct format.');
        return;
      }

      toast.info(`Importing ${rows.length} product${rows.length !== 1 ? 's' : ''}…`);

      let success = 0;
      let failed  = 0;
      const errors: string[] = [];

      for (const row of rows) {
        const sku  = String(row['SKU'] ?? row['sku'] ?? '').trim();
        const name = String(row['Name'] ?? row['name'] ?? '').trim();

        if (!sku || !name) { failed++; errors.push(`Row missing SKU or Name`); continue; }

        try {
          await productsApi.create({
            sku,
            name,
            category:      String(row['Category']       ?? row['category']      ?? 'General'),
            unit:          String(row['Unit']            ?? row['unit']          ?? 'pcs'),
            costPrice:     Number(row['Cost Price']      ?? row['costPrice']     ?? 0),
            stockQuantity: Number(row['Stock Quantity']  ?? row['stockQuantity'] ?? 0),
            minStock:      Number(row['Min Stock']       ?? row['minStock']      ?? 0),
            status:        String(row['Status']          ?? row['status']        ?? 'Active'),
            hasExpiration: String(row['Has Expiration']  ?? '').toLowerCase() === 'yes',
            expirationDate: row['Expiration Date'] ? String(row['Expiration Date']) : undefined,
          });
          success++;
        } catch (err: any) {
          failed++;
          errors.push(`${sku}: ${err.message}`);
        }
      }

      // Refresh products list in context
      if (success > 0) {
        const updated = await productsApi.getAll();
        setProducts(updated);
      }

      if (success > 0 && failed === 0) {
        toast.success(`Successfully imported ${success} product${success !== 1 ? 's' : ''}`);
      } else if (success > 0) {
        toast.success(`Imported ${success} · ${failed} failed (duplicate SKUs are skipped)`);
      } else {
        toast.error(`Import failed: ${errors[0] || 'check file format'}`);
      }
    } catch (err) {
      console.error('Import error', err);
      toast.error('Could not read file. Make sure it is a valid .xlsx file.');
    } finally {
      setImportLoading(false);
    }
  };

  // ── Clear All Data ────────────────────────────────────────
  const handleClearData = () => {
    if (clearStep === 0) {
      setClearStep(1);
      setClearInput('');
      return;
    }
    if (clearInput !== 'DELETE') {
      toast.error('Type DELETE exactly to confirm');
      return;
    }
    // Clear all inv_ localStorage keys (settings only — DB is server-side)
    Object.keys(localStorage)
      .filter(k => k.startsWith('inv_settings'))
      .forEach(k => localStorage.removeItem(k));

    setClearStep(0);
    setClearInput('');

    // Re-apply defaults so UI reflects cleared state
    applyGeneral(GENERAL_DEFAULTS);
    applyNotif(NOTIF_DEFAULTS);
    applySecurity(SECURITY_DEFAULTS);
    applyData(DATA_DEFAULTS);

    toast.success('All saved settings have been reset to defaults. Database records on the server are unchanged.');
  };

  // ── Live stats ────────────────────────────────────────────
  const totalStockValue = useMemo(
    () => products.reduce((s, p) => s + p.stockQuantity * p.costPrice, 0),
    [products]
  );

  // ── Animations ───────────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  // ── Password field helper ─────────────────────────────────
  const PwField = ({ id, label, value, onChange, show, onToggle }: {
    id: string; label: string; value: string;
    onChange: (v: string) => void; show: boolean; onToggle: () => void;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} type={show ? 'text' : 'password'} value={value}
          onChange={e => onChange(e.target.value)} className="focus:ring-[#1E90FF] pr-10" />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your application preferences and configuration</p>
      </motion.div>

      <Tabs defaultValue="general" className="space-y-6">
        <motion.div variants={itemVariants}>
          <TabsList className="bg-white border border-gray-200 p-1">
            <TabsTrigger value="general" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1E90FF] data-[state=active]:to-[#1565C0] data-[state=active]:text-white">
              <Globe className="w-4 h-4 mr-2" />General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1E90FF] data-[state=active]:to-[#1565C0] data-[state=active]:text-white">
              <Bell className="w-4 h-4 mr-2" />Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1E90FF] data-[state=active]:to-[#1565C0] data-[state=active]:text-white">
              <Lock className="w-4 h-4 mr-2" />Security
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="data" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1E90FF] data-[state=active]:to-[#1565C0] data-[state=active]:text-white">
                <Database className="w-4 h-4 mr-2" />Data & Backup
              </TabsTrigger>
            )}
          </TabsList>
        </motion.div>

        {/* ── General ── */}
        <TabsContent value="general" className="space-y-6">
          {!isAdmin && (
            <motion.div variants={itemVariants}>
              <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                <Shield className="w-4 h-4 shrink-0" />
                You are viewing company settings in read-only mode. Only Admin can make changes.
              </div>
            </motion.div>
          )}
          <motion.div variants={itemVariants}>
            <Card className="transition-all hover:shadow-md">
              <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-[#1E90FF]" />General Settings</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" value={companyName} onChange={e => setCompanyName(e.target.value)} disabled={!isAdmin} className="focus:ring-[#1E90FF] disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-default" /></div>
                  <div className="space-y-2"><Label htmlFor="company-email">Company Email</Label>
                    <Input id="company-email" type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} disabled={!isAdmin} className="focus:ring-[#1E90FF] disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-default" /></div>
                  <div className="space-y-2"><Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={!isAdmin} className="focus:ring-[#1E90FF] disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-default" /></div>
                  <div className="space-y-2"><Label htmlFor="timezone">Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone} disabled={!isAdmin}>
                      <SelectTrigger id="timezone" className="disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-default"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asia-phnom-penh">Cambodia — Phnom Penh (UTC+7)</SelectItem>
                        <SelectItem value="utc+7">Indochina Time (UTC+7)</SelectItem>
                        <SelectItem value="utc+8">China Standard Time (UTC+8)</SelectItem>
                        <SelectItem value="utc+9">Japan / Korea (UTC+9)</SelectItem>
                        <SelectItem value="utc+5-30">India (UTC+5:30)</SelectItem>
                        <SelectItem value="utc+0">UTC</SelectItem>
                        <SelectItem value="utc-5">Eastern Time (UTC-5)</SelectItem>
                        <SelectItem value="utc-8">Pacific Time (UTC-8)</SelectItem>
                      </SelectContent>
                    </Select></div>
                  <div className="space-y-2"><Label htmlFor="currency">Default Currency</Label>
                    <Select value={currency} onValueChange={setCurrency} disabled={!isAdmin}>
                      <SelectTrigger id="currency" className="disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-default"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="khr">KHR — Khmer Riel (៛)</SelectItem>
                        <SelectItem value="usd">USD — US Dollar ($)</SelectItem>
                        <SelectItem value="cny">CNY — Chinese Yuan (¥)</SelectItem>
                        <SelectItem value="eur">EUR — Euro (€)</SelectItem>
                        <SelectItem value="gbp">GBP — British Pound (£)</SelectItem>
                        <SelectItem value="jpy">JPY — Japanese Yen (¥)</SelectItem>
                      </SelectContent>
                    </Select></div>
                  <div className="space-y-2"><Label htmlFor="language">Language</Label>
                    <Select value={language} onValueChange={setLanguage} disabled={!isAdmin}>
                      <SelectTrigger id="language" className="disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-default"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="km">ខ្មែរ (Khmer)</SelectItem>
                        <SelectItem value="zh">中文 (Chinese)</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select></div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="address">Company Address</Label>
                    <Input id="address" value={address} onChange={e => setAddress(e.target.value)} disabled={!isAdmin} className="focus:ring-[#1E90FF] disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-default" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label htmlFor="city">City</Label>
                      <Input id="city" value={city} onChange={e => setCity(e.target.value)} disabled={!isAdmin} className="focus:ring-[#1E90FF] disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-default" /></div>
                    <div className="space-y-2"><Label htmlFor="state">State/Province</Label>
                      <Input id="state" value={stateProvince} onChange={e => setStateProvince(e.target.value)} disabled={!isAdmin} className="focus:ring-[#1E90FF] disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-default" /></div>
                    <div className="space-y-2"><Label htmlFor="zip">ZIP/Postal Code</Label>
                      <Input id="zip" value={zip} onChange={e => setZip(e.target.value)} disabled={!isAdmin} className="focus:ring-[#1E90FF] disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-default" /></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="transition-all hover:shadow-md">
              <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-[#1E90FF]" />Inventory Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="low-stock-threshold">Low Stock Threshold (%)</Label>
                    <Input id="low-stock-threshold" type="number" value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} disabled={!isAdmin} className="focus:ring-[#1E90FF] disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-default" />
                    <p className="text-xs text-gray-500">Alert when stock falls below this percentage of minimum stock</p>
                  </div>
                  <div className="space-y-2"><Label htmlFor="reorder-point">Auto Reorder Point</Label>
                    <Select value={reorderPoint} onValueChange={setReorderPoint} disabled={!isAdmin}>
                      <SelectTrigger id="reorder-point" className="disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-default"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="min">At Minimum Stock</SelectItem>
                        <SelectItem value="below">Below Minimum Stock</SelectItem>
                        <SelectItem value="custom">Custom Threshold</SelectItem>
                      </SelectContent>
                    </Select></div>
                  <div className="space-y-2"><Label htmlFor="stock-valuation">Stock Valuation Method</Label>
                    <Select value={stockValuation} onValueChange={setStockValuation} disabled={!isAdmin}>
                      <SelectTrigger id="stock-valuation" className="disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-default"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fifo">FIFO (First In, First Out)</SelectItem>
                        <SelectItem value="lifo">LIFO (Last In, First Out)</SelectItem>
                        <SelectItem value="avg">Average Cost</SelectItem>
                      </SelectContent>
                    </Select></div>
                  <div className="space-y-2"><Label htmlFor="default-category">Default Product Category</Label>
                    <Select value={defaultCategory} onValueChange={setDefaultCategory} disabled={!isAdmin}>
                      <SelectTrigger id="default-category" className="disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-default"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="accessories">Accessories</SelectItem>
                        <SelectItem value="supplies">Supplies</SelectItem>
                      </SelectContent>
                    </Select></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── Notifications ── */}
        <TabsContent value="notifications" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="transition-all hover:shadow-md">
              <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5 text-[#1E90FF]" />Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    { id: 'email-notif', icon: Mail, label: 'Email Notifications', desc: 'Receive notifications via email', checked: emailNotifications, onChange: setEmailNotifications },
                    { id: 'low-stock-alerts', icon: AlertTriangle, label: 'Low Stock Alerts', desc: 'Get notified when products are running low', checked: lowStockAlerts, onChange: setLowStockAlerts },
                    { id: 'order-notif', icon: Shield, label: 'Order Notifications', desc: 'Alerts for new orders and shipments', checked: orderNotifications, onChange: setOrderNotifications },
                    { id: 'push-notif', icon: Smartphone, label: 'Push Notifications', desc: 'Receive push notifications on your device', checked: pushNotifications, onChange: setPushNotifications },
                  ].map(({ id, icon: Icon, label, desc, checked, onChange }) => (
                    <div key={id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-gray-600" /><Label htmlFor={id} className="text-sm font-medium">{label}</Label></div>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                      <Switch id={id} checked={checked} onCheckedChange={onChange} />
                    </div>
                  ))}
                </div>
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-sm text-gray-900">Notification Frequency</h4>
                  <div className="space-y-2">
                    <Label htmlFor="notification-frequency">Email Digest</Label>
                    <Select value={emailDigest} onValueChange={setEmailDigest}>
                      <SelectTrigger id="notification-frequency"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── Security ── */}
        <TabsContent value="security" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="transition-all hover:shadow-md">
              <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5 text-[#1E90FF]" />Security Settings</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="two-factor" className="text-sm font-medium">Two-Factor Authentication</Label>
                      <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                    <Switch id="two-factor" checked={twoFactorAuth} onCheckedChange={setTwoFactorAuth} />
                  </div>

                  <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-sm text-gray-900">Change Password</h4>
                    <div className="space-y-4">
                      <PwField id="current-password" label="Current Password" value={currentPassword} onChange={setCurrentPassword} show={showCurrentPw} onToggle={() => setShowCurrentPw(v => !v)} />
                      <PwField id="new-password" label="New Password (min 6 characters)" value={newPassword} onChange={setNewPassword} show={showNewPw} onToggle={() => setShowNewPw(v => !v)} />
                      <PwField id="confirm-password" label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} show={showConfirmPw} onToggle={() => setShowConfirmPw(v => !v)} />
                      {newPassword.length > 0 && newPassword.length < 6 && <p className="text-xs text-red-600">Password must be at least 6 characters</p>}
                      {confirmPassword.length > 0 && newPassword !== confirmPassword && <p className="text-xs text-red-600">Passwords do not match</p>}
                      {newPassword.length >= 6 && newPassword === confirmPassword && confirmPassword.length > 0 && <p className="text-xs text-green-600">Passwords match ✓</p>}
                      <Button className="bg-gradient-to-r from-[#1E90FF] to-[#1565C0] hover:opacity-90" onClick={handleUpdatePassword} disabled={passwordLoading}>
                        {passwordLoading ? 'Updating…' : 'Update Password'}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm text-gray-900">Session Management</h4>
                    <div className="space-y-2">
                      <Label htmlFor="session-timeout">Auto Logout After</Label>
                      <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                        <SelectTrigger id="session-timeout"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="transition-all hover:shadow-md">
              <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-[#1E90FF]" />Access Control</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ip-whitelist">IP Whitelist (Optional)</Label>
                  <Input id="ip-whitelist" placeholder="192.168.1.1, 10.0.0.1" value={ipWhitelist} onChange={e => setIpWhitelist(e.target.value)} className="focus:ring-[#1E90FF]" />
                  <p className="text-xs text-gray-500">Comma-separated list of allowed IP addresses</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Audit Logging</Label>
                    <p className="text-xs text-gray-500">Track all user activities and changes</p>
                  </div>
                  <Switch checked={auditLogging} onCheckedChange={setAuditLogging} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── Data & Backup (Admin only) ── */}
        <TabsContent value="data" className="space-y-6">

          {/* Live Database Stats */}
          <motion.div variants={itemVariants}>
            <Card className="transition-all hover:shadow-md">
              <CardHeader><CardTitle className="flex items-center gap-2"><Database className="w-5 h-5 text-[#1E90FF]" />Database Overview</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Products',       value: products.length,      color: 'text-blue-700',  bg: 'bg-blue-50'  },
                    { label: 'Suppliers',      value: suppliers.length,     color: 'text-green-700', bg: 'bg-green-50' },
                    { label: 'Transactions',   value: transactions.length,  color: 'text-purple-700',bg: 'bg-purple-50'},
                    { label: 'Invoices',       value: invoices.length,      color: 'text-orange-700',bg: 'bg-orange-50'},
                    { label: 'Users',          value: users.length,         color: 'text-gray-700',  bg: 'bg-gray-50'  },
                    { label: 'Total Stock Value', value: `$${totalStockValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                  ].map(item => (
                    <div key={item.label} className={`p-4 rounded-lg ${item.bg}`}>
                      <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                      <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  Live data · Last export: {lastExport}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Backup Settings */}
          <motion.div variants={itemVariants}>
            <Card className="transition-all hover:shadow-md">
              <CardHeader><CardTitle className="flex items-center gap-2"><RefreshCw className="w-5 h-5 text-[#1E90FF]" />Backup Settings</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="auto-backup" className="text-sm font-medium">Automatic Backup</Label>
                    <p className="text-xs text-gray-500">Schedule automatic data backups</p>
                  </div>
                  <Switch id="auto-backup" checked={autoBackup} onCheckedChange={setAutoBackup} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup-frequency">Backup Frequency</Label>
                  <Select value={backupFrequency} onValueChange={setBackupFrequency} disabled={!autoBackup}>
                    <SelectTrigger id="backup-frequency" className="disabled:bg-gray-50 disabled:cursor-default"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Every Hour</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  Backup schedule is saved here and enforced by your server-side cron job. Use <strong>Export All Data</strong> below for an immediate manual backup.
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Export & Import */}
          <motion.div variants={itemVariants}>
            <Card className="transition-all hover:shadow-md">
              <CardHeader><CardTitle className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-[#1E90FF]" />Export & Import</CardTitle></CardHeader>
              <CardContent className="space-y-6">

                {/* Export */}
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-gray-900">Export All Data</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Downloads an Excel workbook with Products, Suppliers, Transactions, and Invoices sheets.</p>
                  </div>
                  <Button className="bg-gradient-to-r from-[#1E90FF] to-[#1565C0] hover:opacity-90 w-full sm:w-auto" onClick={handleExportAllData}>
                    <Download className="w-4 h-4 mr-2" />Export All Data (.xlsx)
                  </Button>
                </div>

                <div className="border-t border-gray-100 pt-6 space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-gray-900">Import Products</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Upload an Excel (.xlsx) file with a <strong>Products</strong> sheet. Rows with duplicate SKUs are skipped. Download the template to see the expected format.</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {/* hidden file input */}
                    <input ref={importRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />
                    <Button variant="outline" className="border-[#1E90FF] text-[#1E90FF] hover:bg-blue-50"
                      onClick={handleImportClick} disabled={importLoading}>
                      <Upload className="w-4 h-4 mr-2" />
                      {importLoading ? 'Importing…' : 'Import Products (.xlsx)'}
                    </Button>
                    <Button variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50" onClick={handleDownloadTemplate}>
                      <PackageOpen className="w-4 h-4 mr-2" />Download Import Template
                    </Button>
                  </div>
                </div>

                {/* Restore from Backup */}
                <div className="border-t border-gray-100 pt-6 space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-gray-900">Restore from Backup</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      To restore from a previous backup, use <strong>Import Products</strong> above with your exported file.
                      Full database restoration (all tables) requires direct server/database access.
                    </p>
                  </div>
                  <Button variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50 w-full sm:w-auto" onClick={handleExportAllData}>
                    <RefreshCw className="w-4 h-4 mr-2" />Create Backup Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Danger Zone */}
          <motion.div variants={itemVariants}>
            <Card className="border-red-200 transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-red-900">Reset Application Settings</h4>
                    <p className="text-xs text-red-700 mt-1">
                      Clears all saved settings (General, Notifications, Security preferences) stored in this browser back to defaults.
                      <strong> Database records on the server are NOT affected.</strong>
                    </p>
                  </div>

                  {clearStep === 0 ? (
                    <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={handleClearData}>
                      Clear All Settings
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-red-900">Type <code className="bg-red-100 px-1 rounded">DELETE</code> to confirm:</p>
                      <div className="flex gap-2">
                        <Input
                          value={clearInput}
                          onChange={e => setClearInput(e.target.value)}
                          placeholder="Type DELETE"
                          className="border-red-300 focus:ring-red-500 max-w-[200px]"
                          onKeyDown={e => e.key === 'Enter' && handleClearData()}
                        />
                        <Button variant="destructive" className="bg-red-600 hover:bg-red-700"
                          onClick={handleClearData} disabled={clearInput !== 'DELETE'}>
                          Confirm Reset
                        </Button>
                        <Button variant="outline" onClick={() => { setClearStep(0); setClearInput(''); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Global Save / Cancel */}
      <motion.div className="flex justify-end gap-3" variants={itemVariants}>
        <Button variant="outline" onClick={handleCancelSettings}>Cancel</Button>
        <Button className="bg-gradient-to-r from-[#1E90FF] to-[#1565C0] hover:opacity-90" onClick={handleSaveSettings}>
          <Save className="w-4 h-4 mr-2" />Save Settings
        </Button>
      </motion.div>
    </motion.div>
  );
};
