import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Save, Check, Mail, KeyRound, ArrowLeft, Moon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Settings() {
  const { user, profile, updateProfile, updatePassword } = useAuth()
  const [fullName, setFullName] = useState('')
  const [saved, setSaved] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile?.full_name !== undefined) {
      setFullName(profile.full_name || '')
    }
  }, [profile])

  const handleProfileSave = async () => {
    setProfileError(null)
    setLoading(true)
    const { error } = await updateProfile({ full_name: fullName })
    setLoading(false)
    if (error) {
      setProfileError(error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const handlePasswordChange = async () => {
    setPasswordError(null)
    setPasswordSuccess(false)

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setLoading(true)
    const { error } = await updatePassword(newPassword)
    setLoading(false)

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setShowChangePassword(false)
    }
  }

  return (
    <div className="min-h-screen py-24 px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <Link to="/" className="inline-flex items-center gap-1 text-sm mb-4 hover:opacity-80" style={{ color: 'var(--accent-blue)' }}>
            <ArrowLeft size={14} />
            Back to Home
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <SettingsIcon size={28} />
            Settings
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Manage your account preferences
          </p>
        </motion.div>

        {!user ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-8 text-center"
          >
            <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>Please log in to access settings</p>
            <Link
              to="/login"
              className="inline-block px-6 py-2 rounded-xl font-semibold text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}
            >
              Sign In
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Profile section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl p-6 sm:p-8 mb-6"
            >
              <div className="flex items-center gap-3 mb-6" style={{ color: 'var(--text-secondary)' }}>
                <User size={20} />
                <h2 className="font-semibold">Profile</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl text-base outline-none"
                    style={{
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-secondary)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-quaternary)' }} />
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="w-full pl-12 pr-4 py-3 rounded-xl text-base outline-none"
                      style={{
                        background: 'var(--bg-input)',
                        color: 'var(--text-quaternary)',
                        border: '1px solid var(--border-secondary)',
                      }}
                    />
                  </div>
                </div>

                <div className="text-xs" style={{ color: 'var(--text-quaternary)' }}>
                  Role: {profile?.role || 'user'}
                </div>

                {profileError && (
                  <div className="text-sm py-2 px-3 rounded-lg" style={{ color: 'var(--accent-red)', background: 'rgba(239,68,68,0.1)' }}>
                    {profileError}
                  </div>
                )}

                <motion.button
                  onClick={handleProfileSave}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  style={{ background: saved ? '#22c55e' : 'linear-gradient(135deg, #2563eb, #4f46e5)' }}
                >
                  {saved ? (
                    <>
                      <Check size={16} />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Profile
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>

            {/* Password section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card rounded-2xl p-6 sm:p-8 mb-6"
            >
              <div className="flex items-center gap-3 mb-6" style={{ color: 'var(--text-secondary)' }}>
                <KeyRound size={20} />
                <h2 className="font-semibold">Password</h2>
              </div>

              {passwordSuccess && (
                <div className="text-sm py-2 px-3 rounded-lg mb-4" style={{ color: 'var(--accent-green)', background: 'rgba(34,197,94,0.1)' }}>
                  Password updated successfully!
                </div>
              )}

              {showChangePassword ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      minLength={6}
                      className="w-full px-4 py-3 rounded-xl text-base outline-none"
                      style={{
                        background: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-secondary)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      minLength={6}
                      className="w-full px-4 py-3 rounded-xl text-base outline-none"
                      style={{
                        background: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-secondary)',
                      }}
                    />
                  </div>

                  {passwordError && (
                    <div className="text-sm py-2 px-3 rounded-lg" style={{ color: 'var(--accent-red)', background: 'rgba(239,68,68,0.1)' }}>
                      {passwordError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowChangePassword(false)}
                      className="flex-1 py-3 rounded-xl font-medium text-sm cursor-pointer"
                      style={{ background: 'var(--bg-badge)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePasswordChange}
                      disabled={loading}
                      className="flex-1 py-3 rounded-xl font-semibold text-white text-sm cursor-pointer disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="text-sm cursor-pointer hover:opacity-80"
                  style={{ color: 'var(--accent-blue)' }}
                >
                  Change Password
                </button>
              )}
            </motion.div>

            {/* Appearance section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-6 sm:p-8 mb-6"
            >
              <div className="flex items-center gap-3 mb-6" style={{ color: 'var(--text-secondary)' }}>
                <Palette size={20} />
                <h2 className="font-semibold">Appearance</h2>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Theme</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-quaternary)' }}>Premium dark interface optimized for focus</div>
                </div>
                <div
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
                  style={{
                    background: 'var(--bg-badge)',
                    border: '1px solid var(--border-accent)',
                    color: 'var(--accent-blue)',
                  }}
                >
                  <Moon size={14} />
                  Dark Mode
                </div>
              </div>
            </motion.div>

            {/* Notifications section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-2xl p-6 sm:p-8 mb-6"
            >
              <div className="flex items-center gap-3 mb-6" style={{ color: 'var(--text-secondary)' }}>
                <Bell size={20} />
                <h2 className="font-semibold">Notifications</h2>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Email Notifications</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-quaternary)' }}>Get notified about new features</div>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`w-12 h-7 rounded-full relative transition-colors duration-200 cursor-pointer ${notifications ? 'bg-blue-500' : 'bg-gray-600'}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-transform duration-200 ${notifications ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </motion.div>

            {/* Privacy section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card rounded-2xl p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-6" style={{ color: 'var(--text-secondary)' }}>
                <Shield size={20} />
                <h2 className="font-semibold">Privacy & Security</h2>
              </div>

              <div className="space-y-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                <p>Your analysis data is stored securely. We never share your reel URLs with third parties.</p>
                <p>Analyses older than 90 days are automatically archived.</p>
              </div>

              <div className="mt-6 flex gap-3">
                <Link
                  to="/privacy"
                  className="text-xs cursor-pointer hover:opacity-80"
                  style={{ color: 'var(--accent-blue)' }}
                >
                  Privacy Policy
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
