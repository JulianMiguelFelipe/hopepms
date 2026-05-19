import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useRights } from '../../contexts/UserRightsContext'

const linkClass = ({ isActive }) =>
  `group flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
    isActive
      ? 'bg-blue-50/70 text-blue-600 after:absolute after:left-0 after:top-2 after:bottom-2 after:w-1 after:bg-blue-600 after:rounded-r-md'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
  }`

export default function Sidebar() {
  const { currentUser } = useAuth()
  const rights = useRights()

  const isAdminOrSuper = ['ADMIN', 'SUPERADMIN'].includes(currentUser?.user_type)
  const canSeeRep001   = rights.REP_001 === 1
  const canSeeRep002   = rights.REP_002 === 1
  const canSeeAdmin    = rights.ADM_USER === 1

  return (
    <aside className="w-60 h-screen bg-white border-r border-gray-100 flex flex-col gap-1.5 p-4 shrink-0 shadow-sm select-none">
      
      {/* Products Section */}
      <div>
        <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase px-4 mb-2">
          Products
        </p>
        <div className="flex flex-col gap-1">
          <NavLink to="/products" className={linkClass}>
            Product List
          </NavLink>
          {isAdminOrSuper && (
            <NavLink to="/deleted-items" className={linkClass}>
              Deleted Items
            </NavLink>
          )}
        </div>
      </div>

      {/* Reports Section */}
      {(canSeeRep001 || canSeeRep002) && (
        <div className="mt-4">
          <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase px-4 mb-2">
            Reports
          </p>
          <div className="flex flex-col gap-1">
            {canSeeRep001 && (
              <NavLink to="/reports/product-list" className={linkClass}>
                Product Report
              </NavLink>
            )}
            {canSeeRep002 && (
              <NavLink to="/reports/top-selling" className={linkClass}>
                Product Sales
              </NavLink>
            )}
          </div>
        </div>
      )}

      {/* Admin Section */}
      {canSeeAdmin && (
        <div className="mt-4">
          <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase px-4 mb-2">
            Admin
          </p>
          <div className="flex flex-col gap-1">
            <NavLink to="/admin" className={linkClass}>
              Manage Users
            </NavLink>
          </div>
        </div>
      )}
      
    </aside>
  )
}