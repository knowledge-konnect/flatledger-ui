"use client"

import { useState, useEffect } from "react"
import React from "react"
import {
  Save, User, Building2, Settings, CreditCard, AlertCircle, Loader, Eye, EyeOff,
  Lock, Bell, Wrench, Moon, Sun, Shield, ChevronRight, CheckCircle2, IndianRupee, Calculator, Crown
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DashboardLayout from "../components/layout/DashboardLayout"
import Input from "../components/ui/Input"
import Button from "../components/ui/Button"
import Card, { CardContent } from "../components/ui/Card"
import { useAuth } from "../contexts/AuthProvider"
import { useSociety, useUpdateSociety, useMaintenanceConfig, useUpdateMaintenanceConfig } from "../hooks/useSocieties"
import { useChangePassword } from "../hooks/useChangePassword"
import { useUpdateProfile } from "../hooks/useUpdateProfile"
import { useSubscription } from "../hooks/useSubscription"
import { useNotifications, useUpdateNotifications } from "../hooks/useNotifications"
import { useToast } from "../components/ui/Toast"
import { cn } from "../lib/utils"
import { useOpeningBalanceStatus } from "../hooks/useOpeningBalance"
import { isAdminRole, collectUserRoles } from "../types/roles"

const NAV_SECTIONS: { label: string; items: { id: string; label: string; icon: React.ElementType; description: string; adminOnly?: boolean; href?: string }[] }[] = [
  {
    label: 'Account',
    items: [
      { id: 'profile', label: 'Profile', icon: User, description: 'Name, email & mobile' },
      { id: 'password', label: 'Password', icon: Lock, description: 'Change your password' },
    ],
  },
  {
    label: 'Society',
    items: [
      { id: 'society', label: 'Society Details', icon: Building2, description: 'Name & address', adminOnly: true },
      { id: 'maintenance-config', label: 'Maintenance Charges', icon: Wrench, description: 'Monthly fee per flat, due dates & late fees', adminOnly: true },
      { id: 'opening-balance', label: 'Opening Balance', icon: Calculator, description: 'Initial society balances', adminOnly: true, href: '/settings/opening-balance' },
    ],
  },
  {
    label: 'Preferences',
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alerts & reminders' },
      { id: 'appearance', label: 'Appearance', icon: Moon, description: 'Theme & display' },
    ],
  },
  {
    label: 'Billing',
    items: [
      { id: 'subscription', label: 'Subscription', icon: CreditCard, description: 'Plan & billing info' },
    ],
  },
]

export default function SettingsPageRedesigned() {
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(() => searchParams.get('section') || 'profile')
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const obStatus = useOpeningBalanceStatus()
  const { showToast } = useToast()

  const [profileFormData, setProfileFormData] = useState({ name: "", email: "", mobile: "" })
  const [passwordFormData, setPasswordFormData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
  const [societyFormData, setSocietyFormData] = useState({ name: "", address: "" })
  const [displayName, setDisplayName] = useState("")
  const [displayEmail, setDisplayEmail] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const [maintenanceForm, setMaintenanceForm] = useState({
    defaultMonthlyCharge: 0,
    dueDayOfMonth: 5,
    lateFeePerMonth: 0,
    gracePeriodDays: 0,
  })

  const society = useSociety(user?.societyId || "")
  const updateSociety = useUpdateSociety(user?.societyId || "")
  const changePassword = useChangePassword()
  const updateProfile = useUpdateProfile()
  const maintenanceConfig = useMaintenanceConfig(user?.societyPublicId || "")
  const updateMaintenanceConfig = useUpdateMaintenanceConfig(user?.societyPublicId || "")
  const notifications = useNotifications()
  const updateNotifications = useUpdateNotifications()
  const subscription = useSubscription()
  const { cancelSubscription: cancelSub, refreshStatus } = useSubscription()

  const [isCancelling, setIsCancelling] = useState(false)

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) return
    setIsCancelling(true)
    try {
      await cancelSub('User requested cancellation')
      showToast('Subscription cancelled.', 'info')
      refreshStatus()
    } catch {
      showToast('Failed to cancel subscription.', 'error')
    } finally {
      setIsCancelling(false)
    }
  }

  const allRoles = collectUserRoles(user)
  const isAdmin = isAdminRole(allRoles)

  useEffect(() => {
    if (society.data) {
      setSocietyFormData({ name: society.data.name || "", address: society.data.address || "" })
    } else if (user?.societyName) {
      setSocietyFormData(prev => ({ ...prev, name: prev.name || user.societyName || "" }))
    }
  }, [society.data, user])

  useEffect(() => {
    if (maintenanceConfig.data) {
      setMaintenanceForm({
        defaultMonthlyCharge: maintenanceConfig.data.defaultMonthlyCharge ?? 0,
        dueDayOfMonth: maintenanceConfig.data.dueDayOfMonth ?? 5,
        lateFeePerMonth: maintenanceConfig.data.lateFeePerMonth ?? 0,
        gracePeriodDays: maintenanceConfig.data.gracePeriodDays ?? 0,
      })
    }
  }, [maintenanceConfig.data])

  useEffect(() => {
    if (user) {
      setProfileFormData({ name: user.userName || user.name || "", email: user.email || "", mobile: user.mobile || "" })
      setDisplayName(user.userName || user.name || "User")
      setDisplayEmail(user.email || "")
    }
  }, [user])

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      await updateProfile.mutateAsync({ mobile: profileFormData.mobile })
      showToast("Mobile number updated successfully", "success")
    } catch (error: any) {
      const data = error?.response?.data
      const message = data?.errors?.[0]?.messages?.[0] || data?.message || error?.message || "Failed to update profile"
      showToast(message, "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveMaintenanceConfig = async () => {
    try {
      setIsSaving(true)
      await updateMaintenanceConfig.mutateAsync(maintenanceForm)
      showToast("Maintenance configuration saved", "success")
      // If opened from the setup flow, return to setup to continue
      if (searchParams.get('section') === 'maintenance-config') {
        navigate('/setup')
      }
    } catch (error: any) {
      const data = error?.response?.data
      const message = data?.errors?.[0]?.messages?.[0] || data?.message || error?.message || "Failed to save configuration"
      showToast(message, "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleNotif = async (key: string, value: boolean) => {
    // Map UI keys to API keys
    const keyMap: Record<string, string> = {
      maintenanceDue: 'paymentReminders',
      paymentReceived: 'billGenerated',
      announcements: 'monthlyReports',
      expenseAdded: 'expenseUpdates',
    }
    try {
      await updateNotifications.mutateAsync({ [keyMap[key]]: value })
    } catch {
      showToast("Failed to update notification preference", "error")
    }
  }

  const handleChangePassword = async () => {
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      showToast("New passwords do not match", "error"); return
    }
    if (passwordFormData.newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error"); return
    }
    try {
      setIsSaving(true)
      await changePassword.mutateAsync({
        currentPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword,
        confirmPassword: passwordFormData.confirmPassword
      })
      showToast("Password changed successfully. Please log in again.", "success")
      setPasswordFormData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setTimeout(async () => {
        await logout()
        navigate('/')
      }, 1500)
    } catch (error: any) {
      const data = error?.response?.data
      const message = data?.errors?.[0]?.messages?.[0] || data?.message || error?.message || "Failed to change password"
      showToast(message, "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSociety = async () => {
    if (!user?.societyId) return
    try {
      setIsSaving(true)
      await updateSociety.mutateAsync({ name: societyFormData.name, address: societyFormData.address })
      showToast("Society information updated successfully", "success")
    } catch {
      showToast("Failed to update society information", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const toggleTheme = () => {
    const html = document.documentElement
    if (html.classList.contains('dark')) {
      html.classList.remove('dark')
      setIsDark(false)
    } else {
      html.classList.add('dark')
      setIsDark(true)
    }
  }

  // Compute initials
  const initials = ((name: string) => {
    const words = name.trim().split(/\s+/)
    return words.map(w => w[0]).slice(0, 2).join('').toUpperCase()
  })(displayName || 'U')

  // Flatten visible nav items
  const visibleSections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.adminOnly) return isAdmin
      return true
    })
  })).filter(s => s.items.length > 0)

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-4">
        {/* Page title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage your account and society preferences</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left sidebar nav */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="space-y-4">
              {visibleSections.map(section => (
                <div key={section.label}>
                  <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {section.label}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map(item => {
                      const isObNew = item.id === 'opening-balance' && !obStatus?.data?.isApplied
                      const isActive = activeSection === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.href) { navigate(item.href) } else { setActiveSection(item.id) }
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 text-left group',
                            isActive
                              ? 'bg-primary/10 dark:bg-primary-500/10 text-primary dark:text-primary-500'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                          )}
                        >
                          <span className={cn(
                            'w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors',
                            isActive
                              ? 'bg-primary/15 dark:bg-primary-500/15'
                              : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                          )}>
                            <item.icon className="w-3.5 h-3.5" />
                          </span>
                          <span className="flex-1 truncate">{item.label}</span>
                          {isObNew && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 leading-none">
                              New
                            </span>
                          )}
                          {obStatus?.data?.isApplied && item.id === 'opening-balance' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          )}
                          {isActive && !item.href && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          {/* Right content area */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* ── PROFILE ── */}
            {activeSection === 'profile' && (
              <>
                {/* Identity banner */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 p-6 flex items-center gap-5 shadow">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
                  <div className="relative w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                    {initials}
                  </div>
                  <div className="relative">
                    <p className="text-white font-bold text-lg">{displayName || 'Loading...'}</p>
                    <p className="text-emerald-100 text-sm">{displayEmail}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{user?.role || user?.roles?.[0] || 'Member'}</span>
                      {user?.societyName && (
                        <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{user.societyName}</span>
                      )}
                    </div>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-6 space-y-5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200">Account Details</h3>
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        <Lock className="w-3 h-3" /> Read-only
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Full Name</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{profileFormData.name || '—'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email Address</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{profileFormData.email || '—'}</p>
                        <p className="text-xs text-slate-400">Cannot be changed for security reasons</p>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                      <div className="max-w-xs space-y-3">
                        <Input
                          label="Mobile Number"
                          placeholder="Enter mobile number"
                          value={profileFormData.mobile}
                          onChange={e => setProfileFormData(p => ({ ...p, mobile: e.target.value }))}
                        />
                        <Button variant="primary" className="flex items-center gap-2" onClick={handleSaveProfile} disabled={isSaving || !isAdmin}>
                          {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          {isSaving ? 'Saving...' : 'Save Mobile'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* ── PASSWORD ── */}
            {activeSection === 'password' && (
              <Card>
                <CardContent className="p-6 space-y-5">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">Change Password</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Use a strong password of at least 6 characters</p>
                  </div>
                  <div className="max-w-sm space-y-4">
                    {(['current', 'new', 'confirm'] as const).map((key) => {
                      const labels = { current: 'Current Password', new: 'New Password', confirm: 'Confirm New Password' }
                      const fields = { current: 'currentPassword', new: 'newPassword', confirm: 'confirmPassword' } as const
                      return (
                        <div key={key} className="relative">
                          <Input
                            label={labels[key]}
                            type={showPasswords[key] ? 'text' : 'password'}
                            placeholder={`Enter ${labels[key].toLowerCase()}`}
                            value={passwordFormData[fields[key]]}
                            onChange={e => setPasswordFormData(p => ({ ...p, [fields[key]]: e.target.value }))}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(p => ({ ...p, [key]: !p[key] }))}
                            className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                          >
                            {showPasswords[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      )
                    })}
                    <Button
                      variant="primary"
                      className="flex items-center gap-2 w-full"
                      onClick={handleChangePassword}
                      disabled={changePassword.isPending || !passwordFormData.currentPassword || !passwordFormData.newPassword}
                    >
                      {changePassword.isPending ? <Loader className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                      {changePassword.isPending ? 'Changing...' : 'Change Password'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── SOCIETY DETAILS ── */}
            {activeSection === 'society' && (
              <Card>
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200">Society Information</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Visible to all members of your society</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 font-medium">Admin Only</span>
                  </div>
                  {society.isLoading ? (
                    <div className="flex items-center justify-center py-10"><Loader className="w-5 h-5 animate-spin text-slate-400" /></div>
                  ) : society.error ? (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="text-sm text-red-700 dark:text-red-300">Failed to load society information</span>
                    </div>
                  ) : (
                    <div className="max-w-sm space-y-4">
                      <Input label="Society Name" placeholder="Enter society name" value={societyFormData.name} onChange={e => setSocietyFormData(p => ({ ...p, name: e.target.value }))} disabled={!isAdmin} />
                      <Input label="Address" placeholder="Enter address" value={societyFormData.address} onChange={e => setSocietyFormData(p => ({ ...p, address: e.target.value }))} disabled={!isAdmin} />
                      <Button variant="primary" className="flex items-center gap-2" onClick={handleSaveSociety} disabled={updateSociety.isPending || !isAdmin}>
                        {updateSociety.isPending ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {updateSociety.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── MAINTENANCE CONFIG ── */}
            {activeSection === 'maintenance-config' && (
              <Card>
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200">Maintenance Charges</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Set the monthly maintenance fee per flat and billing rules applied when generating bills</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 font-medium">Treasurer / Admin</span>
                  </div>
                  {maintenanceConfig.isLoading ? (
                    <div className="flex items-center justify-center py-10"><Loader className="w-5 h-5 animate-spin text-slate-400" /></div>
                  ) : (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Default Monthly Charge</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><IndianRupee className="w-4 h-4" /></span>
                            <input
                              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              placeholder="e.g. 2000" type="number" min={0}
                              value={maintenanceForm.defaultMonthlyCharge}
                              onChange={e => setMaintenanceForm(p => ({ ...p, defaultMonthlyCharge: Number(e.target.value) }))}
                            />
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Standard amount charged to each flat per month</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Due Day of Month</label>
                          <input
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g. 5" type="number" min={1} max={28}
                            value={maintenanceForm.dueDayOfMonth}
                            onChange={e => setMaintenanceForm(p => ({ ...p, dueDayOfMonth: Number(e.target.value) }))}
                          />
                          <p className="text-xs text-slate-400 mt-1">Bills become due on this day each month (e.g. 5 = 5th)</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Late Fee (per month)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><IndianRupee className="w-4 h-4" /></span>
                            <input
                              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              placeholder="e.g. 100" type="number" min={0}
                              value={maintenanceForm.lateFeePerMonth}
                              onChange={e => setMaintenanceForm(p => ({ ...p, lateFeePerMonth: Number(e.target.value) }))}
                            />
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Extra charge added each month after the grace period if unpaid</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Grace Period (days)</label>
                          <input
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g. 5" type="number" min={0}
                            value={maintenanceForm.gracePeriodDays}
                            onChange={e => setMaintenanceForm(p => ({ ...p, gracePeriodDays: Number(e.target.value) }))}
                          />
                          <p className="text-xs text-slate-400 mt-1">Days after the due date before late fees start applying</p>
                        </div>
                      </div>
                      <Button variant="primary" className="flex items-center gap-2" onClick={handleSaveMaintenanceConfig} disabled={isSaving}>
                        {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'Saving...' : 'Save Configuration'}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeSection === 'notifications' && (
              <Card>
                <CardContent className="p-6 space-y-5">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">Notification Preferences</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Choose which events you want to be notified about</p>
                  </div>
                  {notifications.isLoading ? (
                    <div className="flex items-center justify-center py-8"><Loader className="w-5 h-5 animate-spin text-slate-400" /></div>
                  ) : (
                    <div className="space-y-1">
                      {[
                        { key: 'maintenanceDue', apiKey: 'paymentReminders', label: 'Maintenance Due Reminder', desc: 'Receive alerts when monthly maintenance is due' },
                        { key: 'paymentReceived', apiKey: 'billGenerated', label: 'Payment Received', desc: 'Notify when a payment is recorded for your flat' },
                        { key: 'announcements', apiKey: 'monthlyReports', label: 'Society Announcements', desc: 'Get notified about new announcements' },
                        { key: 'expenseAdded', apiKey: 'expenseUpdates', label: 'New Expense Added', desc: 'Alert when a new society expense is logged' },
                      ].map(({ key, apiKey, label, desc }) => {
                        const isOn = notifications.data ? (notifications.data as any)[apiKey] ?? false : false
                        return (
                          <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
                              <p className="text-xs text-slate-400">{desc}</p>
                            </div>
                            <button
                              onClick={() => handleToggleNotif(key, !isOn)}
                              disabled={updateNotifications.isPending}
                              className={cn(
                                'relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 disabled:opacity-60',
                                isOn ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                              )}
                            >
                              <span className={cn(
                                'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                                isOn ? 'translate-x-5' : 'translate-x-0'
                              )} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── APPEARANCE ── */}
            {activeSection === 'appearance' && (
              <Card>
                <CardContent className="p-6 space-y-5">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">Appearance</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Customize how FlatLedger looks for you</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Theme</p>
                    <div className="flex gap-3">
                      {[
                        { key: 'light', label: 'Light', icon: Sun },
                        { key: 'dark', label: 'Dark', icon: Moon },
                      ].map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => {
                            if ((key === 'dark') !== isDark) toggleTheme()
                          }}
                          className={cn(
                            'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150',
                            ((key === 'dark') === isDark)
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                          )}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-sm font-medium">{label}</span>
                          {((key === 'dark') === isDark) && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── SUBSCRIPTION ── */}
            {activeSection === 'subscription' && (
              <div className="space-y-4">
                {subscription.loading ? (
                  <div className="flex items-center justify-center py-16"><Loader className="w-5 h-5 animate-spin text-slate-400" /></div>
                ) : subscription.error ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-red-700 dark:text-red-300">Failed to load subscription details</span>
                  </div>
                ) : (
                  <>
                    {/* Plan hero */}
                    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 shadow">
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
                      <div className="relative flex items-center justify-between">
                        <div>
                          <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-1">Current Plan</p>
                          <p className="text-white text-2xl font-bold">{subscription.planName || 'No Active Plan'}</p>
                          {subscription.monthlyAmount && (
                            <p className="text-emerald-100 text-sm mt-1">₹{subscription.monthlyAmount}<span className="text-emerald-300">/month</span></p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {subscription.status === 'trial' && (
                            <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 text-xs font-semibold border border-amber-400/30">Trial</span>
                          )}
                          {subscription.status === 'active' && (
                            <span className="px-3 py-1 rounded-full bg-green-400/20 text-green-200 text-xs font-semibold border border-green-400/30">Active</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Access</p>
                          <p className="text-base font-bold">
                            {subscription.accessAllowed
                              ? <span className="text-green-600 dark:text-green-400">✓ Full Access</span>
                              : <span className="text-red-600 dark:text-red-400">✗ Restricted</span>
                            }
                          </p>
                        </CardContent>
                      </Card>
                      {subscription.status === 'trial' && subscription.trialDaysRemaining !== null && (
                        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                          <CardContent className="p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-amber-500 mb-2">Trial Ends</p>
                            <p className="text-base font-bold text-amber-700 dark:text-amber-300">
                              {subscription.trialDaysRemaining} days remaining
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      {(subscription.status === 'trial' || subscription.status === 'expired' || subscription.status === 'cancelled') && (
                        <Button
                          variant="primary"
                          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-violet-600 hover:from-emerald-700 hover:to-violet-700"
                          onClick={() => navigate('/subscription/manage')}
                        >
                          <Crown className="w-4 h-4" />
                          Upgrade Plan
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => navigate('/subscription/manage')}>View All Plans</Button>
                      {subscription.status === 'active' && (
                        <Button
                          variant="outline"
                          className="text-red-600 dark:text-red-400 ml-auto"
                          onClick={handleCancelSubscription}
                          disabled={isCancelling}
                        >
                          {isCancelling ? <Loader className="w-4 h-4 animate-spin mr-1" /> : null}
                          {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
