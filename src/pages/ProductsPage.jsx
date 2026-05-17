import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRights } from '../contexts/UserRightsContext'
import { getProducts, getCurrentPrices } from '../services/productService'
import AddProductModal from '../components/products/AddProductModal'
import EditProductModal from '../components/products/EditProductModal'
import SoftDeleteConfirmDialog from '../components/products/SoftDeleteConfirmDialog'
import PriceHistoryPanel from '../components/products/PriceHistoryPanel'

const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

const IconSort = ({ dir }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 inline ml-1" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {dir === 'asc'  && <polyline points="18 15 12 9 6 15"/>}
    {dir === 'desc' && <polyline points="6 9 12 15 18 9"/>}
    {!dir && <><polyline points="18 15 12 9 6 15" opacity="0.3"/><polyline points="6 9 12 15 18 9" opacity="0.3"/></>}
  </svg>
)

const UNITS = ['All', 'pc', 'ea', 'mtr', 'pkg', 'ltr']

function exportToCSV(rows, prices, showStamp) {
  const headers = ['Code', 'Description', 'Unit', 'Current Price', ...(showStamp ? ['Stamp'] : [])]
  const csvRows = rows.map(p => [
    p.prodCode,
    `"${p.description}"`,
    p.unit,
    prices[p.prodCode] != null ? parseFloat(prices[p.prodCode]).toFixed(2) : '',
    ...(showStamp ? [`"${p.stamp || ''}"`] : [])
  ])
  const csv = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `products_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ProductsPage() {
  const { currentUser } = useAuth()
  const rights = useRights()

  const [products, setProducts]         = useState([])
  const [prices, setPrices]             = useState({})
  const [loading, setLoading]           = useState(true)
  const [showAdd, setShowAdd]           = useState(false)
  const [editTarget, setEditTarget]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const [search, setSearch]         = useState('')
  const [unitFilter, setUnitFilter] = useState('All')
  const [sortCol, setSortCol]       = useState('prodCode')
  const [sortDir, setSortDir]       = useState('asc')
  const [entriesInput, setEntriesInput] = useState('')
  const [page, setPage]             = useState(1)

  const showStamp = ['ADMIN', 'SUPERADMIN'].includes(currentUser?.user_type)
  const canAdd    = rights.PRD_ADD  === 1
  const canEdit   = rights.PRD_EDIT === 1
  const canDelete = rights.PRD_DEL  === 1

  const pageSize = entriesInput === '' ? null : Math.max(1, parseInt(entriesInput) || 10)

  const loadProducts = async () => {
    try {
      const { data } = await getProducts()
      setProducts(data || [])
    } catch (e) {
      console.error('Products load error:', e)
      setProducts([])
    }
  }

  const loadPrices = async () => {
    try {
      const { data: priceData } = await getCurrentPrices()
      const priceMap = {}
      priceData?.forEach(p => { priceMap[p.prodCode] = p.unitPrice })
      setPrices(priceMap)
    } catch (e) {
      console.error('Prices load error:', e)
    }
  }

  const load = async () => {
    setLoading(true)
    await Promise.all([loadProducts(), loadPrices()])
    setLoading(false)
  }

  useEffect(() => {
    if (currentUser) load()
  }, [currentUser])

  useEffect(() => { setPage(1) }, [search, unitFilter, sortCol, sortDir, entriesInput])

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    let rows = products.filter(p => {
      const matchSearch =
        p.prodCode.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      const matchUnit = unitFilter === 'All' || p.unit === unitFilter
      return matchSearch && matchUnit
    })
    rows = [...rows].sort((a, b) => {
      let aVal = sortCol === 'unitPrice'
        ? parseFloat(prices[a.prodCode] || 0)
        : (a[sortCol] || '').toString().toLowerCase()
      let bVal = sortCol === 'unitPrice'
        ? parseFloat(prices[b.prodCode] || 0)
        : (b[sortCol] || '').toString().toLowerCase()
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return rows
  }, [products, prices, search, unitFilter, sortCol, sortDir])

  const paginated  = pageSize ? filtered.slice((page - 1) * pageSize, page * pageSize) : filtered
  const totalPages = pageSize ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1

  const SortTh = ({ col, label }) => (
    <th className="px-4 py-3 cursor-pointer select-none hover:bg-gray-100 whitespace-nowrap"
      onClick={() => handleSort(col)}>
      {label}<IconSort dir={sortCol === col ? sortDir : null} />
    </th>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Products</h2>
        {canAdd && (
          <button onClick={() => setShowAdd(true)}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Product
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-3 flex flex-wrap gap-3 items-center">
        {/* Search */}
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

        {/* Unit filter */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 whitespace-nowrap">Unit:</label>
          <select value={unitFilter} onChange={e => setUnitFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        {/* Entries number input */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 whitespace-nowrap">Show:</label>
          <input
            type="number" min="1" placeholder="All"
            value={entriesInput} onChange={e => setEntriesInput(e.target.value)}
            className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-400">entries</span>
        </div>

        <div className="flex-1" />

        {/* Export CSV */}
        <button onClick={() => exportToCSV(filtered, prices, showStamp)}
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

      {/* Summary */}
      <p className="text-xs text-gray-400 mb-2">
        Showing {filtered.length === 0 ? 0 : (page - 1) * (pageSize || filtered.length) + 1}–{Math.min(page * (pageSize || filtered.length), filtered.length)} of {filtered.length} product{filtered.length !== 1 ? 's' : ''}
        {search || unitFilter !== 'All' ? ' (filtered)' : ''}
      </p>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading products...</p>
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
                  <th className="px-4 py-3">Price History</th>
                  {showStamp && <th className="px-4 py-3">Stamp</th>}
                  {(canEdit || canDelete) && <th className="px-4 py-3 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-400">No products found.</td>
                  </tr>
                )}
                {paginated.map(p => (
                  <tr key={p.prodCode} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-gray-700">{p.prodCode}</td>
                    <td className="px-4 py-3 text-gray-800">{p.description}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{p.unit}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {prices[p.prodCode] != null
                        ? <span>₱ {parseFloat(prices[p.prodCode]).toFixed(2)}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <PriceHistoryPanel
                        prodCode={p.prodCode}
                        onPriceAdded={loadPrices}
                      />
                    </td>
                    {showStamp && (
                      <td className="px-4 py-3 text-xs text-gray-400 max-w-[160px] truncate">{p.stamp || '—'}</td>
                    )}
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 justify-center">
                          {canEdit && (
                            <button onClick={() => setEditTarget(p)} title="Edit product"
                              className="bg-green-500 hover:bg-green-600 text-white rounded-lg p-1.5 transition-colors">
                              <IconEdit />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => setDeleteTarget(p)} title="Delete product"
                              className="bg-red-500 hover:bg-red-600 text-white rounded-lg p-1.5 transition-colors">
                              <IconTrash />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
                        : 'border-gray-300 hover:bg-gray-50'}`}
                    >{p}</button>
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

      {showAdd && <AddProductModal onClose={() => setShowAdd(false)} onSaved={load} />}
      {editTarget && (
        <EditProductModal product={editTarget} onClose={() => setEditTarget(null)} onSaved={load} />
      )}
      {deleteTarget && (
        <SoftDeleteConfirmDialog product={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={load} />
      )}
    </div>
  )
}
