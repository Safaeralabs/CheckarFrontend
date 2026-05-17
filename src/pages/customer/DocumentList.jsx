import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Award, Download, FileText, Receipt } from 'lucide-react'
import api from '../../api/client'
import { formatDate, formatCurrency } from '../../lib/utils'

const TABS = [
  { key: 'certs',    label: 'Certificados', icon: Award },
  { key: 'invoices', label: 'Facturas',     icon: Receipt },
]

export default function DocumentList() {
  const [tab, setTab] = useState('certs')

  const { data: certsData, isLoading: loadCerts } = useQuery({
    queryKey: ['certificates'],
    queryFn: () => api.get('inspections/certificates/').then(r => r.data),
  })

  const { data: invoicesData, isLoading: loadInvoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get('billing/invoices/').then(r => r.data),
  })

  const certs   = certsData?.results   ?? certsData   ?? []
  const invoices = invoicesData?.results ?? invoicesData ?? []
  const isLoading = tab === 'certs' ? loadCerts : loadInvoices
  const items = tab === 'certs' ? certs : invoices

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-ink mb-5">Documentos</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-canvas rounded-lg p-1 mb-6 border border-border">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === key ? 'bg-surface shadow-sm text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-surface rounded-xl border border-dashed border-border p-12 text-center">
          <FileText className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-sm font-medium text-ink mb-1">
            Sin {tab === 'certs' ? 'certificados' : 'facturas'} aún
          </p>
          <p className="text-xs text-muted">Aparecerán aquí una vez completes una inspección</p>
        </div>
      ) : tab === 'certs' ? (
        <div className="space-y-3">
          {certs.map(c => (
            <div key={c.id} className="bg-surface rounded-xl border border-border p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-success-soft flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Nro. {c.certificate_number}</p>
                  <p className="text-xs text-muted mt-0.5">Emitido: {formatDate(c.issued_at)}</p>
                  <p className="text-xs text-muted">Vence: {formatDate(c.expires_at)}</p>
                </div>
              </div>
              {c.file && (
                <a
                  href={c.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg border border-border text-muted hover:border-brand hover:text-brand transition flex-shrink-0"
                  title="Descargar"
                >
                  <Download className="w-4 h-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <div key={inv.id} className="bg-surface rounded-xl border border-border p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-soft flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Factura {inv.invoice_number}</p>
                  <p className="text-xs text-muted mt-0.5">{formatDate(inv.created_at)}</p>
                  <p className="text-xs font-semibold text-ink mt-1">{formatCurrency(inv.total)}</p>
                </div>
              </div>
              {inv.pdf && (
                <a
                  href={inv.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg border border-border text-muted hover:border-brand hover:text-brand transition flex-shrink-0"
                  title="Descargar"
                >
                  <Download className="w-4 h-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
