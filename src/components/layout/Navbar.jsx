import { useAuth } from '../../contexts/AuthContext'

export default function Navbar() {
  const { currentUser, signOut } = useAuth()

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <span className="font-semibold text-gray-800">Hope, Inc. — PMS</span>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {currentUser?.username} &nbsp;
          <span className="text-xs bg-gray-100 text-gray-500 rounded px-1 py-0.5">
            {currentUser?.user_type}
          </span>
        </span>
        <button
          onClick={signOut}
          className="text-sm text-red-500 hover:text-red-700"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
