import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  getAllUsers, getUserRights, getUserModules,
  updateUserInfo, activateUser, deactivateUser,
  updateUserType, updateRight,
} from '../services/userService'

// ── Constants ────────────────────────────────────────────────
const STATUS_BADGE = {
  ACTIVE:   'bg-green-100 text-green-700',
  INACTIVE: 'bg-red-100 text-red-600',
}
const TYPE_BADGE = {
  SUPERADMIN: 'bg-purple-100 text-purple-700',
  ADMIN:      'bg-blue-100 text-blue-700',
  USER:       'bg-gray-100 text-gray-600',
}
const RIGHTS_META = {
  PRD_ADD:  { label: 'Add Product',    module: 'Products' },
  PRD_EDIT: { label: 'Edit Product',   module: 'Products' },
  PRD_DEL:  { label: 'Delete Product', module: 'Products' },
  REP_001:  { label: 'Product Report', module: 'Reports'  },
  REP_002:  { label: 'Product Sales',  module: 'Reports'  },
  ADM_USER: { label: 'Manage Users',   module: 'Admin'    },
}
const MODULES_META = {
  Prod_Mod:   'Products Module',
  Report_Mod: 'Reports Module',
  Adm_Mod:    'Admin Module',
}

// ── Icons ────────────────────────────────────────────────────
const IconView = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const IconActivate = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconDeactivate = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconCrown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 19h20v2H2zM2 5l5 7 5-7 5 7 5-7v12H2V5z"/>
  </svg>
)

// ── Copy Button ──────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  return (
    <button onClick={copy} title="Copy" className="ml-1.5 text-gray-400 hover:text-blue-500 transition-colors">
      {copied
        ? <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      }
    </button>
  )
}

// ── Avatar ───────────────────────────────────────────────────
function Avatar({ user, size = 'md' }) {
  const s = size === 'lg' ? 'w-12 h-12 text-base' : 'w-8 h-8 text-xs'
  const colors = { SUPERADMIN: 'bg-purple-200 text-purple-700', ADMIN: 'bg-blue-200 text-blue-700', USER: 'bg-gray-200 text-gray-600' }
  return (
    <div className={`${s} ${colors[user.user_type] || 'bg-gray-200 text-gray-600'} rounded-full flex items-center justify-center font-bold shrink-0 relative`}>
      {(user.firstName?.[0] || user.username?.[0] || '?').toUpperCase()}
    </div>
  )
}

// ── Confirm Modal ────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
        <p className="text-sm text-gray-700 mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── User Details Side Panel ──────────────────────────────────
function UserDetailsPanel({ user, onClose, actorUsername, isSuperAdmin, onRefresh }) {
  const [rights, setRights]   = useState([])
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('profile')
  const [saving, setSaving]   = useState(null)
  const [roleLoading, setRoleLoading] = useState(false)

  // Edit form state
  const [editMode, setEditMode] = useState(false)
  const [form, setForm]         = useState({ firstName: user.firstName || '', lastName: user.lastName || '', username: user.username || '' })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError]     = useState('')

  const isProtected = user.user_type === 'SUPERADMIN'
  const canEdit     = isSuperAdmin && !isProtected

  useEffect(() => {
    Promise.all([getUserRights(user.userId), getUserModules(user.userId)]).then(([r, m]) => {
      setRights(r.data || [])
      setModules(m.data || [])
      setLoading(false)
    })
  }, [user.userId])

  const handleSaveEdit = async () => {
    setEditLoading(true)
    setEditError('')
    const { updateUserInfo } = await import('../services/userService')
    const err = await updateUserInfo(user.userId, form, actorUsername)
    if (err) setEditError(err.message)
    else { setEditMode(false); onRefresh() }
    setEditLoading(false)
  }

  const handleRoleChange = async newType => {
    setRoleLoading(true)
    await updateUserType(user.userId, newType, actorUsername)
    onRefresh()
    setRoleLoading(false)
  }

  const handleToggleRight = async (rightId, currentVal) => {
    setSaving(rightId)
    await updateRight(user.userId, rightId, currentVal === 1 ? 0 : 1, actorUsername)
    const { data } = await getUserRights(user.userId)
    setRights(data || [])
    setSaving(null)
  }

  const byModule = {}
  rights.forEach(r => {
    const mod = RIGHTS_META[r.Right_ID]?.module || 'Other'
    if (!byModule[mod]) byModule[mod] = []
    byModule[mod].push(r)
  })

  const stamp     = user.stamp || ''
  const auditLines = stamp ? [stamp] : []

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-end z-50">
      <div className="bg-white h-full w-full max-w-lg shadow-2xl flex flex-col">

        {/* Header */}
        <div className={`px-5 py-4 border-b shrink-0 ${isProtected ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar user={user} size="lg" />
                {isProtected && (
                  <div className="absolute -top-1.5 -right-1.5 bg-purple-600 text-white rounded-full p-0.5">
                    <IconCrown />
                  </div>
                )}
              </div>
              <div>
                {editMode ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1.5">
                      <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
                        placeholder="First name"
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-28 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
                        placeholder="Last name"
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-28 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                      placeholder="Username"
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    {editError && <p className="text-xs text-red-500">{editError}</p>}
                    <div className="flex gap-1.5 mt-0.5">
                      <button onClick={handleSaveEdit} disabled={editLoading}
                        className="bg-blue-600 text-white text-xs rounded px-3 py-1 hover:bg-blue-700 disabled:opacity-50">
                        {editLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => { setEditMode(false); setEditError('') }}
                        className="border border-gray-300 text-xs rounded px-3 py-1 hover:bg-gray-50">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <h3 className={`font-semibold ${isProtected ? 'text-purple-800' : 'text-gray-800'}`}>
                        {user.firstName} {user.lastName}
                      </h3>
                      {!isProtected && (
                        <button onClick={() => setEditMode(true)} title="Edit info"
                          className="text-gray-400 hover:text-blue-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      )}
                    </div>
                    <p className={`text-xs ${isProtected ? 'text-purple-500' : 'text-gray-400'}`}>@{user.username}</p>
                    <div className="flex gap-1.5 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[user.user_type]}`}>{user.user_type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[user.record_status]}`}>{user.record_status}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {isProtected && (
            <div className="mt-3 flex items-center gap-1.5 bg-purple-200/50 rounded-lg px-3 py-1.5">
              <IconCrown />
              <span className="text-xs font-medium text-purple-700">SUPERADMIN — Protected account. Cannot be modified.</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 shrink-0 bg-white">
          {['profile', 'permissions', 'audit'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-xs font-medium capitalize transition-colors border-b-2 ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t === 'profile' ? 'Profile' : t === 'permissions' ? 'Role & Permissions' : 'Audit Trail'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? <p className="text-xs text-gray-400">Loading...</p> : (

            tab === 'profile' ? (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Account Information</p>
                  <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-100">
                    {[
                      { label: 'First Name', value: user.firstName || '—' },
                      { label: 'Last Name',  value: user.lastName  || '—' },
                      { label: 'Username',   value: user.username  || '—' },
                      { label: 'Role',       value: user.user_type },
                      { label: 'Status',     value: user.record_status },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-xs text-gray-500">{label}</span>
                        <span className="text-xs font-medium text-gray-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">User ID</p>
                  <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 flex items-center">
                    <code className="text-xs text-gray-600 font-mono flex-1 break-all">{user.userId}</code>
                    <CopyButton text={user.userId} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Module Access</p>
                  <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-100">
                    {modules.map(m => (
                      <div key={m.Module_ID} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-xs text-gray-600">{MODULES_META[m.Module_ID] || m.Module_ID}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.rights_value === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                          {m.rights_value === 1 ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            ) : tab === 'permissions' ? (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Role</p>
                  {isProtected ? (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 flex items-center gap-2 text-xs text-purple-700">
                      <IconCrown /><span>SUPERADMIN role cannot be changed</span>
                    </div>
                  ) : !canEdit ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-400">
                      Only SUPERADMIN can change roles
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between">
                      <span className="text-xs text-gray-600">Current: <strong>{user.user_type}</strong></span>
                      <select defaultValue={user.user_type} onChange={e => handleRoleChange(e.target.value)}
                        disabled={roleLoading}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>
                  )}
                </div>

                {Object.entries(byModule).map(([mod, modRights]) => (
                  <div key={mod}>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{mod}</p>
                    <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-100">
                      {modRights.map(r => {
                        const meta    = RIGHTS_META[r.Right_ID]
                        const enabled = r.Right_value === 1
                        const isSaving= saving === r.Right_ID
                        return (
                          <div key={r.Right_ID} className="flex items-center justify-between px-4 py-3">
                            <div>
                              <p className="text-xs font-medium text-gray-700">{meta?.label || r.Right_ID}</p>
                              <p className="text-xs text-gray-400">{r.Right_ID}</p>
                            </div>
                            {isProtected || !canEdit ? (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                {enabled ? 'On' : 'Off'}
                              </span>
                            ) : (
                              <button onClick={() => handleToggleRight(r.Right_ID, r.Right_value)} disabled={isSaving}
                                className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${enabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

            ) : (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Audit Trail</p>
                <p className="text-xs text-gray-400 mb-3">
                  Records the most recent action performed on this account. Format: ACTION username date time.
                </p>
                {auditLines.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-6 text-center text-xs text-gray-400">No audit records yet.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {auditLines.map((line, i) => {
                      const parts  = line.split(' ')
                      const action = parts[0]
                      const rest   = parts.slice(1).join(' ')
                      const color  = action.includes('ACTIVATED') ? 'green' : action.includes('DEACTIVATED') ? 'red' : action.includes('ROLE') ? 'purple' : action.includes('EDITED') ? 'blue' : 'gray'
                      const colors = { green: 'bg-green-50 border-green-200 text-green-700', red: 'bg-red-50 border-red-200 text-red-600', purple: 'bg-purple-50 border-purple-200 text-purple-700', blue: 'bg-blue-50 border-blue-200 text-blue-700', gray: 'bg-gray-50 border-gray-200 text-gray-600' }
                      return (
                        <div key={i} className={`rounded-xl border px-4 py-3 ${colors[color]}`}>
                          <p className="text-xs font-semibold">{action}</p>
                          <p className="text-xs opacity-70 mt-0.5">{rest}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <p className="text-xs font-medium text-amber-700 mb-1">ℹ️ About Audit Stamps</p>
                  <p className="text-xs text-amber-600">
                    Product edits, price changes, and other actions are stamped in their respective tables (product, priceHist). The stamp here only reflects the last action on this user account. All stamps now record the username of who performed the action.
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main AdminPage ───────────────────────────────────────────
export default function AdminPage() {
  const { currentUser } = useAuth()

  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatus]   = useState('All')
  const [typeFilter, setType]       = useState('All')
  const [actionLoading, setActLoad] = useState(null)
  const [confirm, setConfirm]       = useState(null)
  const [detailTarget, setDetail]   = useState(null)
  const [error, setError]           = useState('')

  const isSuperAdmin = currentUser?.user_type === 'SUPERADMIN'
  const isAdmin      = currentUser?.user_type === 'ADMIN'

  const load = async () => {
    setLoading(true)
    const { data, error } = await getAllUsers()
    if (error) setError(error.message)
    else setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { if (currentUser) load() }, [currentUser])

  const canModify = u => {
    if (u.userId === currentUser?.userId) return false
    if (u.user_type === 'SUPERADMIN') return false
    if (isAdmin && u.user_type === 'ADMIN') return false
    return true
  }

  const handleActivate = u => setConfirm({
    message: `Activate account for ${u.username}? They will be able to log in.`,
    onConfirm: async () => {
      setActLoad(u.userId)
      const err = await activateUser(u.userId, currentUser.username)
      if (err) setError(err.message); else await load()
      setActLoad(null); setConfirm(null)
    }
  })

  const handleDeactivate = u => setConfirm({
    message: `Deactivate account for ${u.username}? They will no longer be able to log in.`,
    onConfirm: async () => {
      setActLoad(u.userId)
      const err = await deactivateUser(u.userId, currentUser.username)
      if (err) setError(err.message); else await load()
      setActLoad(null); setConfirm(null)
    }
  })

  const filtered = useMemo(() => users.filter(u => {
    const q = search.toLowerCase()
    return (u.username?.toLowerCase().includes(q) ||
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q) ||
      u.userId?.toLowerCase().includes(q)) &&
      (statusFilter === 'All' || u.record_status === statusFilter) &&
      (typeFilter   === 'All' || u.user_type     === typeFilter)
  }), [users, search, statusFilter, typeFilter])

  const total    = users.length
  const active   = users.filter(u => u.record_status === 'ACTIVE').length
  const inactive = users.filter(u => u.record_status === 'INACTIVE').length
  const pending  = users.filter(u => u.record_status === 'INACTIVE' && u.user_type === 'USER').length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Manage Users</h2>
          <p className="text-xs text-gray-400 mt-0.5">Activate, deactivate, and manage user accounts</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Users',        value: total,    color: 'blue'  },
          { label: 'Active',             value: active,   color: 'green' },
          { label: 'Inactive',           value: inactive, color: 'red'   },
          { label: 'Pending Activation', value: pending,  color: 'amber' },
        ].map(({ label, value, color }) => {
          const c = { blue: 'bg-blue-50 border-blue-100 text-blue-700', green: 'bg-green-50 border-green-100 text-green-700', red: 'bg-red-50 border-red-100 text-red-600', amber: 'bg-amber-50 border-amber-100 text-amber-700' }
          return (
            <div key={label} className={`rounded-xl border p-4 ${c[color]}`}>
              <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          )
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-3 flex items-center justify-between">
          {error}<button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-3">✕</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search by name, username or ID..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500">Status:</label>
          <select value={statusFilter} onChange={e => setStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500">Role:</label>
          <select value={typeFilter} onChange={e => setType(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All</option><option value="SUPERADMIN">SUPERADMIN</option><option value="ADMIN">ADMIN</option><option value="USER">USER</option>
          </select>
        </div>
        <p className="text-xs text-gray-400 ml-auto">{filtered.length} of {total} users</p>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading users...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-gray-500 text-xs uppercase">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Stamp</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No users found.</td></tr>
              )}
              {filtered.map(u => {
                const isSelf      = u.userId === currentUser?.userId
                const isProtected = u.user_type === 'SUPERADMIN'
                const modifiable  = canModify(u)
                const isLoading   = actionLoading === u.userId

                return (
                  <tr key={u.userId}
                    className={`border-t transition-colors ${
                      isProtected
                        ? 'bg-gradient-to-r from-purple-50/60 to-transparent border-purple-100'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}>

                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Avatar user={u} />
                          {isProtected && (
                            <div className="absolute -top-1 -right-1 bg-purple-600 text-white rounded-full p-0.5">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2 19h20v2H2zM2 5l5 7 5-7 5 7 5-7v12H2V5z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-800">
                            @{u.username}
                            {isSelf && <span className="ml-1 text-blue-500">(you)</span>}
                          </p>
                          <div className="flex items-center">
                            <p className="text-xs text-gray-400 font-mono">{u.userId.slice(0, 12)}...</p>
                            <CopyButton text={u.userId} />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Full Name */}
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {u.firstName || u.lastName
                        ? `${u.firstName || ''} ${u.lastName || ''}`.trim()
                        : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {isProtected && <IconCrown />}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[u.user_type] || 'bg-gray-100 text-gray-600'}`}>
                          {u.user_type}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[u.record_status] || ''}`}>
                        {u.record_status}
                      </span>
                    </td>

                    {/* Stamp */}
                    <td className="px-4 py-3 text-xs text-gray-400 max-w-[160px] truncate">{u.stamp || '—'}</td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 justify-center">
                        {/* Details button - always visible */}
                        <button onClick={() => setDetail(u)} title="View details"
                          className="bg-gray-600 hover:bg-gray-700 text-white rounded-lg p-1.5 transition-colors">
                          <IconView />
                        </button>

                        {/* Activate / Deactivate */}
                        {isProtected ? (
                          <div className="flex items-center px-1" title="SUPERADMIN accounts cannot be modified">
                            <IconCrown />
                          </div>
                        ) : isSelf ? (
                          <span className="text-xs text-gray-300 px-1">—</span>
                        ) : modifiable ? (
                          u.record_status === 'INACTIVE' ? (
                            <button onClick={() => handleActivate(u)} disabled={isLoading} title="Activate account"
                              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg p-1.5 transition-colors">
                              <IconActivate />
                            </button>
                          ) : (
                            <button onClick={() => handleDeactivate(u)} disabled={isLoading} title="Deactivate account"
                              className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg p-1.5 transition-colors">
                              <IconDeactivate />
                            </button>
                          )
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {detailTarget && (
        <UserDetailsPanel
          user={detailTarget}
          actorUsername={currentUser?.username}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setDetail(null)}
          onRefresh={load}
        />
      )}

      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
          loading={!!actionLoading}
        />
      )}
    </div>
  )
}