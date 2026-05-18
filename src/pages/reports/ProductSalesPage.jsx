import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabaseClient'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
  Cell,
} from 'recharts'

// ── Colors ───────────────────────────────────────────────────
const BAR_COLORS = ['#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899','#ef4444','#f97316','#eab308','#22c55e','#14b8a6']

// ── CSV Helpers ──────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim())
  const header = lines[0].toLowerCase().replace(/\s/g, '').split(',')
  const codeIdx = header.findIndex(h => h.includes('prod') || h === 'code')
  const qtyIdx  = header.findIndex(h => h.includes('qty') || h.includes('quantity'))
  const dateIdx = header.findIndex(h => h.includes('date'))
  if (codeIdx === -1 || qtyIdx === -1 || dateIdx === -1)
    return { rows: [], error: 'CSV must have columns: prodCode, quantity, saleDate' }
  const rows = [], errors = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim())
    const prodCode = cols[codeIdx]
    const quantity = parseInt(cols[qtyIdx])
    const saleDate = cols[dateIdx]
    if (!prodCode || isNaN(quantity) || quantity < 1 || !saleDate) { errors.push(i); continue }
    rows.push({ prodCode, quantity, saleDate })
  }
  return { rows, errors }
}

function exportFilteredCSV(sales, from, to) {
  const filtered = sales.filter(s => {
    if (from && s.saleDate < from) return false
    if (to   && s.saleDate > to)   return false
    return true
  })
  if (!filtered.length) { alert('No sales data in that date range.'); return }
  const csv  = ['Sale ID,Product Code,Quantity,Sale Date',
    ...filtered.map(s => `${s.salesId},${s.prodCode},${s.quantity},${s.saleDate}`)].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `sales_${from||'all'}_to_${to||'all'}.csv`; a.click()
  URL.revokeObjectURL(url)
}

// ── Stat Card ────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50  border-blue-100  text-blue-700',
    green:  'bg-green-50 border-green-100 text-green-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
    amber:  'bg-amber-50 border-amber-100 text-amber-700',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

// ── Sales History Modal ──────────────────────────────────────
function SalesHistoryModal({ product, sales, onClose }) {
  const productSales = sales
    .filter(s => s.prodCode === product.prodCode)
    .sort((a, b) => b.saleDate.localeCompare(a.saleDate))

  const totalQty = productSales.reduce((s, r) => s + r.quantity, 0)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Sales History</h3>
            <p className="text-xs text-gray-400 mt-0.5">{product.prodCode} — {product.description}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="px-5 py-3 flex gap-4 border-b border-gray-100 bg-blue-50">
          <div className="text-xs text-blue-700">
            Total transactions: <strong>{productSales.length}</strong>
          </div>
          <div className="text-xs text-blue-700">
            Total units sold: <strong>{totalQty}</strong>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {productSales.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">No sales records found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr className="text-left text-xs uppercase text-gray-500">
                  <th className="px-5 py-3">Sale ID</th>
                  <th className="px-5 py-3">Sale Date</th>
                  <th className="px-5 py-3 text-right">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {productSales.map((s, i) => (
                  <tr key={s.salesId} className={`border-t border-gray-100 hover:bg-gray-50 ${i === 0 ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">#{s.salesId}</td>
                    <td className="px-5 py-3 text-gray-700">{s.saleDate}</td>
                    <td className="px-5 py-3 text-right font-bold text-gray-800">{s.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 flex justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────
export default function TopSellingPage() {
  const [allSales, setAllSales]         = useState([])
  const [products, setProducts]         = useState({})
  const [loading, setLoading]           = useState(true)
  const [uploading, setUploading]       = useState(false)
  const [uploadMsg, setUploadMsg]       = useState(null)
  const [uploadError, setUploadError]   = useState(null)
  const [showUpload, setShowUpload]     = useState(false)
  const [exportFrom, setExportFrom]     = useState('')
  const [exportTo, setExportTo]         = useState('')
  const [chartFrom, setChartFrom]       = useState('')
  const [chartTo, setChartTo]           = useState('')
  const [historyTarget, setHistoryTarget] = useState(null)
  const [prodSearch, setProdSearch]     = useState('')

  const loadData = async () => {
    setLoading(true)
    const [{ data: sales }, { data: prods }] = await Promise.all([
      supabase.from('salesDetail').select('salesId, prodCode, quantity, saleDate').order('saleDate'),
      supabase.from('product').select('prodCode, description, unit').eq('record_status', 'ACTIVE'),
    ])
    setAllSales(sales || [])
    const map = {}
    prods?.forEach(p => { map[p.prodCode] = p })
    setProducts(map)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const filteredSales = useMemo(() => allSales.filter(s => {
    if (chartFrom && s.saleDate < chartFrom) return false
    if (chartTo   && s.saleDate > chartTo)   return false
    return true
  }), [allSales, chartFrom, chartTo])

  // Bar chart data
  const barData = useMemo(() => {
    const map = {}
    filteredSales.forEach(s => { map[s.prodCode] = (map[s.prodCode] || 0) + s.quantity })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([code, qty]) => ({
        name:  code,
        label: products[code]?.description?.slice(0, 14) || code,
        qty,
      }))
  }, [filteredSales, products])

  // Line chart data
  const top5Codes = barData.slice(0, 5).map(d => d.name)
  const lineData  = useMemo(() => {
    const monthMap = {}
    filteredSales.forEach(s => {
      if (!top5Codes.includes(s.prodCode)) return
      const month = s.saleDate.slice(0, 7)
      if (!monthMap[month]) monthMap[month] = {}
      monthMap[month][s.prodCode] = (monthMap[month][s.prodCode] || 0) + s.quantity
    })
    return Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }))
  }, [filteredSales, top5Codes])

  // Product list with sales counts
  const productList = useMemo(() => {
    const map = {}
    filteredSales.forEach(s => {
      if (!map[s.prodCode]) map[s.prodCode] = { qty: 0, txCount: 0 }
      map[s.prodCode].qty     += s.quantity
      map[s.prodCode].txCount += 1
    })
    return Object.values(products)
      .map(p => ({ ...p, qty: map[p.prodCode]?.qty || 0, txCount: map[p.prodCode]?.txCount || 0 }))
      .sort((a, b) => b.qty - a.qty)
      .filter(p =>
        p.prodCode.toLowerCase().includes(prodSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(prodSearch.toLowerCase())
      )
  }, [filteredSales, products, prodSearch])

  // Stats
  const totalQty       = filteredSales.reduce((s, r) => s + r.quantity, 0)
  const totalTx        = filteredSales.length
  const uniqueProducts = new Set(filteredSales.map(s => s.prodCode)).size
  const topProduct     = barData[0]

  // Upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadMsg(null); setUploadError(null); setUploading(true)
    const text = await file.text()
    const { rows, error, errors } = parseCSV(text)
    if (error) { setUploadError(error); setUploading(false); e.target.value = ''; return }
    if (!rows.length) { setUploadError('No valid rows found.'); setUploading(false); e.target.value = ''; return }

    const codes = [...new Set(rows.map(r => r.prodCode))]
    const { data: existing } = await supabase.from('product').select('prodCode').in('prodCode', codes)
    const validCodes = new Set(existing?.map(p => p.prodCode) || [])
    const validRows  = rows.filter(r => validCodes.has(r.prodCode))
    const skipped    = rows.length - validRows.length

    if (!validRows.length) { setUploadError('No valid product codes found.'); setUploading(false); e.target.value = ''; return }

    const { error: insertError } = await supabase.from('salesDetail').insert(
      validRows.map(r => ({ prodCode: r.prodCode, quantity: r.quantity, saleDate: r.saleDate }))
    )
    if (insertError) {
      setUploadError(`Upload failed: ${insertError.message}`)
    } else {
      setUploadMsg(`✓ Imported ${validRows.length} records.${skipped ? ` Skipped ${skipped} invalid product codes.` : ''}`)
      await loadData()
      setShowUpload(false)
    }
    setUploading(false); e.target.value = ''
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Product Sales</h2>
          <p className="text-xs text-gray-400 mt-0.5">REP_002 — Sales analytics and trend reports</p>
        </div>
        <button onClick={() => { setShowUpload(v => !v); setUploadMsg(null); setUploadError(null) }}
          className="flex items-center gap-1.5 bg-blue-600 text-white rounded-lg px-3 py-2 text-sm hover:bg-blue-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Upload Sales CSV
        </button>
      </div>

      {/* Upload Panel */}
      {showUpload && (
        <div className="bg-white border border-blue-200 rounded-xl p-5 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Upload Sales Data</h3>
          <p className="text-xs text-gray-400 mb-3">
            CSV must have columns: <code className="bg-gray-100 px-1 rounded">prodCode</code>, <code className="bg-gray-100 px-1 rounded">quantity</code>, <code className="bg-gray-100 px-1 rounded">saleDate</code> (YYYY-MM-DD).
          </p>
          <div className="flex gap-3 items-center flex-wrap">
            <label className={`flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg px-4 py-3 text-sm text-gray-600 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {uploading ? 'Uploading...' : 'Choose CSV file'}
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
          {uploadMsg   && <p className="mt-3 text-green-600 text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-2">{uploadMsg}</p>}
          {uploadError && <p className="mt-3 text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{uploadError}</p>}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-4 flex flex-wrap gap-3 items-center">
        <span className="text-xs text-gray-500 font-medium">Filter by date:</span>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-400">From:</label>
          <input type="date" value={chartFrom} onChange={e => setChartFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-400">To:</label>
          <input type="date" value={chartTo} onChange={e => setChartTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {(chartFrom || chartTo) && (
          <button onClick={() => { setChartFrom(''); setChartTo('') }}
            className="text-xs text-gray-400 hover:text-red-500 underline">Clear</button>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
          <span className="text-xs text-gray-500 font-medium">Export:</span>
          <input type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={exportTo} onChange={e => setExportTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={() => exportFilteredCSV(allSales, exportFrom, exportTo)}
            className="flex items-center gap-1.5 bg-gray-700 text-white rounded-lg px-3 py-1.5 text-xs hover:bg-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading sales data...</p>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard label="Total Units Sold"    value={totalQty.toLocaleString()} sub={chartFrom || chartTo ? 'filtered range' : 'all time'} color="blue" />
            <StatCard label="Total Transactions"  value={totalTx.toLocaleString()}  sub="sales records"      color="purple" />
            <StatCard label="Products Sold"       value={uniqueProducts}             sub="distinct products"  color="green" />
            <StatCard label="Top Product"         value={topProduct?.label || '—'}  sub={topProduct ? `${topProduct.qty} units` : ''} color="amber" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Bar Chart */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Top 10 Products by Sales</h3>
              <p className="text-xs text-gray-400 mb-4">Units sold per product</p>
              {barData.length === 0
                ? <div className="h-48 flex items-center justify-center text-xs text-gray-300">No data</div>
                : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="qty" name="Units Sold" radius={[4, 4, 0, 0]}>
                        {barData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </div>

            {/* Line Chart */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Sales Trend Over Time</h3>
              <p className="text-xs text-gray-400 mb-4">Monthly units — top 5 products</p>
              {lineData.length === 0
                ? <div className="h-48 flex items-center justify-center text-xs text-gray-300">No data</div>
                : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={lineData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                      {top5Codes.map((code, i) => (
                        <Line key={code} type="monotone" dataKey={code}
                          name={products[code]?.description?.slice(0, 14) || code}
                          stroke={BAR_COLORS[i]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
            </div>
          </div>

          {/* Product List with Sales */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Product Sales List</h3>
                <p className="text-xs text-gray-400">All products with total sales — click View to see transaction history</p>
              </div>
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" placeholder="Search products..."
                  value={prodSearch} onChange={e => setProdSearch(e.target.value)}
                  className="border border-gray-300 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                />
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs uppercase text-gray-500">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3 text-right">Transactions</th>
                  <th className="px-4 py-3 text-right">Total Units Sold</th>
                  <th className="px-4 py-3 text-center">History</th>
                </tr>
              </thead>
              <tbody>
                {productList.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-400">No products found.</td></tr>
                )}
                {productList.map((p, i) => (
                  <tr key={p.prodCode} className={`border-t border-gray-100 hover:bg-gray-50 transition-colors ${i === 0 && p.qty > 0 ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs font-medium text-gray-700">{p.prodCode}</td>
                    <td className="px-4 py-3 text-gray-800">{p.description}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{p.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{p.txCount}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">
                      {p.qty > 0
                        ? <span className="text-blue-700">{p.qty}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setHistoryTarget(p)}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg px-3 py-1 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {historyTarget && (
        <SalesHistoryModal
          product={historyTarget}
          sales={filteredSales}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  )
}