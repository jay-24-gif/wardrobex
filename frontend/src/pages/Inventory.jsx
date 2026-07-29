import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import { PlusIcon, CloseIcon } from '../components/icons'

const emptyForm = {
  category_id: '',
  product_name: '',
  sku: '',
  barcode: '',
  size: '',
  color: '',
  price: '',
  cost_price: '',
  quantity_in_stock: 0,
  reorder_threshold: 10,
}

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [stockInTarget, setStockInTarget] = useState(null)
  const [stockInQty, setStockInQty] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  async function loadProducts() {
    try {
      const res = await apiClient.get('/products')
      setProducts(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load products')
    }
  }

  async function loadCategories() {
    try {
      const res = await apiClient.get('/products/categories')
      setCategories(res.data)
    } catch {
      // non-fatal
    }
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await apiClient.post('/products', {
        ...form,
        category_id: Number(form.category_id),
        price: Number(form.price),
        cost_price: Number(form.cost_price || 0),
        quantity_in_stock: Number(form.quantity_in_stock),
        reorder_threshold: Number(form.reorder_threshold),
      })
      setMessage('Product added successfully')
      setForm(emptyForm)
      setShowForm(false)
      loadProducts()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add product')
    }
  }

  async function handleDeactivate(productId) {
    if (!confirm('Deactivate this product?')) return
    try {
      await apiClient.delete(`/products/${productId}`)
      loadProducts()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to deactivate product')
    }
  }

  async function handleStockIn(e) {
    e.preventDefault()
    if (!stockInTarget || !stockInQty) return
    try {
      await apiClient.post('/products/stock-in', {
        product_id: stockInTarget.product_id,
        quantity_added: Number(stockInQty),
      })
      setMessage(`Stock updated for ${stockInTarget.product_name}`)
      setStockInTarget(null)
      setStockInQty('')
      loadProducts()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update stock')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Product Catalog</h2>
          <p className="text-sm text-slate-400">{products.length} active products</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {showForm ? <CloseIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {message && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Product Name</label>
            <input required value={form.product_name} onChange={(e) => handleChange('product_name', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">SKU</label>
            <input required value={form.sku} onChange={(e) => handleChange('sku', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Barcode</label>
            <input value={form.barcode} onChange={(e) => handleChange('barcode', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Category</label>
            <select required value={form.category_id} onChange={(e) => handleChange('category_id', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Size</label>
            <input value={form.size} onChange={(e) => handleChange('size', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Color</label>
            <input value={form.color} onChange={(e) => handleChange('color', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Price (₱)</label>
            <input required type="number" step="0.01" value={form.price} onChange={(e) => handleChange('price', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Cost Price (₱)</label>
            <input type="number" step="0.01" value={form.cost_price} onChange={(e) => handleChange('cost_price', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Initial Stock</label>
            <input type="number" value={form.quantity_in_stock} onChange={(e) => handleChange('quantity_in_stock', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Reorder Threshold</label>
            <input type="number" value={form.reorder_threshold} onChange={(e) => handleChange('reorder_threshold', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex items-end sm:col-span-3">
            <button type="submit" className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Save Product
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Product ID</th>
              <th className="px-4 py-3">Product Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Threshold</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                  No products yet. Click &quot;Add Product&quot; to get started.
                </td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.product_id}>
                <td className="px-4 py-3 text-slate-400">#{p.product_id}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-700">{p.product_name}</p>
                  <p className="text-xs text-slate-400">{p.size || '-'} &middot; {p.color || '-'}</p>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {categories.find((c) => c.category_id === p.category_id)?.category_name || '-'}
                </td>
                <td className="px-4 py-3 text-slate-500">₱{Number(p.price).toFixed(2)}</td>
                <td className="px-4 py-3 text-slate-500">{p.quantity_in_stock}</td>
                <td className="px-4 py-3 text-slate-500">{p.reorder_threshold}</td>
                <td className="px-4 py-3">
                  {p.quantity_in_stock <= p.reorder_threshold ? (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">Low Stock</span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">In Stock</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <button
                    onClick={() => setStockInTarget(p)}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Restock
                  </button>
                  <button
                    onClick={() => handleDeactivate(p.product_id)}
                    className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                  >
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stockInTarget && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <form onSubmit={handleStockIn} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-lg font-semibold text-slate-800">Restock Product</h3>
            <p className="mb-4 text-sm text-slate-400">{stockInTarget.product_name}</p>
            <label className="mb-1 block text-xs font-medium text-slate-500">Quantity to Add</label>
            <input
              type="number"
              required
              min="1"
              value={stockInQty}
              onChange={(e) => setStockInQty(e.target.value)}
              className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setStockInTarget(null)} className="rounded-lg px-4 py-2 text-sm text-slate-500">
                Cancel
              </button>
              <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                Confirm
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
