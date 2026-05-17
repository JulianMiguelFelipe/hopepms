import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRights } from '../../contexts/UserRightsContext'
import { getPriceHistory, addPriceEntry } from '../../services/productService'

export default function PriceHistoryPanel({ prodCode }) {
  const { currentUser } = useAuth()
  const rights = useRights()
  const [open, setOpen]       = useState(false)
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({ effDate: '', unitPrice: '' })
  const [adding, setAdding]   = useState(false)
  const [error, setError]     = useState('')

  const canEdit = rights.PRD_EDIT === 1

  const load = async () => {
    if (open) { setOpen(false); return }
    setLoading(true)
    const { data } = await getPriceHistory(prodCode)
    setRows(data || [])
    setLoading(false)
    setOpen(true)
  }

  const handleAdd = async e => {
    e.preventDefault()
    setError('')
    setAdding(true)
    const err = await addPriceEntry(
      prodCode, form.effDate,
      parseFloat(form.unitPrice),
      currentUser.id
    )
    if (err) {
      setError(err.message)
    } else {
      const { data } = await getPriceHistory(prodCode)
      setRows(data || [])
      setForm({ effDate: '', unitPrice: '' })
    }
    setAdding(false)
  }

  return (
    <div>
      <button
        onClick={load}
        className="text-xs text-blue-600 hover:underline"
      >
        {open ? 'Hide history' : 'Price history'}
      </button>

      {open && (
        <div className="mt-2 bg-gray-50 rounded border border-gray-200 p-3">
          {loading ? (
            <p className="text-xs text-gray-400">Loading...</p>
          ) : (
            <>
              <table className="w-full text-xs mb-3">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-1 pr-4">Eff. Date</th>
                    <th className="py-1 pr-4">Unit Price</th>
                    <th className="py-1">Stamp</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={3} className="text-gray-400 py-1">No price history.</td></tr>
                  )}
                  {rows.map(r => (
                    <tr key={r.effDate} className="border-t border-gray-100">
                      <td className="py-1 pr-4">{r.effDate}</td>
                      <td className="py-1 pr-4">{parseFloat(r.unitPrice).toFixed(2)}</td>
                      <td className="py-1 text-gray-400">{r.stamp || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {canEdit && (
                <form onSubmit={handleAdd} className="flex gap-2 items-end flex-wrap">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Eff. Date</label>
                    <input
                      type="date" required
                      value={form.effDate}
                      onChange={e => setForm({ ...form, effDate: e.target.value })}
                      className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Unit Price</label>
                    <input
                      type="number" step="0.01" min="0.01" required
                      value={form.unitPrice}
                      onChange={e => setForm({ ...form, unitPrice: e.target.value })}
                      className="border border-gray-300 rounded px-2 py-1 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit" disabled={adding}
                    className="bg-blue-600 text-white rounded px-3 py-1 text-xs hover:bg-blue-700 disabled:opacity-50"
                  >
                    {adding ? 'Adding...' : 'Add'}
                  </button>
                  {error && <p className="text-red-500 text-xs">{error}</p>}
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
