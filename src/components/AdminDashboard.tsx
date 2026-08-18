import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, BarChart3, Activity, TrendingUp, Shield, Database, AlertCircle,
  Search, ArrowLeft, RefreshCw, Ban, Trash2, CheckCircle2,
  Cpu, Save, Plus, X, ChevronLeft, ChevronRight, Megaphone, Settings as SettingsIcon,
  UserCog, Eye, Edit3, Globe
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

// ─── Types ───

interface Stats {
  totalAnalyses: number
  avgScore: number
  todayAnalyses: number
  totalUsers: number
  activeUsers: number
  bannedUsers: number
  newUsersToday: number
  totalVisitors: number
  todayVisitors: number
  analysisGrowth: number[]
  userGrowth: number[]
}

interface AnalysisRow {
  id: string
  reel_url: string
  shortcode: string
  overall_score: number
  created_at: string
  user_id: string | null
}

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: string
  banned: boolean
  banned_reason: string | null
  banned_at: string | null
  created_at: string
}

interface Announcement {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'success' | 'maintenance'
  active: boolean
  created_at: string
}

interface AISetting {
  id: string
  key: string
  value: string
  description: string | null
  updated_at: string
}

type Tab = 'overview' | 'analyses' | 'users' | 'announcements' | 'settings'

// ─── Shared UI ───

function StatCard({ icon: Icon, label, value, suffix, color, delay }: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  label: string
  value: number | string
  suffix?: string
  color: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card rounded-2xl p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {value}{suffix || ''}
      </div>
      <div className="text-xs mt-1" style={{ color: 'var(--text-quaternary)' }}>{label}</div>
    </motion.div>
  )
}

function SectionHeader({ icon: Icon, title, action }: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--divider)' }}>
      <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
        <Icon size={18} style={{ color: 'var(--accent-blue)' }} />
        {title}
      </h3>
      {action}
    </div>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{
      background: `${color}15`, color
    }}>
      {score}
    </span>
  )
}

function RoleBadge({ role }: { role: string }) {
  const color = role === 'admin' ? '#ef4444' : '#3b82f6'
  return (
    <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: `${color}15`, color }}>
      {role}
    </span>
  )
}

function EmptyState({ icon: Icon, message }: { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; message: string }) {
  return (
    <div className="p-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
      <Icon size={48} style={{ color: 'var(--text-quaternary)', margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
      <p className="text-sm">{message}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="p-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
      <div className="animate-spin w-8 h-8 border-2 rounded-full mx-auto mb-3" style={{ borderColor: 'var(--accent-blue)', borderTopColor: 'transparent' }} />
      <p className="text-sm">Loading...</p>
    </div>
  )
}

// ─── Chart Components ───

function GrowthChart({ data, label, color }: { data: number[]; label: string; color: string }) {
  const max = Math.max(...data, 1)
  const chartWidth = 100
  const chartHeight = 80

  const points = data.map((v, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * chartWidth,
    y: chartHeight - (v / max) * chartHeight,
    value: v,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</h3>
        <span className="text-xs" style={{ color: 'var(--text-quaternary)' }}>Last {data.length} days</span>
      </div>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" className="w-full" style={{ height: chartHeight }}>
        <defs>
          <linearGradient id={`chart-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#chart-${label.replace(/\s/g, '')})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 3px ${color}40)` }} />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={color} />
        ))}
      </svg>
      <div className="flex justify-between mt-2">
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{data[data.length - 1] || 0}</span>
        <span className="text-xs" style={{ color: 'var(--text-quaternary)' }}>peak: {max}</span>
      </div>
    </div>
  )
}

function RecentActivity({ activities }: { activities: { id: string; type: string; detail: string; time: string }[] }) {
  const typeIcons: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
    analysis: Database,
    user: Users,
    announcement: Megaphone,
    visitor: Globe,
  }
  const typeColors: Record<string, string> = {
    analysis: '#3b82f6',
    user: '#10b981',
    announcement: '#f59e0b',
    visitor: '#6366f1',
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <SectionHeader icon={Activity} title="Recent Activity" />
      {activities.length === 0 ? (
        <EmptyState icon={Activity} message="No recent activity" />
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--divider)' }}>
          {activities.map((act) => {
            const Icon = typeIcons[act.type] || Activity
            const color = typeColors[act.type] || '#3b82f6'
            return (
              <div key={act.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{act.detail}</div>
                  <div className="text-xs" style={{ color: 'var(--text-quaternary)' }}>{act.time}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Overview Tab ───

function OverviewTab({ stats, recentAnalyses, users, loading, onViewTab, recentActivity }: {
  stats: Stats | null
  recentAnalyses: AnalysisRow[]
  users: UserProfile[]
  loading: boolean
  onViewTab: (tab: Tab) => void
  recentActivity: { id: string; type: string; detail: string; time: string }[]
}) {
  const statCards = [
    { icon: BarChart3, label: 'Total Analyses', value: stats?.totalAnalyses ?? 0, color: '#3b82f6' },
    { icon: TrendingUp, label: 'Average Score', value: stats?.avgScore ?? 0, suffix: '/100', color: '#10b981' },
    { icon: Activity, label: 'Today', value: stats?.todayAnalyses ?? 0, color: '#6366f1' },
    { icon: Users, label: 'Total Users', value: stats?.totalUsers ?? 0, color: '#f59e0b' },
    { icon: UserCog, label: 'New Today', value: stats?.newUsersToday ?? 0, color: '#06b6d4' },
    { icon: Globe, label: 'Total Visitors', value: stats?.totalVisitors ?? 0, color: '#818cf8' },
    { icon: CheckCircle2, label: 'Active Users', value: stats?.activeUsers ?? 0, color: '#10b981' },
    { icon: Ban, label: 'Banned', value: stats?.bannedUsers ?? 0, color: '#ef4444' },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <StatCard key={stat.label} {...stat} delay={i * 0.06} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <GrowthChart data={stats?.analysisGrowth || [0, 0, 0, 0, 0, 0, 0]} label="Analysis Growth" color="#3b82f6" />
        <GrowthChart data={stats?.userGrowth || [0, 0, 0, 0, 0, 0, 0]} label="User Growth" color="#10b981" />
      </div>

      {/* Recent analyses + recent activity side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="glass-card rounded-2xl overflow-hidden">
          <SectionHeader
            icon={Database}
            title="Recent Analyses"
            action={<button onClick={() => onViewTab('analyses')} className="text-xs hover:underline cursor-pointer" style={{ color: 'var(--accent-blue)' }}>View All</button>}
          />
          {loading ? <LoadingState /> : recentAnalyses.length === 0 ? <EmptyState icon={Database} message="No analyses yet" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)', color: 'var(--text-tertiary)' }}>
                    <th className="px-4 py-3 text-left font-medium">Shortcode</th>
                    <th className="px-4 py-3 text-left font-medium">Score</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAnalyses.slice(0, 5).map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--divider)' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{row.shortcode}</td>
                      <td className="px-4 py-3"><ScoreBadge score={row.overall_score} /></td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(row.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <RecentActivity activities={recentActivity} />
      </div>

      {/* Recent users */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <SectionHeader
          icon={Users}
          title="Recent Users"
          action={<button onClick={() => onViewTab('users')} className="text-xs hover:underline cursor-pointer" style={{ color: 'var(--accent-blue)' }}>View All</button>}
        />
        {loading ? <LoadingState /> : users.length === 0 ? <EmptyState icon={Users} message="No users yet" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', color: 'var(--text-tertiary)' }}>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 5).map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--divider)' }}>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{u.email}</td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Analyses Tab ───

function AnalysesTab({ analyses, loading }: { analyses: AnalysisRow[]; loading: boolean }) {
  const [page, setPage] = useState(0)
  const pageSize = 10
  const pageCount = Math.ceil(analyses.length / pageSize)
  const paged = analyses.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden">
      <SectionHeader
        icon={Database}
        title="All Analyses"
        action={<span className="text-xs px-2.5 py-1 rounded-full badge-premium">{analyses.length} records</span>}
      />
      {loading ? <LoadingState /> : analyses.length === 0 ? <EmptyState icon={Database} message="No analyses yet" /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', color: 'var(--text-tertiary)' }}>
                  <th className="px-4 py-3 text-left font-medium">Shortcode</th>
                  <th className="px-4 py-3 text-left font-medium">Score</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">URL</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--divider)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{row.shortcode}</td>
                    <td className="px-4 py-3"><ScoreBadge score={row.overall_score} /></td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-tertiary)' }}>{new Date(row.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 hidden md:table-cell" style={{ color: 'var(--text-quaternary)' }}>
                      <a href={row.reel_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors truncate block max-w-xs">
                        {row.reel_url.slice(0, 40)}...
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageCount > 1 && (
            <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: '1px solid var(--divider)' }}>
              <span className="text-xs" style={{ color: 'var(--text-quaternary)' }}>
                Page {page + 1} of {pageCount}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 rounded-lg cursor-pointer disabled:opacity-30 transition-opacity"
                  style={{ background: 'var(--bg-badge)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                  disabled={page >= pageCount - 1}
                  className="p-2 rounded-lg cursor-pointer disabled:opacity-30 transition-opacity"
                  style={{ background: 'var(--bg-badge)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

// ─── Users Tab ───

function UsersTab({ users, loading, onBan, onUnban, onDelete, onRoleChange }: {
  users: UserProfile[]
  loading: boolean
  onBan: (user: UserProfile) => void
  onUnban: (userId: string) => void
  onDelete: (user: UserProfile) => void
  onRoleChange: (userId: string, role: 'user' | 'admin') => void
}) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState<'all' | 'admin' | 'banned' | 'active'>('all')
  const pageSize = 10

  const filtered = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(search.toLowerCase()) || (u.full_name?.toLowerCase().includes(search.toLowerCase()))
    if (!matchesSearch) return false
    if (filter === 'admin') return u.role === 'admin'
    if (filter === 'banned') return u.banned
    if (filter === 'active') return !u.banned
    return true
  })

  const pageCount = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize)

  const filterButtons: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'admin', label: 'Admins' },
    { key: 'banned', label: 'Banned' },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden">
      <SectionHeader
        icon={UserCog}
        title="User Management"
        action={<span className="text-xs px-2.5 py-1 rounded-full badge-premium">{filtered.length} users</span>}
      />

      {/* Search + filter bar */}
      <div className="px-5 py-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center" style={{ borderBottom: '1px solid var(--divider)' }}>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-quaternary)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search by email or name..."
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none input-premium"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filterButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => { setFilter(btn.key); setPage(0) }}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap"
              style={{
                background: filter === btn.key ? 'var(--accent-blue)' : 'var(--bg-badge)',
                color: filter === btn.key ? 'white' : 'var(--text-secondary)',
                border: filter === btn.key ? 'none' : '1px solid var(--border-primary)',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingState /> : filtered.length === 0 ? <EmptyState icon={Users} message="No users found" /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', color: 'var(--text-tertiary)' }}>
                  <th className="px-4 py-3 text-left font-medium">User</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Joined</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--divider)' }} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{
                          background: u.banned ? 'rgba(239,68,68,0.12)' : 'var(--bg-badge)',
                          color: u.banned ? '#ef4444' : 'var(--accent-blue)',
                          border: u.banned ? '1px solid rgba(239,68,68,0.25)' : '1px solid var(--border-primary)'
                        }}>
                          {(u.full_name?.[0] || u.email[0]).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate" style={{ color: u.banned ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                            {u.full_name || 'No name'} {u.banned && <span className="text-xs" style={{ color: '#ef4444' }}>(banned)</span>}
                          </div>
                          <div className="text-xs truncate" style={{ color: 'var(--text-quaternary)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3 hidden sm:table-cell" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {u.banned ? (
                          <button
                            onClick={() => onUnban(u.id)}
                            className="text-xs px-2 py-1 rounded-md cursor-pointer transition-colors flex items-center gap-1"
                            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
                          >
                            <CheckCircle2 size={12} />
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => onBan(u)}
                            className="text-xs px-2 py-1 rounded-md cursor-pointer transition-colors flex items-center gap-1"
                            style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
                          >
                            <Ban size={12} />
                            Ban
                          </button>
                        )}
                        {u.role !== 'admin' ? (
                          <button
                            onClick={() => onRoleChange(u.id, 'admin')}
                            className="text-xs px-2 py-1 rounded-md cursor-pointer transition-colors"
                            style={{ background: 'var(--bg-badge)', color: 'var(--accent-blue)' }}
                          >
                            Make Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => onRoleChange(u.id, 'user')}
                            className="text-xs px-2 py-1 rounded-md cursor-pointer transition-colors"
                            style={{ background: 'var(--bg-badge)', color: 'var(--text-tertiary)' }}
                          >
                            Demote
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(u)}
                          className="p-1.5 rounded-md cursor-pointer transition-colors"
                          style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}
                          aria-label="Delete user"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageCount > 1 && (
            <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: '1px solid var(--divider)' }}>
              <span className="text-xs" style={{ color: 'var(--text-quaternary)' }}>Page {page + 1} of {pageCount}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="p-2 rounded-lg cursor-pointer disabled:opacity-30 transition-opacity"
                  style={{ background: 'var(--bg-badge)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}
                  className="p-2 rounded-lg cursor-pointer disabled:opacity-30 transition-opacity"
                  style={{ background: 'var(--bg-badge)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

// ─── Announcements Tab ───

function AnnouncementsTab({ announcements, loading, onCreate, onEdit, onToggle, onDelete }: {
  announcements: Announcement[]
  loading: boolean
  onCreate: (title: string, content: string, type: Announcement['type']) => Promise<void>
  onEdit: (id: string, title: string, content: string, type: Announcement['type']) => Promise<void>
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Announcement | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<Announcement['type']>('info')
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    await onCreate(title, content, type)
    setSaving(false)
    setTitle('')
    setContent('')
    setType('info')
    setShowForm(false)
  }

  const handleEdit = async () => {
    if (!editTarget || !title.trim() || !content.trim()) return
    setSaving(true)
    await onEdit(editTarget.id, title, content, type)
    setSaving(false)
    setEditTarget(null)
    setTitle('')
    setContent('')
    setType('info')
  }

  const startEdit = (a: Announcement) => {
    setEditTarget(a)
    setTitle(a.title)
    setContent(a.content)
    setType(a.type)
    setShowForm(false)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditTarget(null)
    setTitle('')
    setContent('')
    setType('info')
  }

  const isEditing = !!editTarget
  const showEditor = showForm || isEditing

  const typeColors: Record<Announcement['type'], string> = {
    info: '#3b82f6',
    warning: '#f59e0b',
    success: '#10b981',
    maintenance: '#6366f1',
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="glass-card rounded-2xl overflow-hidden">
        <SectionHeader
          icon={Megaphone}
          title="Announcements"
          action={
            <button
              onClick={() => { setShowForm(!showForm); setEditTarget(null); if (!showForm) { setTitle(''); setContent(''); setType('info') } }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
              style={{ background: showForm ? 'var(--bg-badge)' : 'var(--accent-blue)', color: showForm ? 'var(--text-secondary)' : 'white', border: showForm ? '1px solid var(--border-primary)' : 'none' }}
            >
              {showForm ? <X size={14} /> : <Plus size={14} />}
              {showForm ? 'Cancel' : 'New'}
            </button>
          }
        />

        <AnimatePresence>
          {showEditor && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 py-4 space-y-3"
              style={{ borderBottom: '1px solid var(--divider)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                {isEditing && <Edit3 size={14} style={{ color: 'var(--accent-blue)' }} />}
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {isEditing ? 'Edit Announcement' : 'New Announcement'}
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement title..."
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none input-premium"
                style={{ color: 'var(--text-primary)' }}
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Announcement content..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none input-premium resize-none"
                style={{ color: 'var(--text-primary)' }}
              />
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex gap-1.5">
                  {(['info', 'warning', 'success', 'maintenance'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all capitalize"
                      style={{
                        background: type === t ? `${typeColors[t]}20` : 'var(--bg-badge)',
                        color: type === t ? typeColors[t] : 'var(--text-tertiary)',
                        border: type === t ? `1px solid ${typeColors[t]}40` : '1px solid var(--border-primary)',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={cancelForm} className="px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors" style={{ background: 'var(--bg-badge)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>
                    Cancel
                  </button>
                  <button
                    onClick={isEditing ? handleEdit : handleCreate}
                    disabled={saving || !title.trim() || !content.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all disabled:opacity-50 btn-premium text-white"
                  >
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    {isEditing ? 'Update' : 'Publish'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? <LoadingState /> : announcements.length === 0 ? <EmptyState icon={Megaphone} message="No announcements yet" /> : (
          <div className="divide-y" style={{ borderColor: 'var(--divider)' }}>
            {announcements.map((a) => (
              <div key={a.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: typeColors[a.type] }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{a.title}</span>
                      {!a.active && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-subtle)', color: 'var(--text-quaternary)' }}>inactive</span>}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{a.content}</p>
                    <div className="text-[10px] mt-1.5" style={{ color: 'var(--text-quaternary)' }}>
                      {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => startEdit(a)}
                    className="p-1.5 rounded-md cursor-pointer transition-colors"
                    style={{ background: 'var(--bg-badge)', color: 'var(--accent-blue)' }}
                    aria-label="Edit announcement"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => onToggle(a.id, !a.active)}
                    className="p-1.5 rounded-md cursor-pointer transition-colors"
                    style={{ background: 'var(--bg-badge)', color: a.active ? '#10b981' : 'var(--text-quaternary)' }}
                    aria-label={a.active ? 'Deactivate' : 'Activate'}
                  >
                    <Eye size={14} style={{ opacity: a.active ? 1 : 0.4 }} />
                  </button>
                  <button
                    onClick={() => onDelete(a.id)}
                    className="p-1.5 rounded-md cursor-pointer transition-colors"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}
                    aria-label="Delete announcement"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── AI Settings Tab ───

function SettingsTab({ settings, loading, onUpdate }: {
  settings: AISetting[]
  loading: boolean
  onUpdate: (key: string, value: string) => void
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const startEdit = (s: AISetting) => {
    setEditingKey(s.key)
    setEditValue(s.value)
  }

  const saveEdit = (key: string) => {
    onUpdate(key, editValue)
    setEditingKey(null)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden">
      <SectionHeader icon={Cpu} title="AI Prompts & Settings" action={<span className="text-xs px-2.5 py-1 rounded-full badge-premium">{settings.length} settings</span>} />
      {loading ? <LoadingState /> : settings.length === 0 ? <EmptyState icon={Cpu} message="No AI settings configured" /> : (
        <div className="divide-y" style={{ borderColor: 'var(--divider)' }}>
          {settings.map((s) => (
            <div key={s.id} className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <SettingsIcon size={14} style={{ color: 'var(--accent-blue)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.key}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px]" style={{ color: 'var(--text-quaternary)' }}>
                    Updated {new Date(s.updated_at).toLocaleDateString()}
                  </span>
                  {editingKey === s.key ? (
                    <button onClick={() => saveEdit(s.key)} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md cursor-pointer" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                      <Save size={12} /> Save
                    </button>
                  ) : (
                    <button onClick={() => startEdit(s)} className="text-xs px-2 py-1 rounded-md cursor-pointer" style={{ background: 'var(--bg-badge)', color: 'var(--accent-blue)' }}>
                      Edit
                    </button>
                  )}
                </div>
              </div>
              {s.description && <p className="text-xs mb-2" style={{ color: 'var(--text-quaternary)' }}>{s.description}</p>}
              {editingKey === s.key ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none input-premium resize-none"
                  style={{ color: 'var(--text-primary)' }}
                  autoFocus
                />
              ) : (
                <div className="text-sm font-mono px-3 py-2 rounded-lg" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-secondary)' }}>
                  {s.value}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ─── Ban Modal ───

function BanModal({ user, onClose, onConfirm }: {
  user: UserProfile
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card-premium rounded-2xl p-6 max-w-md w-full"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <Ban size={20} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Ban User</h3>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{user.email}</p>
          </div>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          This will prevent the user from signing in. Provide a reason for the ban.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for ban..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none input-premium resize-none mb-4"
          style={{ color: 'var(--text-primary)' }}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors" style={{ background: 'var(--bg-badge)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors text-white"
            style={{ background: '#f59e0b' }}
          >
            Ban User
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Delete Modal ───

function DeleteModal({ user, onClose, onConfirm }: {
  user: UserProfile
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card-premium rounded-2xl p-6 max-w-md w-full"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <Trash2 size={20} style={{ color: '#ef4444' }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Delete User</h3>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{user.email}</p>
          </div>
        </div>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          This will permanently delete the user account and all associated data. This action cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors" style={{ background: 'var(--bg-badge)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors text-white"
            style={{ background: '#ef4444' }}
          >
            Delete Permanently
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main AdminDashboard ───

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisRow[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [aiSettings, setAISettings] = useState<AISetting[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [banTarget, setBanTarget] = useState<UserProfile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null)
  const [recentActivity, setRecentActivity] = useState<{ id: string; type: string; detail: string; time: string }[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const fetchAdminData = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: analyses }, { data: profiles }, { data: anns }, { data: settings }, { count: visitorCount }, { count: visitorTodayCount }] = await Promise.all([
        supabase.from('analyses').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('ai_settings').select('*').order('updated_at', { ascending: false }),
        supabase.from('visitors').select('id', { count: 'exact', head: true }),
        supabase.from('visitors').select('id', { count: 'exact', head: true }).eq('session_date', new Date().toISOString().slice(0, 10)),
      ])

      // Build growth charts (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return d.toISOString().slice(0, 10)
      })

      const [analysisGrowthRes, userGrowthRes] = await Promise.all([
        supabase.from('analyses').select('created_at').gte('created_at', last7Days[0]),
        supabase.from('profiles').select('created_at').gte('created_at', last7Days[0]),
      ])

      const analysisGrowth = last7Days.map(date =>
        (analysisGrowthRes.data || []).filter(a => a.created_at.slice(0, 10) === date).length
      )
      const userGrowth = last7Days.map(date =>
        (userGrowthRes.data || []).filter(p => p.created_at.slice(0, 10) === date).length
      )

      const today = new Date().toDateString()
      const todayAnalyses = (analyses || []).filter(a => new Date(a.created_at).toDateString() === today).length
      const newUsersToday = (profiles || []).filter(p => new Date(p.created_at).toDateString() === today).length

      if (analyses && analyses.length > 0) {
        const totalAnalyses = analyses.length
        const avgScore = Math.round(analyses.reduce((sum, a) => sum + a.overall_score, 0) / totalAnalyses)

        setStats({
          totalAnalyses,
          avgScore,
          todayAnalyses,
          totalUsers: profiles?.length || 0,
          activeUsers: profiles?.filter(p => !p.banned).length || 0,
          bannedUsers: profiles?.filter(p => p.banned).length || 0,
          newUsersToday,
          totalVisitors: visitorCount || 0,
          todayVisitors: visitorTodayCount || 0,
          analysisGrowth,
          userGrowth,
        })
        setRecentAnalyses(analyses as AnalysisRow[])
      } else {
        setStats({ totalAnalyses: 0, avgScore: 0, todayAnalyses: 0, totalUsers: profiles?.length || 0, activeUsers: profiles?.filter(p => !p.banned).length || 0, bannedUsers: profiles?.filter(p => p.banned).length || 0, newUsersToday, totalVisitors: visitorCount || 0, todayVisitors: visitorTodayCount || 0, analysisGrowth, userGrowth })
        setRecentAnalyses([])
      }

      setUsers((profiles || []) as UserProfile[])
      setAnnouncements((anns || []) as Announcement[])
      setAISettings((settings || []) as AISetting[])

      // Build recent activity feed
      const activities: { id: string; type: string; detail: string; time: string; sortTime: number }[] = []
      ;(analyses || []).slice(0, 5).forEach(a => {
        activities.push({ id: a.id, type: 'analysis', detail: `Reel ${a.shortcode} analyzed — score ${a.overall_score}`, time: new Date(a.created_at).toLocaleString(), sortTime: new Date(a.created_at).getTime() })
      })
      ;(profiles || []).slice(0, 5).forEach(p => {
        activities.push({ id: p.id, type: 'user', detail: `${p.email} joined`, time: new Date(p.created_at).toLocaleString(), sortTime: new Date(p.created_at).getTime() })
      })
      ;(anns || []).slice(0, 3).forEach(a => {
        activities.push({ id: a.id, type: 'announcement', detail: `Announcement: ${a.title}`, time: new Date(a.created_at).toLocaleString(), sortTime: new Date(a.created_at).getTime() })
      })
      activities.sort((a, b) => b.sortTime - a.sortTime)
      setRecentActivity(activities.slice(0, 10).map(({ sortTime, ...rest }) => rest))
    } catch (err) {
      console.error('Error fetching admin data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) fetchAdminData()
  }, [isAdmin, fetchAdminData])

  const handleBan = async (reason: string) => {
    if (!banTarget) return
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ banned: true, banned_at: new Date().toISOString(), banned_reason: reason })
        .eq('id', banTarget.id)
      if (error) throw error
      setUsers(users.map(u => u.id === banTarget.id ? { ...u, banned: true, banned_reason: reason, banned_at: new Date().toISOString() } : u))
      showToast(`Banned ${banTarget.email}`)
    } catch (err) {
      console.error('Ban failed:', err)
      showToast('Failed to ban user')
    }
    setBanTarget(null)
  }

  const handleUnban = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ banned: false, banned_at: null, banned_reason: null })
        .eq('id', userId)
      if (error) throw error
      setUsers(users.map(u => u.id === userId ? { ...u, banned: false, banned_reason: null, banned_at: null } : u))
      showToast('User unbanned')
    } catch (err) {
      console.error('Unban failed:', err)
      showToast('Failed to unban user')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const { error } = await supabase.auth.admin.deleteUser(deleteTarget.id)
      if (error) throw error
      setUsers(users.filter(u => u.id !== deleteTarget.id))
      showToast(`Deleted ${deleteTarget.email}`)
    } catch (err) {
      console.error('Delete failed:', err)
      showToast('Failed to delete user')
    }
    setDeleteTarget(null)
  }

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)
      if (error) throw error
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
      showToast(`Role updated to ${newRole}`)
    } catch (err) {
      console.error('Role change failed:', err)
      showToast('Failed to update role')
    }
  }

  const handleCreateAnnouncement = async (title: string, content: string, type: Announcement['type']) => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert({ title, content, type, active: true, created_by: user?.id })
        .select()
        .single()
      if (error) throw error
      setAnnouncements([data as Announcement, ...announcements])
      showToast('Announcement published')
    } catch (err) {
      console.error('Create announcement failed:', err)
      showToast('Failed to create announcement')
    }
  }

  const handleToggleAnnouncement = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ active, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      setAnnouncements(announcements.map(a => a.id === id ? { ...a, active } : a))
    } catch (err) {
      console.error('Toggle failed:', err)
      showToast('Failed to update announcement')
    }
  }

  const handleEditAnnouncement = async (id: string, title: string, content: string, type: Announcement['type']) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ title, content, type, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      setAnnouncements(announcements.map(a => a.id === id ? { ...a, title, content, type } : a))
      showToast('Announcement updated')
    } catch (err) {
      console.error('Edit announcement failed:', err)
      showToast('Failed to update announcement')
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id)
      if (error) throw error
      setAnnouncements(announcements.filter(a => a.id !== id))
      showToast('Announcement deleted')
    } catch (err) {
      console.error('Delete announcement failed:', err)
      showToast('Failed to delete announcement')
    }
  }

  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('ai_settings')
        .update({ value, updated_by: user?.id, updated_at: new Date().toISOString() })
        .eq('key', key)
      if (error) throw error
      setAISettings(aiSettings.map(s => s.key === key ? { ...s, value, updated_at: new Date().toISOString() } : s))
      showToast(`Setting "${key}" updated`)
    } catch (err) {
      console.error('Setting update failed:', err)
      showToast('Failed to update setting')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="animate-spin w-8 h-8 border-2 rounded-full" style={{ borderColor: 'var(--accent-blue)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-8 text-center max-w-md">
          <AlertCircle size={48} className="mx-auto mb-4" style={{ color: '#ef4444' }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Authentication Required</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>Please sign in to access the admin dashboard.</p>
          <Link to="/login" className="inline-block px-6 py-2 rounded-xl font-semibold text-white text-sm btn-premium cursor-pointer">Sign In</Link>
        </motion.div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-8 text-center max-w-md">
          <AlertCircle size={48} className="mx-auto mb-4" style={{ color: '#ef4444' }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Access Denied</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>You don't have permission to access the admin dashboard.</p>
          <Link to="/" className="text-sm hover:underline" style={{ color: 'var(--accent-blue)' }}>Return Home</Link>
        </motion.div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'analyses', label: 'Analyses', icon: Database },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'settings', label: 'AI Settings', icon: Cpu },
  ]

  return (
    <div className="min-h-screen py-24 px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <Link to="/" className="inline-flex items-center gap-1 text-sm mb-4 hover:opacity-80 transition-opacity" style={{ color: 'var(--accent-blue)' }}>
            <ArrowLeft size={14} />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
              <Shield size={22} style={{ color: 'var(--accent-blue)' }} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Admin Dashboard</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>System analytics and management console</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap"
                style={{
                  background: activeTab === tab.id ? 'var(--accent-blue)' : 'var(--bg-badge)',
                  color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                  border: activeTab === tab.id ? 'none' : '1px solid var(--border-primary)',
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
          <button
            onClick={fetchAdminData}
            className="ml-auto p-2 rounded-xl cursor-pointer transition-colors"
            style={{ background: 'var(--bg-badge)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}
            aria-label="Refresh data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <OverviewTab stats={stats} recentAnalyses={recentAnalyses} users={users} loading={loading} onViewTab={setActiveTab} recentActivity={recentActivity} />
            </motion.div>
          )}
          {activeTab === 'analyses' && (
            <motion.div key="analyses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AnalysesTab analyses={recentAnalyses} loading={loading} />
            </motion.div>
          )}
          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <UsersTab
                users={users}
                loading={loading}
                onBan={(u) => setBanTarget(u)}
                onUnban={handleUnban}
                onDelete={(u) => setDeleteTarget(u)}
                onRoleChange={handleRoleChange}
              />
            </motion.div>
          )}
          {activeTab === 'announcements' && (
            <motion.div key="announcements" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AnnouncementsTab
                announcements={announcements}
                loading={loading}
                onCreate={handleCreateAnnouncement}
                onEdit={handleEditAnnouncement}
                onToggle={handleToggleAnnouncement}
                onDelete={handleDeleteAnnouncement}
              />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SettingsTab settings={aiSettings} loading={loading} onUpdate={handleUpdateSetting} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {banTarget && <BanModal user={banTarget} onClose={() => setBanTarget(null)} onConfirm={handleBan} />}
        {deleteTarget && <DeleteModal user={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium"
            style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
