import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getDeletedProducts, recoverProduct } from '../services/productService'

export default function DeletedItemsPage() {
  const { currentUser } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [recovering, setRecovering] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data } = await getDeletedProducts()
    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleRecover = async prodCode => {
    setRecovering(prodCode)
    await recoverProduct(prodCode, currentUser.id)
    await load()
    setRecovering(null)
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Deleted Items</h2>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-10 text-center text-gray-400 text-sm">
          No deleted products.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-gray-500 text-xs uppercase">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Stamp</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.prodCode} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{p.prodCode}</td>
                  <td className="px-4 py-3 text-gray-400 line-through">{p.description}</td>
                  <td className="px-4 py-3 text-gray-400">{p.unit}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{p.stamp || '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRecover(p.prodCode)}
                      disabled={recovering === p.prodCode}
                      className="text-xs text-green-600 hover:underline disabled:opacity-50"
                    >
                      {recovering === p.prodCode ? 'Recovering...' : 'Recover'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
