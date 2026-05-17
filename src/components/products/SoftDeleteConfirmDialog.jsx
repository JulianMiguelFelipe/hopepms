import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { softDeleteProduct } from '../../services/productService'

export default function SoftDeleteConfirmDialog({ product, onClose, onDeleted }) {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleConfirm = async () => {
    setLoading(true)
    const err = await softDeleteProduct(product.prodCode, currentUser.id)
    if (err) setError(err.message)
    else { onDeleted(); onClose() }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-2">Delete Product?</h3>
        <p className="text-sm text-gray-600 mb-1">
          This will deactivate <strong>{product.prodCode}</strong> — {product.description}.
        </p>
        <p className="text-xs text-gray-400 mb-4">
          The product will be hidden from all users. ADMIN and SUPERADMIN can recover it later.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2 mb-3">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm} disabled={loading}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
