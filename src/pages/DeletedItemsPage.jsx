import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getDeletedProducts, recoverProduct } from '../services/productService'

const IconRecover = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
  </svg>
)

const IconSort = ({ dir }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 inline ml-1" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {dir === 'asc'  && <polyline points="18 15 12 9 6 15"/>}
    {dir === 'desc' && <polyline points="6 9 12 15 18 9"/>}
    {!dir && <><polyline points="18 15 12 9 6 15" opacity="0.3"/><polyline points="6 15 12 21 18 15" opacity="0.3"/></>}
  </svg>
)

const ENTRIES_OPTIONS = [10, 25, 50, 100]

export default function DeletedItemsPage() {
  const { currentUser } = useAuth()

  const [products, setProducts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [recovering, setRecovering] = useState(null)

  const [search, setSearch]     = useState('')
  const [sortCol, setSortCol]   = useState('prodCode')
  const [sortDir, setSortDir]   = useState('asc')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage]         = useState(1)

  const load = async () => {
    setLoading(true)
    const { data } = await getDeletedProducts()
    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (currentUser) load()
  }, [currentUser])

  useEffect(() => { setPage(1) }, [search, sortCol, sortDir, pageSize])

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const handleRecover = async (prodCode) => {
    setRecovering(prodCode)
    await recoverProduct(prodCode, currentUser.id)
    await load()
    setRecovering(null)
  }

  const filtered = useMemo(() => {
    let rows = products.filter(p =>
      p.prodCode.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    )
    rows = [...rows].sort((a, b) => {
      const aVal = (a[sortCol] || '').toString().toLowerCase()
      const bVal = (b[sortCol] || '').toString().toLowerCase()
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return rows
  }, [products, search, sortCol, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize)

  const SortTh = ({ col, label }) => (
    <th
      className="px-4 py-3 cursor-pointer select-none hover:bg-gray-100 whitespace-nowrap"
      onClick={() => handleSort(col)}
    >
      {label}
      <IconSort dir={sortCol === col ? sortDir : null} />
    </th>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Deleted Items</h2>
          <p className="text-xs text-gray-400 mt-0.5">Soft-deleted products — only ADMIN and SUPERADMIN can view and recover these.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-3 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text" placeholder="Search code or description..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Entries per page */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 whitespace-nowrap">Show:</label>
          <select
            value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ENTRIES_OPTIONS.map(n => <option key={n} value={n}>{n} entries</option>)}
          </select>
        </div>
      </div>

      {/* Results summary */}
      <p className="text-xs text-gray-400 mb-2">
        Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} deleted product{filtered.length !== 1 ? 's' : ''}
        {search ? ' (filtered)' : ''}
      </p>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : filtered.length === 0 && !search ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto text-gray-300 mb-3" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
          <p className="text-gray-400 text-sm">No deleted products.</p>
          <p className="text-gray-300 text-xs mt-1">Items you delete from the product list will appear here.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-gray-500 text-xs uppercase">
                  <SortTh col="prodCode"    label="Code" />
                  <SortTh col="description" label="Description" />
                  <SortTh col="unit"        label="Unit" />
                  <SortTh col="stamp"       label="Deleted" />
                  <th className="px-4 py-3 text-center">Recover</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      No results match your search.
                    </td>
                  </tr>
                )}
                {paginated.map(p => (
                  <tr key={p.prodCode} className="border-t border-gray-100 hover:bg-red-50/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-gray-500">{p.prodCode}</td>
                    <td className="px-4 py-3 text-gray-400 line-through">{p.description}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-400 text-xs px-2 py-0.5 rounded-full">{p.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{p.stamp || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRecover(p.prodCode)}
                        disabled={recovering === p.prodCode}
                        title="Recover product"
                        className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg p-1.5 transition-colors inline-flex items-center gap-1.5 text-xs px-3"
                      >
                        <IconRecover />
                        {recovering === p.prodCode ? 'Recovering...' : 'Recover'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
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
    </div>
  )
}
