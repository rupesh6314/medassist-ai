import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileText, Edit3, History, Upload, Plus, CheckCircle2, ChevronDown } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ReportDetailCard } from '@/components/reports/ReportDetailCard'
import { TermExplanationCard } from '@/components/reports/TermExplanationCard'
import { UploadZone } from '@/components/reports/UploadZone'
import { ManualEntryModal } from '@/components/manual/ManualEntryModal'
import type { ManualParameter, ManualParameterFormData } from '@/types/manualEntry'
import { mockTermExplanations } from '@/data/reports'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'
import { api, getToken } from '@/services/api'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/context/ToastContext'
import { toDDMMYYYY } from '@/services/appointmentService'

const LOCAL_STORAGE_KEY = 'medassist_manual_parameters'

const DEFAULT_INITIAL_PARAMETERS: ManualParameter[] = [
  {
    id: 'param-1',
    parameter: 'Blood Sugar (Fasting)',
    value: '105',
    unit: 'mg/dL',
    reference: '70–99',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'param-2',
    parameter: 'HbA1c Level',
    value: '5.8',
    unit: '%',
    reference: '4.0–5.6',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'param-3',
    parameter: 'Body Mass Index (BMI)',
    value: '24.5',
    unit: 'kg/m²',
    reference: '18.5–24.9',
    createdAt: new Date().toISOString(),
  },
]

export default function MedicalReportsPage() {
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'manual' ? 'manual' : 'pdf'
  const [uploadMode, setUploadMode] = useState<'pdf' | 'manual'>(initialTab)

  const [reports, setReports] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Ref for smooth scrolling to selected report details
  const reportDetailsRef = useRef<HTMLDivElement>(null)

  // Manual Entry State
  const [parameters, setParameters] = useState<ManualParameter[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved !== null) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed
      }
    } catch { }
    return DEFAULT_INITIAL_PARAMETERS
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingParameter, setEditingParameter] = useState<ManualParameter | null>(null)

  const { showToast } = useToast()

  const fetchReports = async () => {
    try {
      setLoading(true)
      const res = await api.getReports()
      const list = res.reports || []
      setReports(list)
      if (list.length > 0 && !selectedId) {
        setSelectedId(list[0].id)
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  const fetchManualParameters = async () => {
    if (!getToken()) return
    try {
      const res = await api.getReports()
      const allReports = res.reports || []
      const manualReports = allReports.filter(
        (r) =>
          r.source === 'Manual Entry' ||
          r.file_type === 'MANUAL' ||
          r.fileType === 'MANUAL' ||
          (r.type && r.type.toLowerCase().includes('manual'))
      )

      const extractedItems: ManualParameter[] = []
      for (const r of manualReports) {
        const vitals = Array.isArray(r.vitals) ? r.vitals : []
        for (const v of vitals) {
          extractedItems.push({
            id: v.id || `manual-${r.id}-${Math.random()}`,
            reportId: r.id,
            parameter: v.label || v.name || 'Parameter',
            value: String(v.value !== undefined ? v.value : ''),
            unit: v.unit || '',
            reference: v.referenceRange || v.reference_range || '',
            createdAt: r.created_at || r.createdAt || r.report_date || new Date().toISOString(),
          })
        }
      }

      if (extractedItems.length > 0) {
        setParameters(extractedItems)
      }
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    fetchReports()
    fetchManualParameters()

    const handleReportsUpdated = () => {
      fetchReports()
      fetchManualParameters()
    }

    window.addEventListener('medassist_reports_updated', handleReportsUpdated)
    return () => {
      window.removeEventListener('medassist_reports_updated', handleReportsUpdated)
    }
  }, [])

  const handleDeleteComplete = async (deletedId: string) => {
    const updated = reports.filter((r) => r.id !== deletedId)
    setReports(updated)
    if (updated.length > 0) {
      setSelectedId(updated[0].id)
    } else {
      setSelectedId(null)
    }
    window.dispatchEvent(new CustomEvent('medassist_reports_updated'))
  }

  const handleSelectReport = (id: string) => {
    setSelectedId(id)
    setTimeout(() => {
      if (reportDetailsRef.current) {
        reportDetailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  // Handlers for Manual Entry Mode
  const handleOpenAddModal = () => {
    setEditingParameter(null)
    setIsModalOpen(true)
  }

  const syncBatchParametersToBackend = async (dataList: ManualParameterFormData[]) => {
    if (!getToken()) return
    try {
      const vitalsArray = dataList.map((d) => ({
        label: d.parameter,
        value: d.value,
        unit: d.unit || 'units',
        status: 'normal',
        referenceRange: d.reference || 'Standard Reference Range',
      }))

      const payload = {
        type: 'Manual Health Entry',
        hospital: 'Self-Reported / Home Reading',
        doctor: 'Self / Patient Entry',
        summary:
          `Manual report with ${dataList.length} parameter(s): ` +
          dataList.map((d) => `${d.parameter} = ${d.value} ${d.unit || ''}`).join(', '),
        keyFindings: dataList.map((d) => `${d.parameter}: ${d.value} ${d.unit || ''}`),
        vitals: vitalsArray,
      }

      const res = await api.createManualReport(payload)
      if (res?.report?.id) {
        setSelectedId(res.report.id)
      }
      fetchReports()
      window.dispatchEvent(new CustomEvent('medassist_reports_updated'))
    } catch {
      /* silent catch */
    }
  }

  const handleSaveParameter = async (data: ManualParameterFormData, id?: string) => {
    if (id) {
      setParameters((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)))
      showToast('Success', 'Health parameter updated successfully', 'success')
    } else {
      await syncBatchParametersToBackend([data])
      showToast('Success', 'New health parameter saved as a new report!', 'success')
    }
  }

  const handleSaveBatchParameters = async (dataList: ManualParameterFormData[]) => {
    await syncBatchParametersToBackend(dataList)
    api.analyzeDiseaseRisks().catch(() => { })
    showToast('New Report Created!', `Created a separate report with ${dataList.length} parameter(s).`, 'success')
  }

  const selected = reports.find((r) => r.id === selectedId) || (reports.length > 0 ? reports[0] : null)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8 pb-12">
      {/* 1. Breadcrumb, Title & Description */}
      <PageHeader
        crumbs={['MediAssist AI', 'Medical Reports']}
        title="Medical Reports & Health History"
        description="Upload a medical report (PDF) or log your health metrics manually with AI-powered extraction and analysis."
      />

      {/* 2. PDF Upload / Manual Entry Segmented Control */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-mist-200 bg-mist-100/70 p-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => setUploadMode('pdf')}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-bold transition-all cursor-pointer',
            uploadMode === 'pdf'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-ink-soft hover:text-ink hover:bg-white/80'
          )}
        >
          <Upload className="h-4 w-4" />
          <span>Upload PDF</span>
        </button>

        <button
          type="button"
          onClick={() => setUploadMode('manual')}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-bold transition-all cursor-pointer',
            uploadMode === 'manual'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-ink-soft hover:text-ink hover:bg-white/80'
          )}
        >
          <Plus className="h-4 w-4" />
          <span>Manual Entry</span>
        </button>
      </div>

      {/* 3. Upload or Manual Entry Form Card */}
      {uploadMode === 'pdf' && (
        <Card className="border-mist-200 bg-white shadow-xs animate-rise">
          <CardHeader className="pb-3 border-b border-mist-100">
            <CardTitle className="text-base font-bold text-ink flex items-center gap-2">
              <Upload className="h-4.5 w-4.5 text-teal-600" /> Upload Medical Diagnostic Report
            </CardTitle>
            <CardDescription className="text-xs text-ink-soft">
              PDF documents — text and vitals extracted automatically via local AI & OCR.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <UploadZone
              onComplete={(newReport) => {
                fetchReports()
                if (newReport?.id) {
                  setSelectedId(newReport.id)
                  setTimeout(() => {
                    reportDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }, 200)
                }
              }}
            />
          </CardContent>
        </Card>
      )}

      {uploadMode === 'manual' && (
        <Card className="border-mist-200 bg-white shadow-xs animate-rise">
          <CardHeader className="pb-4 border-b border-mist-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-ink flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-teal-600" /> Manual Health Metrics Entry
                </CardTitle>
                <CardDescription className="text-xs text-ink-soft mt-1">
                  Record your vital values, glucose, BP, cholesterol, or custom health metrics manually. Saved entries immediately appear in your report history below.
                </CardDescription>
              </div>
              <Button
                onClick={handleOpenAddModal}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold gap-2 text-xs shadow-xs h-9 px-4 shrink-0"
              >
                <Plus className="h-4 w-4" /> Add Health Values
              </Button>
            </div>
          </CardHeader>
          <ManualEntryModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveParameter}
            onSaveBatch={handleSaveBatchParameters}
            initialData={editingParameter}
          />
        </Card>
      )}

      {/* 4. Full-Width Report History Section */}
      <section className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-teal-700" />
              <h2 className="font-display text-lg font-bold text-ink">Report History</h2>
              <Badge variant="outline" className="font-mono text-xs font-semibold border-mist-300">
                {reports.length}
              </Badge>
            </div>
            <p className="text-xs text-ink-soft mt-0.5">
              Select a report to view its complete vitals and details.
            </p>
          </div>
        </div>

        {reports.length === 0 && !loading ? (
          <Card className="p-8 text-center shadow-xs border-dashed border-mist-300">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
              <History className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-ink">No Report History Found</h3>
            <p className="mt-1 max-w-sm text-xs text-ink-soft mx-auto">
              Upload a PDF lab report or add manual health metrics above to view parsed biomarkers and AI insights.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <>
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
              </>
            ) : (
              reports.map((r) => {
                const isSelected = r.id === selectedId
                const isManual =
                  r.source === 'Manual Entry' ||
                  r.file_type === 'MANUAL' ||
                  r.fileType === 'MANUAL' ||
                  (r.type && r.type.toLowerCase().includes('manual'))

                const sourceTag = isManual ? 'Manual Entry' : r.source || 'Uploaded PDF'
                const rDate = toDDMMYYYY(
                  r.report_date || r.reportDate || r.created_at || new Date()
                )

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectReport(r.id)}
                    className={cn(
                      'group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer shadow-2xs',
                      isSelected
                        ? 'border-teal-600 bg-teal-50/60 dark:bg-slate-800/80 dark:border-teal-400 ring-2 ring-teal-500/20 shadow-xs'
                        : 'border-mist-200 bg-white dark:bg-slate-900/60 dark:border-slate-800 hover:border-teal-300 hover:bg-mist-50/60 dark:hover:bg-slate-800/60'
                    )}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors',
                              isSelected
                                ? 'bg-teal-700 text-white'
                                : isManual
                                  ? 'bg-teal-50 text-teal-700 group-hover:bg-teal-100'
                                  : 'bg-blue-50 text-blue-700 group-hover:bg-blue-100'
                            )}
                          >
                            {isManual ? <Edit3 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                          </span>
                          <span className="font-bold text-xs sm:text-sm text-ink truncate">
                            {r.type || (isManual ? 'Manual Health Entry' : 'Medical Report')}
                          </span>
                        </div>

                        <Badge
                          variant={isManual ? 'success' : 'blue'}
                          className="shrink-0 text-[10px] font-medium"
                        >
                          {sourceTag}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-ink-soft pt-1">
                        <span className="truncate max-w-[180px] font-medium">{r.hospital || 'Self / Lab'}</span>
                        <span className="font-mono text-[11px] shrink-0 text-ink-soft/90">{rDate}</span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-3 pt-2.5 border-t border-teal-200/70 flex items-center justify-between text-[11px] text-teal-800 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" /> Currently Selected
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-teal-700" />
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>
        )}
      </section>

      {/* 5. Selected Report Details Section (Full Width) */}
      <section ref={reportDetailsRef} className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">Selected Report Details</h2>
          {selected && (
            <span className="text-xs text-ink-soft">
              Viewing: <strong className="text-ink font-semibold">{selected.type || 'Report'}</strong>
            </span>
          )}
        </div>

        {loading ? (
          <Skeleton className="h-80 w-full rounded-2xl" />
        ) : selected ? (
          <ReportDetailCard report={selected} onDelete={handleDeleteComplete} />
        ) : null}
      </section>

      {/* 6. AI Medical Term Explanations (Full Width) */}
      <section className="space-y-3.5 pt-2">
        <Card className="animate-rise border-mist-200 bg-white shadow-xs">
          <CardHeader className="border-b border-mist-100 pb-4">
            <CardTitle className="text-base font-bold text-ink">AI Report Explanation</CardTitle>
            <CardDescription className="text-xs text-ink-soft">
              Medical terms from your reports explained in plain language
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {mockTermExplanations.map((t) => (
                <TermExplanationCard key={t.term} {...t} />
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
