import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AdminRoute({ children }) {
  const { currentUser } = useAuth()
  if (!['ADMIN', 'SUPERADMIN'].includes(currentUser?.user_type)) {
    return <Navigate to="/products" replace />
  }
  return children
}