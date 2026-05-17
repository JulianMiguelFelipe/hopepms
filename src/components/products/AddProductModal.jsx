import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { addProduct, addPriceEntry } from '../../services/productService'

const UNITS = ['pc', 'ea', 'mtr', 'pkg', 'ltr']

export default function AddProductModal({ onClose, onSaved }) {
  const { currentUser } = useAuth()
  const [form, setForm] = useState({
    prodCode: '', description: '', unit: 'ea', unitPrice: '', effDate: new Date().toISOString().slice(0, 10)
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const err = await addProduct(form, currentUser.id)
    if (err) { setError(err.message); setLoading(false); return }

    if (form.unitPrice && form.effDate) {
      await addPriceEntry(form.prodCode, form.effDate, parseFloat(form.unitPrice), currentUser.id)
    }

    onSaved()
    onClose()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">Add Product</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2 mb-3">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Product Code <span className="text-red-400">*</span></label>
            <input
              name="prodCode" required maxLength={6} placeholder="e.g. AK0010"
              value={form.prodCode} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Description <span className="text-red-400">*</span></label>
            <input
              name="description" required maxLength={30} placeholder="Max 30 characters"
              value={form.description} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Unit <span className="text-red-400">*</span></label>
            <select
              name="unit" value={form.unit} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div className="border-t border-gray-100 pt-3 mt-1">
            <p className="text-xs font-medium text-gray-500 mb-2">Initial Price <span className="text-gray-400">(optional)</span></p>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">Unit Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₱</span>
                  <input
                    name="unitPrice" type="number" step="0.01" min="0.01" placeholder="0.00"
                    value={form.unitPrice} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">Effective Date</label>
                <input
                  name="effDate" type="date"
                  value={form.effDate} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-2 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
