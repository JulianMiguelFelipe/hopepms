import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRights } from '../../contexts/UserRightsContext'
import { getPriceHistory, addPriceEntry } from '../../services/productService'

export default function PriceHistoryModal({ product, onClose, onPriceAdded }) {
  const { currentUser } = useAuth()
  const rights = useRights()
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState({ effDate: new Date().toISOString().slice(0, 10), unitPrice: '' })
  const [adding, setAdding]   = useState(false)
  const [error, setError]     = useState('')

  const canEdit = rights.PRD_EDIT === 1

  const load = async () => {
    setLoading(true)
    const { data } = await getPriceHistory(product.prodCode)
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleAdd = async e => {
    e.preventDefault()
    setError('')
    setAdding(true)
    const err = await addPriceEntry(product.prodCode, form.effDate, parseFloat(form.unitPrice), currentUser.username)
    if (err) {
      setError(err.message)
    } else {
      await load()
      setForm({ effDate: new Date().toISOString().slice(0, 10), unitPrice: '' })
      if (onPriceAdded) onPriceAdded()
    }
    setAdding(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Price History</h3>
            <p className="text-xs text-gray-400 mt-0.5">{product.prodCode} — {product.description}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-400">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">No price history yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr className="text-left text-xs uppercase text-gray-500">
                  <th className="px-5 py-3">Effective Date</th>
                  <th className="px-5 py-3 text-right">Unit Price</th>
                  <th className="px-5 py-3">Stamp</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.effDate} className={`border-t border-gray-100 ${i === 0 ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-5 py-3 text-gray-700">
                      {r.effDate}
                      {i === 0 && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">current</span>}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-800">
                      $ {parseFloat(r.unitPrice).toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">{r.stamp || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {canEdit && (
          <div className="border-t border-gray-200 px-5 py-4 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Add New Price Entry</p>
            {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
            <form onSubmit={handleAdd} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">Effective Date</label>
                <input type="date" required value={form.effDate}
                  onChange={e => setForm({ ...form, effDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">Unit Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input type="number" step="0.01" min="0.01" required placeholder="0.00"
                    value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <button type="submit" disabled={adding}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap">
                {adding ? 'Adding...' : '+ Add'}
              </button>
            </form>
          </div>
        )}

        <div className="px-5 py-3 border-t border-gray-200 flex justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  )
}