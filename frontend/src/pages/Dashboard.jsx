import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import { CoinIcon, ReceiptIcon, AlertIcon, BoxIcon } from '../components/icons'

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [summaryRes, alertsRes] = await Promise.all([
          apiClient.get('/reports/dashboard-summary'),
          apiClient.get('/products/alerts/active'),
        ])
        setSummary(summaryRes.data)
        setAlerts(alertsRes.data)
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <p className="text-slate-400">Loading dashboard...</p>
  if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-red-600">{error}</p>

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's Sales"
          value={`₱${Number(summary?.today_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={CoinIcon}
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Transactions Today"
          value={summary?.today_transaction_count ?? 0}
          icon={ReceiptIcon}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Low Stock Items"
          value={summary?.low_stock_count ?? 0}
          icon={AlertIcon}
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Active Products"
          value={summary?.total_active_products ?? 0}
          icon={BoxIcon}
          accent="bg-indigo-50 text-indigo-600"
        />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          Low-Stock Alerts {alerts.length > 0 && `(${alerts.length})`}
        </h2>
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-400">No active alerts. All stock levels look healthy.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {alerts.map((alert) => (
              <li key={alert.alert_id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">{alert.product_name}</p>
                  <p className="text-xs text-slate-400">{alert.alert_message}</p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600">
                  Low Stock
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
