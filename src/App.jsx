import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { UserRightsProvider } from './contexts/UserRightsContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import ProductsPage from './pages/ProductsPage'
import DeletedItemsPage from './pages/DeletedItemsPage'
import ReportsPage from './pages/ReportsPage'
import AdminPage from './pages/AdminPage'

function AdminRoute({ children }) {
  const { currentUser } = useAuth()
  if (!['ADMIN', 'SUPERADMIN'].includes(currentUser?.user_type)) {
    return <Navigate to="/products" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UserRightsProvider>
          <Routes>
            <Route path="/login"         element={<LoginPage />} />
            <Route path="/register"      element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/" element={<Navigate to="/products" replace />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/products"        element={<ProductsPage />} />
              <Route path="/deleted-items"   element={<AdminRoute><DeletedItemsPage /></AdminRoute>} />
              <Route path="/reports/*"       element={<ReportsPage />} />
              <Route path="/admin"           element={<AdminRoute><AdminPage /></AdminRoute>} />
            </Route>
          </Routes>
        </UserRightsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
