import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { updateProduct } from '../../services/productService'

const UNITS = ['pc', 'ea', 'mtr', 'pkg', 'ltr']

export default function EditProductModal({ product, onClose, onSaved }) {
  const { currentUser } = useAuth()
  const [form, setForm]     = useState({
    description: product.description,
    unit:        product.unit,
  })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await updateProduct(product.prodCode, form, currentUser.id)
    if (err) setError(err.message)
    else { onSaved(); onClose() }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-1">Edit Product</h3>
        <p className="text-xs text-gray-400 mb-4">{product.prodCode}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2 mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Description</label>
            <input
              name="description" required maxLength={30}
              value={form.description} onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Unit</label>
            <select
              name="unit" value={form.unit} onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div className="flex gap-2 mt-2 justify-end">
            <button
              type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
