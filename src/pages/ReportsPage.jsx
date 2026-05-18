import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ProductReportPage from './reports/ProductReportPage'
import TopSellingPage from './reports/ProductSalesPage'

export default function ReportsPage() {
  const { currentUser } = useAuth()
  const isSuperAdmin = currentUser?.user_type === 'SUPERADMIN'

  return (
    <Routes>
      <Route index element={<Navigate to="product-list" replace />} />
      <Route path="product-list" element={<ProductReportPage />} />
      <Route
        path="top-selling"
        element={isSuperAdmin ? <TopSellingPage /> : <Navigate to="product-list" replace />}
      />
    </Routes>
  )
}
