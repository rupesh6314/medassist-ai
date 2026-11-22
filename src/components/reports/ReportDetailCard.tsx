import { useState, useEffect } from 'react'
import { Download, ExternalLink, Trash2, Loader2, Sparkles, Activity, FileCheck, ShieldAlert, CheckCircle2, AlertTriangle, Stethoscope } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { VitalStatusBadge } from '@/components/shared/VitalStatusBadge'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/context/ToastContext'
import { api } from '@/services/api'
import { toDDMMYYYY } from '@/services/appointmentService'
import { cn } from '@/utils/cn'

interface ReportDetailCardProps {
  report: any
  onDelete?: (deletedId: string) => void
}

export function ReportDetailCard({ report, onDelete }: ReportDetailCardProps) {
  const { showToast } = useToast()
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isExplaining, setIsExplaining] = useState(false)
  const [customKeyFindings, setCustomKeyFindings] = useState<any[] | null>(null)
  const [riskAssessment, setRiskAssessment] = useState<any | null>(null)
  const [loadingRisk, setLoadingRisk] = useState(false)
  const [downloadingSummary, setDownloadingSummary] = useState(false)
  const [openingOriginal, setOpeningOriginal] = useState(false)

  const handleDownloadSummary = async () => {
    if (!report?.id) return
    setDownloadingSummary(true)
    try {
      const token = localStorage.getItem('medassist_token')
      const url = api.getReportSummaryPdfUrl(report.id)
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (!res.ok) {
        throw new Error('Failed to generate summary PDF.')
      }
      const blob = await res.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `Summary-${(report.patient_name || report.patientName || 'Report').replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)
      showToast('Summary Downloaded', 'Clinical summary PDF downloaded successfully.', 'success')
    } catch (err: any) {
      showToast('Download Error', err.message || 'Could not download summary PDF.', 'warning')
    } finally {
      setDownloadingSummary(false)
    }
  }

  const handleViewOriginalReport = async () => {
    showToast(
      'Ephemeral Privacy Active',
      'Under Option A privacy protections, original binary files are processed in memory and discarded. Clinical metrics and reports are securely stored in your medical profile.',
      'info'
    )
  }

  useEffect(() => {
    if (report?.id) {
      setLoadingRisk(true)
      api.getReportRisk(report.id)
        .then((res) => setRiskAssessment(res))
        .catch(() => setRiskAssessment(null))
        .finally(() => setLoadingRisk(false))
    }
  }, [report?.id])

  if (!report) return null

  const patientName = report.patient_name || report.patientName || 'Patient'
  const reportDate = report.report_date || report.reportDate || new Date().toISOString()
  const hospital = report.hospital || 'General Hospital'
  const doctor = report.doctor || 'Dr. Self / Lab'
  const type = report.type || 'Lab Test Report'
  const summary = report.summary || 'Summary of parsed lab report findings.'

  const rawVitals = Array.isArray(report.vitals) && report.vitals.length > 0
    ? report.vitals
    : Array.isArray(report.clinical_parameters || report.parameters) ? report.clinical_parameters || report.parameters : []

  // Check for non-clinical identifier, diagnosis, and interpretation lines
  const isNonClinicalLine = (name: string) =>
    /reg\.?\s*no|patient|mr\.|mrs\.|ms\.|received|sample\s*id|barcode|accession|specimen|uhid|mrn|report\s*id|diabetes\s*mellitus|impaired\s*tolerance|hypertension|prediabetes|anemia/i.test(name)

  // Filtered authoritative clinical measurements only
  const vitals = rawVitals
    .filter((v: any) => !isNonClinicalLine(v.label || v.name || ''))
    .map((v: any) => ({
      label: v.label || v.name || 'Parameter',
      value: v.value,
      unit: v.unit || '',
      status: v.status || (v.flag && String(v.flag).toLowerCase().includes('high') ? 'high' : v.flag && String(v.flag).toLowerCase().includes('low') ? 'low' : 'normal'),
      referenceRange: v.referenceRange || v.reference_range || 'N/A'
    }))

  const rawKeyFindings = customKeyFindings || (Array.isArray(report.key_findings || report.keyFindings)
    ? report.key_findings || report.keyFindings
    : [])

  const handleReExplain = async () => {
    if (!report.id) return
    setIsExplaining(true)
    try {
      const res = await api.reExplainReport(report.id)
      if (res && res.keyFindings && res.keyFindings.length > 0) {
        setCustomKeyFindings(res.keyFindings)
        showToast('AI Explanation Generated', 'Gemini AI explained your report values.', 'success')
        window.dispatchEvent(new Event('medassist_reports_updated'))
      } else {
        showToast('AI Unavailable', 'Gemini did not return explanations. Please check API configuration.', 'warning')
      }
    } catch (err: any) {
      showToast('AI Unavailable', err.message || 'Make sure Gemini API is configured.', 'warning')
    } finally {
      setIsExplaining(false)
    }
  }

  // Extract AI Explanations strictly for validated clinical measurements
  const explanationItems: { parameter: string; value?: any; unit?: string; status?: string; referenceRange?: string; explanation: string }[] = []

  if (rawKeyFindings.length > 0) {
    rawKeyFindings.forEach((item: any) => {
      if (typeof item === 'object' && item !== null && item.explanation && String(item.explanation).trim().length > 0) {
        const paramName = item.parameter || item.label || item.name || 'Parameter'
        if (!isNonClinicalLine(paramName)) {
          explanationItems.push({
            parameter: paramName,
            value: item.value,
            unit: item.unit,
            status: item.status,
            referenceRange: item.referenceRange,
            explanation: item.explanation
          })
        }
      }
    })
  }

  const formattedDate = toDDMMYYYY(reportDate)
  const sourceTag = report.source || (report.file_type === 'MANUAL' || report.fileType === 'MANUAL' ? 'Manual Entry' : 'Uploaded PDF')

  const fields = [
    { label: 'Patient Name', value: patientName },
    { label: 'Report Date', value: formattedDate },
    { label: 'Hospital / Source', value: `${hospital} (${sourceTag})` },
    { label: 'Doctor / Reviewer', value: doctor },
  ]

  const handleDelete = async () => {
    if (!report.id) return
    setDeleting(true)
    try {
      await api.deleteReport(report.id)
      showToast('Report deleted', `${type} was deleted successfully.`, 'info')
      window.dispatchEvent(new Event('medassist_reports_updated'))
      if (onDelete) {
        onDelete(report.id)
      }
    } catch (err: any) {
      showToast('Delete error', err.message || 'Failed to delete report.', 'warning')
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <Card className="animate-rise border-mist-200 bg-white shadow-xs">
      <CardHeader className="flex flex-row items-start justify-between pb-4 border-b border-mist-100">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <CardTitle className="text-xl font-bold text-ink">{type}</CardTitle>
            <Badge
              variant={sourceTag === 'Manual Entry' ? 'success' : 'blue'}
              className="text-[11px] font-medium"
            >
              {sourceTag}
            </Badge>
          </div>
          <CardDescription className="mt-1 text-xs text-ink-soft flex items-center gap-2">
            <span>{hospital}</span>
            <span>&bull;</span>
            <span>Recorded on {formattedDate}</span>
          </CardDescription>
        </div>

        {/* Delete Report Action */}
        <div className="flex items-center gap-2">
          {confirmDelete ? (
            <div className="flex items-center gap-1.5 animate-in fade-in">
              <span className="text-xs text-rose-600 font-medium mr-1">Delete report?</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="h-7 px-2.5 text-xs font-semibold"
              >
                {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="h-7 px-2.5 text-xs"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfirmDelete(true)}
              className="text-ink-soft hover:text-rose-600 hover:bg-rose-50 h-8 w-8 rounded-lg"
              title="Delete Report"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 rounded-xl bg-mist-50/90 border border-mist-200/70 p-4 sm:grid-cols-4">
          {fields.map((f) => (
            <div key={f.label} className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                {f.label}
              </span>
              <p className="text-xs sm:text-sm font-semibold text-ink truncate" title={f.value}>
                {f.value}
              </p>
            </div>
          ))}
        </div>

        {/* Clinical Summary */}
        <div className="rounded-xl border border-mist-200 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2 w-2 rounded-full bg-teal-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink">Clinical Summary</h4>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-ink-soft">{summary}</p>
        </div>

        <Separator />

        {/* 1. ACTUAL EXTRACTED REPORT DATA (AUTHORITATIVE) */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-600" />
                1. Actual Report Data (Authoritative)
              </h4>
              <p className="text-[11px] text-ink-soft mt-0.5">
                Authoritative laboratory and physiological measurements extracted from your medical document.
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs font-medium border-mist-300">
              {vitals.length} parameter{vitals.length === 1 ? '' : 's'}
            </Badge>
          </div>

          {vitals.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {vitals.map((vital: any, idx: number) => {
                const isNormal = vital.status === 'normal'
                const isHigh = vital.status === 'high'
                const isLow = vital.status === 'low'
                const isBorderline = vital.status === 'borderline'

                return (
                  <div
                    key={idx}
                    className={cn(
                      'flex flex-col justify-between rounded-xl border p-3.5 transition-all shadow-2xs',
                      isHigh
                        ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30'
                        : isLow
                          ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30'
                          : isBorderline
                            ? 'border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/30'
                            : 'border-mist-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-teal-200 dark:hover:border-teal-700'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="truncate text-xs font-semibold text-ink" title={vital.label}>
                        {vital.label}
                      </p>
                      <VitalStatusBadge status={vital.status} />
                    </div>

                    <div className="mt-2 flex items-baseline justify-between gap-2">
                      <span className="font-mono text-base font-bold text-ink">
                        {vital.value}{' '}
                        <span className="text-xs font-normal text-ink-soft">{vital.unit}</span>
                      </span>
                      <span className="text-[10px] text-ink-soft font-medium truncate">
                        Ref: {vital.referenceRange || 'N/A'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-mist-300 p-6 text-center text-xs text-ink-soft">
              No vital readings or parameters recorded for this report.
            </div>
          )}
        </div>

        <Separator />

        {/* 2. DETERMINISTIC CLINICAL RISK & SOURCE TRACING */}
        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-slate-900/70 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-indigo-700 dark:text-indigo-400" />
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                  2. Clinical Risk Staging & Source Trace
                </h4>
                <Badge variant="outline" className="bg-white/90 dark:bg-slate-800 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 text-[10px] px-2 py-0.5 font-bold">
                  Rule & Guideline Based
                </Badge>
              </div>
              <p className="text-[11px] text-indigo-800/80 dark:text-slate-400 mt-1">
                Deterministic calculations citing peer-reviewed medical society guidelines (ADA, KDIGO, ACC/AHA) with direct source traces.
              </p>
            </div>
          </div>

          {loadingRisk ? (
            <div className="p-6 text-center text-xs text-indigo-900/80 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              Evaluating clinical guidelines and feature gating...
            </div>
          ) : riskAssessment ? (
            <div className="space-y-3">
              {riskAssessment.emergency_alert && (
                <div className="p-3 rounded-xl border border-rose-300 bg-rose-100/90 text-rose-950 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-700 shrink-0" />
                  <span>{riskAssessment.emergency_alert}</span>
                </div>
              )}

              {riskAssessment.findings && riskAssessment.findings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {riskAssessment.findings.map((f: any, fIdx: number) => (
                    <div key={fIdx} className="rounded-xl border border-indigo-100 bg-white p-3.5 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink">{f.organ_system}</span>
                        <Badge variant="outline" className="text-[10px] bg-indigo-50 border-indigo-200 text-indigo-800">
                          {f.stage}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-indigo-950">{f.finding_name}: <span className="font-mono">{f.value}</span></p>
                      <p className="text-[11px] text-ink-soft leading-relaxed">{f.interpretation}</p>
                      <div className="pt-1.5 border-t border-mist-100 text-[10px] text-ink-soft flex flex-wrap justify-between gap-1">
                        <span>Guideline: <strong className="text-ink">{f.guideline}</strong></span>
                        {f.source_trace?.extracted_value && (
                          <span>Source Value: <strong className="text-ink">{f.source_trace.extracted_value} {f.source_trace.unit}</strong></span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-mist-200 bg-white p-3.5 text-xs text-ink-soft">
                  No specific clinical syndrome thresholds triggered by the current report parameters.
                </div>
              )}

              {/* ML Cardiovascular Risk */}
              {riskAssessment.ml_risk && (
                <div className="rounded-xl border border-indigo-100 bg-white p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-ink">Cardiovascular ML Analysis (UCI Cleveland)</span>
                    <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-300 text-slate-800">
                      {riskAssessment.ml_risk.status === 'computed' ? 'XGBoost Evaluated' : 'Feature Gated'}
                    </Badge>
                  </div>
                  {riskAssessment.ml_risk.status === 'computed' ? (
                    <div className="space-y-1 text-xs">
                      <p className="font-medium text-ink">Risk Level: <strong>{riskAssessment.ml_risk.risk_category}</strong> (Probability: {(riskAssessment.ml_risk.predicted_probability * 100).toFixed(1)}%)</p>
                      <p className="text-[11px] text-ink-soft">Verified Held-out Test Accuracy: 89.13% | ROC-AUC: 0.9352</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-ink-soft">
                      {riskAssessment.ml_risk.reason} (Missing: {riskAssessment.ml_risk.missing_required_markers?.join(', ') || 'Core vitals'}).
                    </p>
                  )}
                  <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 p-2 text-[10px] text-amber-900 leading-tight">
                    <strong>Population Demographic Notice:</strong> This machine learning model was trained on the Western UCI Cleveland Heart Disease cohort and may not generalize reliably to South Asian / Indian demographic populations due to phenotypic, dietary, and genetic variations.
                  </div>
                </div>
              )}

              <p className="text-[10px] text-indigo-900/70 italic pt-0.5">{riskAssessment.disclaimer}</p>
            </div>
          ) : null}
        </div>

        <Separator />

        {/* 3. DYNAMIC AI-GENERATED EXPLANATION (GEMINI AI) */}
        <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-700" />
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-teal-950">
                  3. Simplified AI Explanation
                </h4>
                <Badge variant="outline" className="bg-white/90 border-teal-300 text-teal-800 text-[10px] px-2 py-0.5 font-bold">
                  Gemini AI
                </Badge>
              </div>
              <p className="text-[11px] text-teal-800/80 mt-1">
                Plain-language explanations generated dynamically by Google Gemini AI.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleReExplain}
              disabled={isExplaining}
              className="h-8 text-xs px-3 border-teal-300 text-teal-800 bg-white hover:bg-teal-50 font-medium"
            >
              {isExplaining ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-teal-600" />
                  Generating AI explanation...
                </>
              ) : (
                <>
                  <Activity className="mr-1.5 h-3.5 w-3.5 text-teal-600" />
                  {explanationItems.length > 0 ? 'Regenerate with Gemini' : 'Generate AI Explanation'}
                </>
              )}
            </Button>
          </div>

          {isExplaining ? (
            <div className="rounded-xl border border-teal-200 bg-white p-8 text-center space-y-2">
              <Loader2 className="h-7 w-7 animate-spin text-teal-600 mx-auto" />
              <p className="text-sm font-semibold text-teal-900">
                Generating AI explanation...
              </p>
              <p className="text-xs text-ink-soft">
                Analyzing extracted values securely. Authoritative report data is preserved.
              </p>
            </div>
          ) : explanationItems.length > 0 ? (
            <div className="space-y-3">
              {explanationItems.map((item, idx) => {
                const matchedVital = vitals.find((v: any) => v.label.toLowerCase() === item.parameter.toLowerCase())
                const statusVal = item.status || matchedVital?.status || 'normal'
                const displayVal = item.value !== undefined ? item.value : matchedVital?.value
                const displayUnit = item.unit || matchedVital?.unit || ''
                const refRange = item.referenceRange || matchedVital?.referenceRange || 'Unavailable'

                return (
                  <div key={idx} className="rounded-xl border border-teal-100/80 bg-white p-4 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-teal-600 shrink-0" />
                        <span className="text-xs font-bold text-ink">{item.parameter}</span>
                      </div>
                      {displayVal !== undefined && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-ink-soft text-[11px]">Reported:</span>
                          <span className="font-mono font-bold text-ink">
                            {displayVal} {displayUnit}
                          </span>
                          <VitalStatusBadge status={statusVal} />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 text-xs pt-2 border-t border-mist-100">
                      <div className="md:col-span-4 bg-mist-50/80 dark:bg-slate-800/70 rounded-lg p-2.5 text-[11px] text-ink-soft dark:text-slate-300 space-y-1">
                        <p className="font-bold text-ink dark:text-slate-100 flex items-center gap-1.5">
                          <FileCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                          Actual Report Data:
                        </p>
                        <p>Result: <strong className="text-ink dark:text-slate-100">{displayVal} {displayUnit}</strong></p>
                        <p>Ref: <strong className="text-ink dark:text-slate-100">{refRange}</strong></p>
                      </div>
                      <div className="md:col-span-8 p-2.5 text-xs leading-relaxed text-ink-soft dark:text-slate-200 border-l-2 border-teal-500 bg-teal-50/30 dark:bg-slate-800/80 rounded-r-lg space-y-0.5">
                        <p className="font-bold text-teal-950 dark:text-teal-300 text-[11px]">Gemini AI Explanation:</p>
                        <p className="text-teal-900/90 dark:text-slate-300">{item.explanation}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900">
              <p className="font-semibold">AI explanation is currently unavailable.</p>
              <p className="mt-0.5 text-[11px] text-amber-800">
                Your authoritative extracted report values are preserved above. Click &quot;Generate AI Explanation&quot; to have Gemini AI explain these findings in plain language.
              </p>
            </div>
          )}

          <p className="text-[10px] text-teal-800/70 italic pt-1">
            Disclaimer: AI explanations are generated for educational and informational purposes only and do not constitute a medical diagnosis or prescription.
          </p>
        </div>

        {/* Report Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            className="bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-xs"
            onClick={handleDownloadSummary}
            disabled={downloadingSummary}
          >
            {downloadingSummary ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Summary...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download Summary
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="border-mist-300 hover:bg-mist-50 font-medium"
            onClick={handleViewOriginalReport}
            disabled={openingOriginal}
          >
            {openingOriginal ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Opening...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Original Report
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
