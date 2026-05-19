import { useEffect, useState, useMemo } from 'react'
import { getProductReport, getPriceHistory } from '../../services/reportService'

// ── SVG Line Chart ───────────────────────────────────────────
function LineChart({ data, width = 600, height = 200 }) {
  if (!data || data.length < 2) return (
    <div className="flex items-center justify-center h-full text-xs text-gray-400">
      Not enough data points
    </div>
  )

  const padding = { top: 16, right: 16, bottom: 32, left: 56 }
  const chartW  = width  - padding.left - padding.right
  const chartH  = height - padding.top  - padding.bottom

  const prices = data.map(d => parseFloat(d.unitPrice))
  const minP   = Math.min(...prices)
  const maxP   = Math.max(...prices)
  const range  = maxP - minP || 1

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top  + (1 - (parseFloat(d.unitPrice) - minP) / range) * chartH,
    price:   d.unitPrice,
    effDate: d.effDate,
  }))

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')
  const area     = [
    `${points[0].x},${padding.top + chartH}`,
    ...points.map(p => `${p.x},${p.y}`),
    `${points[points.length - 1].x},${padding.top + chartH}`,
  ].join(' ')

  const yTicks = 4
  const xTicks = Math.min(data.length, 6)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      {/* Grid lines */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const y = padding.top + (i / yTicks) * chartH
        const val = maxP - (i / yTicks) * range
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={padding.left + chartW} y2={y}
              stroke="#f3f4f6" strokeWidth="1" />
            <text x={padding.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
              ${val.toFixed(0)}
            </text>
          </g>
        )
      })}

      {/* X axis labels */}
      {Array.from({ length: xTicks }, (_, i) => {
        const idx = Math.round((i / (xTicks - 1)) * (data.length - 1))
        const p   = points[idx]
        return (
          <text key={i} x={p.x} y={height - 6} textAnchor="middle" fontSize="9" fill="#9ca3af">
            {data[idx].effDate}
          </text>
        )
      })}

      {/* Area fill */}
      <polygon points={area} fill="#3b82f6" fillOpacity="0.08" />

      {/* Line */}
      <polyline points={polyline} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" stroke="white" strokeWidth="1.5">
          <title>${parseFloat(p.price).toFixed(2)} on {p.effDate}</title>
        </circle>
      ))}
    </svg>
  )
}

// ── Stat Card ────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50  border-blue-100  text-blue-700',
    green:  'bg-green-50 border-green-100 text-green-700',
    amber:  'bg-amber-50 border-amber-100 text-amber-700',
    red:    'bg-red-50   border-red-100   text-red-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Sort Icon ────────────────────────────────────────────────
const IconSort = ({ dir }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 inline ml-1" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {dir === 'asc'  && <polyline points="18 15 12 9 6 15"/>}
    {dir === 'desc' && <polyline points="6 9 12 15 18 9"/>}
    {!dir && <><polyline points="18 15 12 9 6 15" opacity="0.3"/><polyline points="6 9 12 15 18 9" opacity="0.3"/></>}
  </svg>
)

function exportToCSV(rows) {
  const headers = ['Code', 'Description', 'Unit', 'Current Price', 'Price Date']
  const csvRows = rows.map(p => [
    p.prodCode, `"${p.description}"`, p.unit,
    parseFloat(p.unitPrice).toFixed(2), p.effDate
  ])
  const csv  = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `product_report_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const UNITS = ['All', 'pc', 'ea', 'mtr', 'pkg', 'ltr']

export default function ProductReportPage() {
  const [rows, setRows]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [unitFilter, setUnit]       = useState('All')
  const [sortCol, setSortCol]       = useState('prodCode')
  const [sortDir, setSortDir]       = useState('asc')
  const [entriesInput, setEntries]  = useState('')
  const [page, setPage]             = useState(1)

  // Chart state
  const [selectedProd, setSelectedProd]   = useState('')
  const [chartData, setChartData]         = useState([])
  const [chartLoading, setChartLoading]   = useState(false)

  const pageSize = entriesInput === '' ? null : Math.max(1, parseInt(entriesInput) || 10)

  useEffect(() => {
    getProductReport().then(({ data, error }) => {
      if (error) console.error('Report error:', error)
      setRows(data || [])
      setLoading(false)
    })
  }, [])

  // Load chart data when product selected
  useEffect(() => {
    if (!selectedProd) { setChartData([]); return }
    setChartLoading(true)
    getPriceHistory(selectedProd).then(({ data }) => {
      setChartData(data || [])
      setChartLoading(false)
    })
  }, [selectedProd])

  useEffect(() => { setPage(1) }, [search, unitFilter, sortCol, sortDir, entriesInput])

  const handleSort = col => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    let r = rows.filter(p => {
      const matchSearch =
        p.prodCode.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      const matchUnit = unitFilter === 'All' || p.unit === unitFilter
      return matchSearch && matchUnit
    })
    return [...r].sort((a, b) => {
      const aVal = sortCol === 'unitPrice'
        ? parseFloat(a.unitPrice || 0)
        : (a[sortCol] || '').toString().toLowerCase()
      const bVal = sortCol === 'unitPrice'
        ? parseFloat(b.unitPrice || 0)
        : (b[sortCol] || '').toString().toLowerCase()
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [rows, search, unitFilter, sortCol, sortDir])

  const paginated  = pageSize ? filtered.slice((page - 1) * pageSize, page * pageSize) : filtered
  const totalPages = pageSize ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1

  // Stats
  const prices    = filtered.map(p => parseFloat(p.unitPrice || 0))
  const avgPrice  = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
  const maxPrice  = prices.length ? Math.max(...prices) : 0
  const minPrice  = prices.length ? Math.min(...prices) : 0
  const highProd  = filtered.find(p => parseFloat(p.unitPrice) === maxPrice)
  const lowProd   = filtered.find(p => parseFloat(p.unitPrice) === minPrice)

  const SortTh = ({ col, label }) => (
    <th className="px-4 py-3 cursor-pointer select-none hover:bg-gray-100 whitespace-nowrap"
      onClick={() => handleSort(col)}>
      {label}<IconSort dir={sortCol === col ? sortDir : null} />
    </th>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Product Report</h2>
          <p className="text-xs text-gray-400 mt-0.5">REP_001 — Full product listing with current prices</p>
        </div>
        <button onClick={() => exportToCSV(filtered)}
          className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>
      </div>

      {/* Stat Cards */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard
            label="Total Products"
            value={filtered.length}
            sub={unitFilter !== 'All' ? `filtered by ${unitFilter}` : 'in database'}
            color="blue"
          />
          <StatCard
            label="Average Price"
            value={`$${avgPrice.toFixed(2)}`}
            sub="across filtered products"
            color="purple"
          />
          <StatCard
            label="Highest Price"
            value={`$${maxPrice.toFixed(2)}`}
            sub={highProd?.description || ''}
            color="green"
          />
          <StatCard
            label="Lowest Price"
            value={`$${minPrice.toFixed(2)}`}
            sub={lowProd?.description || ''}
            color="amber"
          />
        </div>
      )}

      {/* Price Trend Chart */}
      {!loading && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Price Trend</h3>
              <p className="text-xs text-gray-400">Select a product to view its price history</p>
            </div>
            <select
              value={selectedProd}
              onChange={e => setSelectedProd(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
            >
              <option value="">— Select a product —</option>
              {rows.map(p => (
                <option key={p.prodCode} value={p.prodCode}>
                  {p.prodCode} — {p.description}
                </option>
              ))}
            </select>
          </div>

          <div className="h-48">
            {!selectedProd ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-300 border-2 border-dashed border-gray-100 rounded-lg">
                Select a product above to see its price trend
              </div>
            ) : chartLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                Loading chart...
              </div>
            ) : (
              <LineChart data={chartData} height={192} />
            )}
          </div>

          {/* Trend summary */}
          {chartData.length >= 2 && (
            <div className="mt-2 flex gap-4 text-xs text-gray-500 border-t border-gray-100 pt-2">
              <span>First: <strong>${parseFloat(chartData[0].unitPrice).toFixed(2)}</strong> on {chartData[0].effDate}</span>
              <span>Latest: <strong>${parseFloat(chartData[chartData.length - 1].unitPrice).toFixed(2)}</strong> on {chartData[chartData.length - 1].effDate}</span>
              {(() => {
                const diff = parseFloat(chartData[chartData.length - 1].unitPrice) - parseFloat(chartData[0].unitPrice)
                const pct  = (diff / parseFloat(chartData[0].unitPrice)) * 100
                return (
                  <span className={diff >= 0 ? 'text-green-600' : 'text-red-500'}>
                    {diff >= 0 ? '▲' : '▼'} ${Math.abs(diff).toFixed(2)} ({Math.abs(pct).toFixed(1)}%)
                  </span>
                )
              })()}
              <span className="text-gray-400">{chartData.length} data point{chartData.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search code or description..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 whitespace-nowrap">Unit:</label>
          <select value={unitFilter} onChange={e => setUnit(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 whitespace-nowrap">Show:</label>
          <input type="number" min="1" placeholder="All"
            value={entriesInput} onChange={e => setEntries(e.target.value)}
            className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-400">entries</span>
        </div>
      </div>

      {/* Summary */}
      <p className="text-xs text-gray-400 mb-2">
        Showing {filtered.length === 0 ? 0 : (page - 1) * (pageSize || filtered.length) + 1}–{Math.min(page * (pageSize || filtered.length), filtered.length)} of {filtered.length} product{filtered.length !== 1 ? 's' : ''}
        {search || unitFilter !== 'All' ? ' (filtered)' : ''}
      </p>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading report...</p>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-gray-500 text-xs uppercase">
                  <SortTh col="prodCode"    label="Code" />
                  <SortTh col="description" label="Description" />
                  <SortTh col="unit"        label="Unit" />
                  <SortTh col="unitPrice"   label="Current Price" />
                  <SortTh col="effDate"     label="Price Date" />
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No products found.</td></tr>
                )}
                {paginated.map(p => (
                  <tr key={p.prodCode}
                    onClick={() => setSelectedProd(p.prodCode)}
                    className={`border-t border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer ${selectedProd === p.prodCode ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs font-medium text-gray-700">{p.prodCode}</td>
                    <td className="px-4 py-3 text-gray-800">{p.description}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{p.unit}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      $ {parseFloat(p.unitPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{p.effDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          {filtered.length > 0 && (
            <div className="mt-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 flex flex-wrap gap-4 items-center">
              <span className="text-xs text-gray-500">Total: <strong>{filtered.length}</strong></span>
              <span className="text-xs text-gray-500">Avg: <strong>$ {avgPrice.toFixed(2)}</strong></span>
              <span className="text-xs text-gray-500">Highest: <strong>$ {maxPrice.toFixed(2)}</strong></span>
              <span className="text-xs text-gray-500">Lowest: <strong>$ {minPrice.toFixed(2)}</strong></span>
              <span className="text-xs text-gray-400 ml-auto italic">Click a row to view its price trend ↑</span>
            </div>
          )}

          {/* Pagination */}
          {pageSize && totalPages > 1 && (
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(1)} disabled={page === 1}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40">«</button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40">‹</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.min(Math.max(page - 2, 1) + i, totalPages)
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`px-2 py-1 text-xs border rounded ${page === p
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'}`}>{p}</button>
                  )
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40">›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40">»</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}