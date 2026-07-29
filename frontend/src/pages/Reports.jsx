import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import { CoinIcon, ReceiptIcon, TrendUpIcon, DownloadIcon } from '../components/icons'

const periodOptions = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
]

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <Icon className="h-5 w-5 text-brand-500" />
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  )
}

export default function Reports() {
  const [period, setPeriod] = useState('daily')
  const [summary, setSummary] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [period])

  async function loadReports() {
    setLoading(true)
    setError('')
    try {
      const [summaryRes, topRes, txnRes] = await Promise.all([
        apiClient.get('/reports/sales-summary', { params: { period } }),
        apiClient.get('/reports/top-products', { params: { limit: 5 } }),
        apiClient.get('/pos/transactions', { params: { limit: 20 } }),
      ])
      setSummary(summaryRes.data)
      setTopProducts(topRes.data)
      setTransactions(txnRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const avgOrderValue =
    summary && summary.total_transactions > 0
      ? Number(summary.total_sales) / summary.total_transactions
      : 0

  function handleExportCsv() {
    const rows = [
      ['Transaction #', 'Date', 'Items', 'Total', 'Payment Method'],
      ...transactions.map((t) => [
        t.transaction_id,
        new Date(t.transaction_date).toLocaleString(),
        t.items?.reduce((sum, i) => sum + i.quantity, 0) || 0,
        Number(t.total_amount).toFixed(2),
        t.payment_method,
      ]),
    ]
    const csvContent = rows.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `wardrobex-sales-report-${period}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Sales Report</h2>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600"
          >
            {periodOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <DownloadIcon className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {!loading && summary && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <StatCard
            label="Total Revenue"
            value={`₱${Number(summary.total_sales).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            icon={CoinIcon}
          />
          <StatCard label="Transactions" value={summary.total_transactions} icon={ReceiptIcon} />
          <StatCard
            label="Avg. Order Value"
            value={`₱${avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            icon={TrendUpIcon}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h3 className="mb-4 text-base font-semibold text-slate-800">Best Selling Products</h3>
          {topProducts.length === 0 ? (
            <p className="text-sm text-slate-400">No sales data yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="pb-2">Product Name</th>
                  <th className="pb-2 text-right">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProducts.map((p) => (
                  <tr key={p.product_id}>
                    <td className="py-2 text-slate-700">{p.product_name}</td>
                    <td className="py-2 text-right text-slate-500">{p.total_quantity_sold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h3 className="mb-4 text-base font-semibold text-slate-800">Transaction History</h3>
          {transactions.length === 0 ? (
            <p className="text-sm text-slate-400">No transactions recorded yet.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white text-left text-xs uppercase text-slate-400">
                  <tr>
                    <th className="pb-2">#</th>
                    <th className="pb-2">Time</th>
                    <th className="pb-2">Items</th>
                    <th className="pb-2 text-right">Total</th>
                    <th className="pb-2 text-right">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((t) => (
                    <tr key={t.transaction_id}>
                      <td className="py-2 text-slate-500">{t.transaction_id}</td>
                      <td className="py-2 text-slate-500">
                        {new Date(t.transaction_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2 text-slate-500">{t.items?.reduce((sum, i) => sum + i.quantity, 0) || 0}</td>
                      <td className="py-2 text-right text-slate-700">₱{Number(t.total_amount).toFixed(2)}</td>
                      <td className="py-2 text-right capitalize text-slate-500">{t.payment_method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
