import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const linkClass = ({ isActive }) =>
  `block px-4 py-2 rounded text-sm ${
    isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
  }`

export default function Sidebar() {
  const { currentUser } = useAuth()
  const isAdminOrSuper = ['ADMIN', 'SUPERADMIN'].includes(currentUser?.user_type)

  return (
    <aside className="w-52 bg-white border-r border-gray-200 flex flex-col gap-1 p-3 shrink-0">
      <p className="text-xs font-semibold text-gray-400 uppercase px-4 mb-1">Products</p>
      <NavLink to="/products" className={linkClass}>Product List</NavLink>

      {isAdminOrSuper && (
        <NavLink to="/deleted-items" className={linkClass}>Deleted Items</NavLink>
      )}

      <p className="text-xs font-semibold text-gray-400 uppercase px-4 mt-3 mb-1">Reports</p>
      <NavLink to="/reports/product-list" className={linkClass}>Product Report</NavLink>
      {currentUser?.user_type === 'SUPERADMIN' && (
        <NavLink to="/reports/top-selling" className={linkClass}>Top Selling</NavLink>
      )}

      {isAdminOrSuper && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase px-4 mt-3 mb-1">Admin</p>
          <NavLink to="/admin" className={linkClass}>Manage Users</NavLink>
        </>
      )}
    </aside>
  )
}
