"use client"

import { useState, useEffect } from "react"
import { Save, User, Building2, CreditCard, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react'
import DashboardLayout from "../components/layout/DashboardLayout"
import PageHeader from "../components/ui/PageHeader"
import Input from "../components/ui/Input"
import Button from "../components/ui/Button"
import Card, { CardContent } from "../components/ui/Card"
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
  });
  const [displayName, setDisplayName] = useState("");
  const [displayEmail, setDisplayEmail] = useState("");
  
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
        name: user.userName || user.name || "",
        email: user.email || "",
        mobile: user.mobile || ""
      });
      // Display user info with fallback
      setDisplayName(user.userName || user.name || "User");
      setDisplayEmail(user.email || "user@example.com");
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
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Manage your profile, society information, and preferences"
          icon={CreditCard}
        />

        <div className="border-b border-[#E2E8F0] dark:border-[#1E293B]">
          <div className="flex gap-1 overflow-x-auto pb-0 -mb-px">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-semibold text-sm transition-all whitespace-nowrap border-b-2 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-[#2563EB] dark:border-[#3B82F6] text-[#2563EB] dark:text-[#3B82F6]"
                    : "border-transparent text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]"
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
              {/* Profile Info Card */}
              <Card className="overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border-indigo-200 dark:border-indigo-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-4">Your Profile</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] dark:from-[#3B82F6] dark:to-[#2563EB] rounded-full flex items-center justify-center text-white font-semibold text-2xl shadow-md">
                        {((displayName || 'U').charAt(0)).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Full Name</p>
                        <p className="text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{displayName || 'Loading...'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Email Address</p>
                      <p className="text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{displayEmail || 'Loading...'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Role</p>
                      <p className="text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{user?.role || 'Member'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Society</p>
                      <p className="text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{user?.societyName || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information Card */}
              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-6">Edit Information</h3>
                <div className="space-y-6">
                  <Input
                    label="Full Name"
                    placeholder="Enter your name"
                    value={profileFormData.name}
                    onChange={(e) => handleProfileInputChange('name', e.target.value)}
                    disabled
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
              </CardContent>
            </Card>
              
              {/* Change Password Card */}
              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Change Password</h3>
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
              </CardContent>
            </Card>
            </div>
          )}

          {activeTab === "society" && (
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Society Information</h3>
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
            </CardContent>
          </Card>
          )}

          {activeTab === "subscription" && (
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Subscription & Billing</h3>
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
                  <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Current Plan</p>
                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
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
            </CardContent>
          </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
