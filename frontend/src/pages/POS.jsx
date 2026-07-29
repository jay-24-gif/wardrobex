import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import { SearchIcon, CartIcon, CreditCardIcon, ReceiptIcon, PrinterIcon, CloseIcon } from '../components/icons'

export default function POS() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [discount, setDiscount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountPaid, setAmountPaid] = useState('')
  const [gcashRef, setGcashRef] = useState('')
  const [error, setError] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    const delay = setTimeout(() => loadProducts(search), 300)
    return () => clearTimeout(delay)
  }, [search])

  async function loadProducts(query = '') {
    try {
      const res = await apiClient.get('/products', { params: query ? { search: query } : {} })
      setProducts(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load products')
    }
  }

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.product_id === product.product_id)
      if (existing) {
        return prev.map((c) =>
          c.product.product_id === product.product_id
            ? { ...c, quantity: Math.min(c.quantity + 1, product.quantity_in_stock) }
            : c
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  function updateQuantity(productId, quantity) {
    setCart((prev) =>
      prev
        .map((c) => (c.product.product_id === productId ? { ...c, quantity: Number(quantity) } : c))
        .filter((c) => c.quantity > 0)
    )
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((c) => c.product.product_id !== productId))
  }

  function clearCart() {
    setCart([])
    setDiscount('')
  }

  const subtotal = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0)
  const discountAmount = Number(discount) || 0
  const totalAmount = Math.max(0, subtotal - discountAmount)
  const changeDue = amountPaid ? Math.max(0, Number(amountPaid) - totalAmount) : 0

function openPaymentModal() {
  setError('')
  if (cart.length === 0) {
    setError('Cart is empty')
    return
  }
  setPaymentError('')
  setAmountPaid('')
  setGcashRef(`WX-${Date.now().toString().slice(-8)}`)
  setShowPaymentModal(true)
}

// GCash is an exact digital payment (no physical change) — auto-fill the
// tendered amount and refresh the QR whenever the method or total changes.
useEffect(() => {
  if (showPaymentModal && paymentMethod === 'gcash') {
    setAmountPaid(totalAmount.toFixed(2))
  }
}, [paymentMethod, showPaymentModal, totalAmount])

const gcashQrData = encodeURIComponent(
  `WardrobeX Payment\nRef: ${gcashRef}\nAmount: PHP ${totalAmount.toFixed(2)}`
)
const gcashQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=10&data=${gcashQrData}`

  async function handleCompleteSale() {
    setPaymentError('')
    if (!amountPaid || Number(amountPaid) < totalAmount) {
      setPaymentError('Amount tendered must cover the total amount due')
      return
    }

    setProcessing(true)
    try {
      const payload = {
        items: cart.map((c) => ({
          product_id: c.product.product_id,
          quantity: c.quantity,
          line_discount: 0,
        })),
        payment_method: paymentMethod,
        amount_paid: Number(amountPaid),
        discount_amount: discountAmount,
        tax_rate: 0,
      }
      const res = await apiClient.post('/pos/checkout', payload)
      setReceipt(res.data)
      setShowPaymentModal(false)
      clearCart()
      loadProducts(search)
    } catch (err) {
      setPaymentError(err.response?.data?.detail || 'Checkout failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="relative mb-4">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search product name or product ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {products.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-slate-400">No products found.</p>
          )}
          {products.map((product) => (
            <button
              key={product.product_id}
              onClick={() => addToCart(product)}
              disabled={product.quantity_in_stock === 0}
              className="rounded-xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 transition hover:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <p className="text-sm font-semibold text-slate-800">{product.product_name}</p>
              <p className="text-xs text-slate-400">ID: {product.product_id}</p>
              <p className="mt-2 text-lg font-bold text-brand-600">₱{Number(product.price).toFixed(2)}</p>
              <p className={`text-xs ${product.quantity_in_stock <= product.reorder_threshold ? 'text-amber-600' : 'text-slate-400'}`}>
                # of Stocks: {product.quantity_in_stock}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <CartIcon className="h-5 w-5 text-slate-500" />
            Cart
          </h2>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-sm font-medium text-slate-400 hover:text-red-500">
              Clear
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <p className="text-sm text-slate-400">Add Product from the left panel.</p>
        ) : (
          <div className="mb-4 space-y-3">
            {cart.map((c) => (
              <div key={c.product.product_id} className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700">{c.product.product_name}</p>
                  <p className="text-xs text-slate-400">₱{Number(c.product.price).toFixed(2)} each</p>
                </div>
                <input
                  type="number"
                  min="1"
                  max={c.product.quantity_in_stock}
                  value={c.quantity}
                  onChange={(e) => updateQuantity(c.product.product_id, e.target.value)}
                  className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center text-sm"
                />
                <button
                  onClick={() => removeFromCart(c.product.product_id)}
                  className="text-red-400 hover:text-red-600"
                  aria-label="Remove item"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2 border-t border-slate-100 pt-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Discount (₱)</label>
            <input
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span>₱{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Discount</span>
            <span>₱{discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-800">
            <span>Total</span>
            <span>₱{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={openPaymentModal}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <CreditCardIcon className="h-4 w-4" />
          Process Payment
        </button>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="animate-modal-in w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <CreditCardIcon className="h-5 w-5 text-slate-500" />
                Process Payment
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">Total Due</span>
              <span className="text-xl font-bold text-slate-800">₱{totalAmount.toFixed(2)}</span>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-slate-500">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="cash">Cash</option>
                <option value="gcash">GCash</option>
                <option value="card">Credit/Debit Card</option>
              </select>
            </div>

        {paymentMethod === 'gcash' ? (
          <div className="mb-4 flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 py-4">
            <img
              src={gcashQrUrl}
              alt="GCash payment QR code"
              width={160}
              height={160}
              className="rounded-lg bg-white p-2 shadow-sm"
            />
            <p className="mt-3 text-sm font-semibold text-slate-700">
              Scan with GCash to pay ₱{totalAmount.toFixed(2)}
            </p>
            <p className="text-xs text-slate-400">Ref No. {gcashRef}</p>
          </div>
        ) : (
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-slate-500">Amount Tendered (₱)</label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            )}

            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-slate-500">{paymentMethod === 'gcash' ? 'Amount Received' : 'Change'}</span>
              <span className="font-semibold text-slate-800">
                ₱{paymentMethod === 'gcash' ? totalAmount.toFixed(2) : changeDue.toFixed(2)}
              </span>
            </div>

            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-slate-500">Change</span>
              <span className="font-semibold text-slate-800">₱{changeDue.toFixed(2)}</span>
            </div>

            {paymentError && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{paymentError}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSale}
                disabled={processing}
                className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="animate-modal-in w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div id="receipt-print">
              <div className="mb-4 text-center">
                <ReceiptIcon className="mx-auto mb-2 h-8 w-8 text-brand-600" />
                <p className="text-base font-bold text-slate-800">WardrobeX</p>
                <p className="text-xs text-slate-400">Official Receipt</p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Transaction No. {String(receipt.transaction_id).padStart(4, '0')}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(receipt.transaction_date).toLocaleString('en-PH', {
                    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="space-y-1 border-y border-dashed border-slate-200 py-3 text-sm">
                {receipt.items?.map((item) => (
                  <div key={item.product_id} className="flex justify-between text-slate-600">
                    <span>Product #{item.product_id} &times;{item.quantity}</span>
                    <span>₱{Number(item.line_total).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-base font-bold text-slate-800">Total</span>
                <span className="text-base font-bold text-slate-800">₱{Number(receipt.total_amount).toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-400">Payment: {receipt.payment_method.toUpperCase()}</p>
              <p className="text-xs text-slate-400">Change: ₱{Number(receipt.change_due).toFixed(2)}</p>

              <p className="mt-4 text-center text-xs text-slate-400">Thank you for shopping at WardrobeX</p>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setReceipt(null)}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                <PrinterIcon className="h-4 w-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
