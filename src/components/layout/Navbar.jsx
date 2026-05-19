import { useAuth } from '../../contexts/AuthContext'
import { getTheme } from './theme'

const IconLogout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const IconCrown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 19h20v2H2zM2 5l5 7 5-7 5 7 5-7v12H2V5z"/>
  </svg>
)

const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const ROLE_ICON = { SUPERADMIN: <IconCrown />, ADMIN: <IconShield />, USER: <IconUser /> }

export default function Navbar() {
  const { currentUser, signOut } = useAuth()
  const theme = getTheme(currentUser?.user_type)

  return (
    <header className={`h-14 ${theme.nav} border-b flex items-center justify-between px-5 shrink-0 z-10`}>
      {/* Logo / App name */}
      <div className="flex items-center gap-3">
        <div className={`w-7 h-7 ${theme.accent} rounded-lg flex items-center justify-center`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
        <div>
          <p className={`text-sm font-bold ${theme.navText} leading-tight`}>Hope, Inc.</p>
          <p className={`text-xs ${theme.navSub} leading-tight`}>Product Management System</p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Online indicator */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${theme.dot} animate-pulse`} />
          <span className={`text-xs ${theme.navSub} hidden sm:block`}>Online</span>
        </div>

        {/* Divider */}
        <div className={`w-px h-6 ${theme.border} border-l`} />

        {/* User info */}
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div className={`w-8 h-8 ${theme.accent} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {(currentUser?.firstName?.[0] || currentUser?.username?.[0] || '?').toUpperCase()}
          </div>

          {/* Name + role */}
          <div className="hidden sm:block">
            <p className={`text-xs font-semibold ${theme.navText} leading-tight`}>
              {currentUser?.firstName
                ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
                : currentUser?.username}
            </p>
            <div className="flex items-center gap-1">
              <span className={theme.accentText}>{ROLE_ICON[currentUser?.user_type]}</span>
              <span className={`text-xs ${theme.navSub}`}>{currentUser?.user_type}</span>
            </div>
          </div>

          {/* Role badge */}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${theme.navBadge} hidden md:block`}>
            {currentUser?.user_type}
          </span>
        </div>

        {/* Divider */}
        <div className={`w-px h-6 ${theme.border} border-l`} />

        {/* Sign out */}
        <button
          onClick={signOut}
          title="Sign out"
          className={`flex items-center gap-1.5 ${theme.navSub} hover:${theme.navText} transition-colors text-xs px-2 py-1.5 rounded-lg hover:bg-white/10`}>
          <IconLogout />
          <span className="hidden sm:block">Sign out</span>
        </button>
      </div>
    </header>
  )
}