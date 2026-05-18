import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useRights } from '../../contexts/UserRightsContext'

const linkClass = ({ isActive }) =>
  `block px-4 py-2 rounded-lg text-sm transition-colors ${
    isActive
      ? 'bg-blue-50 text-blue-700 font-medium'
      : 'text-gray-600 hover:bg-gray-100'
  }`

export default function Sidebar() {
  const { currentUser } = useAuth()
  const rights = useRights()

  const isAdminOrSuper = ['ADMIN', 'SUPERADMIN'].includes(currentUser?.user_type)
  const canSeeRep001   = rights.REP_001 === 1
  const canSeeRep002   = rights.REP_002 === 1
  const canSeeAdmin    = rights.ADM_USER === 1

  return (
    <aside className="w-52 bg-white border-r border-gray-200 flex flex-col gap-1 p-3 shrink-0">

      <p className="text-xs font-semibold text-gray-400 uppercase px-4 mb-1 mt-1">Products</p>
      <NavLink to="/products" className={linkClass}>Product List</NavLink>
      {isAdminOrSuper && (
        <NavLink to="/deleted-items" className={linkClass}>Deleted Items</NavLink>
      )}

      {(canSeeRep001 || canSeeRep002) && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase px-4 mt-3 mb-1">Reports</p>
          {canSeeRep001 && (
            <NavLink to="/reports/product-list" className={linkClass}>Product Report</NavLink>
          )}
          {canSeeRep002 && (
            <NavLink to="/reports/top-selling" className={linkClass}>Product Sales</NavLink>
          )}
        </>
      )}

      {canSeeAdmin && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase px-4 mt-3 mb-1">Admin</p>
          <NavLink to="/admin" className={linkClass}>Manage Users</NavLink>
        </>
      )}
    </aside>
  )
}
