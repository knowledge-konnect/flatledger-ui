"use client"

import { useState, useEffect } from "react"
import { Save, User, Building2, CreditCard, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react'
import DashboardLayout from "../components/layout/DashboardLayout"
import Input from "../components/ui/Input"
import Button from "../components/ui/Button"
import { useAuth } from "../contexts/AuthProvider"
import { useSociety, useUpdateSociety } from "../hooks/useSocieties"
import { useChangePassword } from "../hooks/useChangePassword"
import { useSubscription } from "../hooks/useSubscription"
import { useToast } from "../components/ui/Toast"

/**
 * Settings Page - User & Society Configuration
 * 
 * Tabs:
 * - Profile: Personal information & password management
 * - Society Details: Society name & address (admin only)
 * - Subscription: Current plan, status, and billing info
 */

export default function SettingsPageRedesigned() {
  const [activeTab, setActiveTab] = useState("profile")
  const { user } = useAuth()
  const { showToast } = useToast()
  
  // Form states
  const [profileFormData, setProfileFormData] = useState({
    name: "",
    email: "",
    mobile: ""
  })
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [societyFormData, setSocietyFormData] = useState({
    name: "",
    address: ""
  })
  
  const [isSaving, setIsSaving] = useState(false)
  
  // API hooks
  const society = useSociety(user?.societyId || "")
  const updateSociety = useUpdateSociety(user?.societyId || "")
  const changePassword = useChangePassword()
  const subscription = useSubscription()
  
  // Update form when society data loads
  useEffect(() => {
    if (society.data) {
      setSocietyFormData({
        name: society.data.name || "",
        address: society.data.address || ""
      })
    } else if (user?.societyName) {
      // Fallback to user data if society query fails
      setSocietyFormData(prev => ({
        ...prev,
        name: prev.name || user.societyName || ""
      }))
    }
  }, [society.data, user])
  
  // Load user profile data
  useEffect(() => {
    if (user) {
      setProfileFormData({
        name: user.name || "",
        email: user.email || "",
        mobile: "" // Add mobile field to user type if needed
      })
    }
  }, [user])

  
  // Settings tabs
  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "society", label: "Society Details", icon: Building2, adminOnly: true },
    { id: "subscription", label: "Subscription", icon: CreditCard },
  ]
  
  // Filter tabs based on user role
  const visibleTabs = tabs.filter(tab => {
    if (tab.adminOnly) {
      // Check if user has admin role
      return user?.roles?.includes('Admin') || user?.roles?.includes('SuperAdmin')
    }
    return true
  })
  
  // Handle save for profile settings
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      // TODO: Implement updateUser API endpoint
      // For now, just show success message
      showToast("Profile settings will be updated when API is ready", "info")
    } catch (error) {
      showToast("Failed to update profile", "error")
    } finally {
      setIsSaving(false)
    }
  }
  
  // Handle password change
  const handleChangePassword = async () => {
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      showToast("New passwords do not match", "error")
      return
    }
    
    if (passwordFormData.newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error")
      return
    }
    
    try {
      setIsSaving(true)
      await changePassword.mutateAsync({
        currentPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword,
        confirmPassword: passwordFormData.confirmPassword
      })
      showToast("Password changed successfully", "success")
      setPasswordFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
    } catch (error: any) {
      showToast(error?.message || "Failed to change password", "error")
    } finally {
      setIsSaving(false)
    }
  }
  
  // Handle save for society settings
  const handleSaveSociety = async () => {
    if (!user?.societyId) return
    
    try {
      setIsSaving(true)
      await updateSociety.mutateAsync({
        name: societyFormData.name,
        address: societyFormData.address
      })
      showToast("Society information updated successfully", "success")
    } catch (error) {
      showToast("Failed to update society information", "error")
    } finally {
      setIsSaving(false)
    }
  }
  
  // Handle input change for profile form
  const handleProfileInputChange = (field: string, value: string) => {
    setProfileFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  // Handle input change for password form
  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  // Handle input change for society form
  const handleSocietyInputChange = (field: string, value: string) => {
    setSocietyFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-8">
        <div>
          <h2 className="section-heading mb-2">Account Settings</h2>
          <p className="subheading">Manage your profile, society information, and preferences</p>
        </div>

        <div className="border-b border-slate-200 dark:border-slate-800">
          <div className="flex gap-1 overflow-x-auto pb-0 -mb-px">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-semibold text-sm transition-all whitespace-nowrap border-b-2 flex items-center gap-2 micro-interaction ${
                  activeTab === tab.id
                    ? "border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Personal Information Card */}
              <div className="card-base p-8">
                <h3 className="text-xl font-bold text-foreground mb-6">Personal Information</h3>
                <div className="space-y-6">
                  <Input
                    label="Full Name"
                    placeholder="Enter your name"
                    value={profileFormData.name}
                    onChange={(e) => handleProfileInputChange('name', e.target.value)}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email"
                    value={profileFormData.email}
                    onChange={(e) => handleProfileInputChange('email', e.target.value)}
                    disabled
                  />
                  <p className="text-xs text-slate-500 -mt-4">Email cannot be changed for security reasons</p>
                  <Input
                    label="Mobile Number"
                    placeholder="Enter mobile number"
                    value={profileFormData.mobile}
                    onChange={(e) => handleProfileInputChange('mobile', e.target.value)}
                  />
                  <div className="pt-2">
                    <Button 
                      variant="primary" 
                      className="flex items-center gap-2"
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Change Password Card */}
              <div className="card-base p-8">
                <h3 className="text-xl font-bold text-foreground mb-6">Change Password</h3>
                <div className="space-y-6">
                  <div className="relative">
                    <Input
                      label="Current Password"
                      type={showPasswords.current ? "text" : "password"}
                      placeholder="Enter current password"
                      value={passwordFormData.currentPassword}
                      onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      label="New Password"
                      type={showPasswords.new ? "text" : "password"}
                      placeholder="Enter new password"
                      value={passwordFormData.newPassword}
                      onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      label="Confirm New Password"
                      type={showPasswords.confirm ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={passwordFormData.confirmPassword}
                      onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="pt-2">
                    <Button 
                      variant="primary" 
                      className="flex items-center gap-2"
                      onClick={handleChangePassword}
                      disabled={isSaving || changePassword.isPending || !passwordFormData.currentPassword || !passwordFormData.newPassword}
                    >
                      {changePassword.isPending ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      {changePassword.isPending ? 'Changing...' : 'Change Password'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "society" && (
            <div className="card-base p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">Society Information</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium">
                  Admin Only
                </span>
              </div>
              
              {society.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : society.error ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm text-red-700 dark:text-red-300">Failed to load society information</span>
                </div>
              ) : (
                <>
                  <div className="space-y-6">
                    <Input
                      label="Society Name"
                      placeholder="Enter society name"
                      value={societyFormData.name}
                      onChange={(e) => handleSocietyInputChange('name', e.target.value)}
                    />
                    <Input
                      label="Address"
                      placeholder="Enter address"
                      value={societyFormData.address}
                      onChange={(e) => handleSocietyInputChange('address', e.target.value)}
                    />
                    <div className="pt-4">
                      <Button 
                        variant="primary" 
                        className="flex items-center gap-2"
                        onClick={handleSaveSociety}
                        disabled={isSaving || updateSociety.isPending}  
                      >
                        {updateSociety.isPending ? (
                          <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                          <Save className="w-5 h-5" />
                        )}
                        {updateSociety.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "subscription" && (
            <div className="card-base p-8">
              <h3 className="text-xl font-bold text-foreground mb-8">Subscription & Billing</h3>
              
              {subscription.loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : subscription.error ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm text-red-700 dark:text-red-300">Failed to load subscription details</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Current Plan */}
                  <div className="p-6 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Current Plan</p>
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          {subscription.planName || 'No Active Plan'}
                        </p>
                      </div>
                      {subscription.status === 'trial' && (
                        <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-medium">
                          Trial
                        </span>
                      )}
                      {subscription.status === 'active' && (
                        <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {subscription.status === 'trial' && subscription.trialDaysRemaining !== null && (
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          <span className="font-semibold">{subscription.trialDaysRemaining} days</span> remaining in trial
                        </p>
                      )}
                      {subscription.monthlyAmount && (
                        <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                          ₹{subscription.monthlyAmount}/month
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Plan Features or Status */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Status</p>
                      <p className="text-lg font-semibold text-foreground capitalize">
                        {subscription.status || 'Inactive'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Access</p>
                      <p className="text-lg font-semibold text-foreground">
                        {subscription.accessAllowed ? (
                          <span className="text-green-600 dark:text-green-400">Allowed</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">Restricted</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <Button variant="primary">
                      Upgrade Plan
                    </Button>
                    <Button variant="outline">
                      View All Plans
                    </Button>
                    {subscription.status === 'active' && (
                      <Button variant="outline" className="text-red-600 dark:text-red-400 ml-auto">
                        Cancel Subscription
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
