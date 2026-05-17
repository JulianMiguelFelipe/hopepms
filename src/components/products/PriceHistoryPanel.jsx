import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRights } from '../../contexts/UserRightsContext'
import { getPriceHistory, addPriceEntry } from '../../services/productService'

export default function PriceHistoryPanel({ prodCode, onPriceAdded }) {
  const { currentUser } = useAuth()
  const rights = useRights()
  const [open, setOpen]       = useState(false)
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({ effDate: new Date().toISOString().slice(0, 10), unitPrice: '' })
  const [adding, setAdding]   = useState(false)
  const [error, setError]     = useState('')

  const canEdit = rights.PRD_EDIT === 1

  const load = async () => {
    setLoading(true)
    const { data } = await getPriceHistory(prodCode)
    setRows(data || [])
    setLoading(false)
  }

  const toggle = async () => {
    if (open) { setOpen(false); return }
    await load()
    setOpen(true)
  }

  const handleAdd = async e => {
    e.preventDefault()
    setError('')
    setAdding(true)
    const err = await addPriceEntry(prodCode, form.effDate, parseFloat(form.unitPrice), currentUser.id)
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
    <div>
      <button
        onClick={toggle}
        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
          open
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        {open ? 'Hide' : 'History'}
        <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden w-80">
          {/* Panel header */}
          <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Price History — {prodCode}</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {loading ? (
            <div className="px-4 py-6 text-center text-xs text-gray-400">Loading...</div>
          ) : (
            <>
              {/* Price rows */}
              <div className="max-h-48 overflow-y-auto">
                {rows.length === 0 ? (
                  <div className="px-4 py-4 text-center text-xs text-gray-400">No price history yet.</div>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-white border-b border-gray-100">
                      <tr className="text-gray-400 uppercase">
                        <th className="px-3 py-2 text-left">Eff. Date</th>
                        <th className="px-3 py-2 text-right">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={r.effDate} className={`border-t border-gray-50 ${i === 0 ? 'bg-blue-50' : ''}`}>
                          <td className="px-3 py-2 text-gray-600">
                            {r.effDate}
                            {i === 0 && <span className="ml-1.5 text-blue-500 text-xs font-medium">(current)</span>}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-gray-800">
                            ₱ {parseFloat(r.unitPrice).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Add new price */}
              {canEdit && (
                <div className="border-t border-gray-200 p-3 bg-gray-50">
                  <p className="text-xs font-medium text-gray-500 mb-2">Add New Price</p>
                  {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
                  <form onSubmit={handleAdd} className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 block mb-1">Eff. Date</label>
                        <input
                          type="date" required
                          value={form.effDate}
                          onChange={e => setForm({ ...form, effDate: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 block mb-1">Unit Price</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₱</span>
                          <input
                            type="number" step="0.01" min="0.01" required placeholder="0.00"
                            value={form.unitPrice}
                            onChange={e => setForm({ ...form, unitPrice: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg pl-5 pr-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit" disabled={adding}
                      className="w-full bg-blue-600 text-white rounded-lg py-1.5 text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {adding ? 'Adding...' : '+ Add Price Entry'}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
