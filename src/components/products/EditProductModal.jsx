import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { updateProduct } from '../../services/productService'

const UNITS = ['pc', 'ea', 'mtr', 'pkg', 'ltr']

export default function EditProductModal({ product, onClose, onSaved }) {
  const { currentUser } = useAuth()
  const [form, setForm] = useState({
    prodCode:    product.prodCode,
    description: product.description,
    unit:        product.unit,
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await updateProduct(product.prodCode, {
      prodCode: form.prodCode, description: form.description, unit: form.unit,
    }, currentUser.username)
    if (err) setError(err.message)
    else { onSaved(); onClose() }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Edit Product</h3>
            <p className="text-xs text-gray-400 mt-0.5">Original code: {product.prodCode}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2 mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Product Code <span className="text-red-400">*</span></label>
            <input name="prodCode" required maxLength={6} value={form.prodCode} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Description <span className="text-red-400">*</span></label>
            <input name="description" required maxLength={30} value={form.description} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Unit <span className="text-red-400">*</span></label>
            <select name="unit" value={form.unit} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <p className="text-xs text-gray-400">To update price, use the Price History button on the product list.</p>
          <div className="flex gap-2 mt-2 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}