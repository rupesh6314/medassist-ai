import { useState, useMemo, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Activity,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TrendChart } from '@/components/trends/TrendChart'
import { RiskGauge } from '@/components/risk/RiskGauge'
import { WeeklyDietTable } from '@/components/diet/WeeklyDietTable'
import { weeklyMealPlan } from '@/data/diet'
import { cn } from '@/utils/cn'
import { toDDMMYYYY } from '@/services/appointmentService'

const trendTimeFilters = [
  { label: 'Last Month', months: 1 },
  { label: 'Last 6 Months', months: 6 },
  { label: 'Last Year', months: 12 },
  { label: 'Last 3 Years', months: 36 },
]

interface DoctorPatientProfileViewProps {
  selectedPatientId: string
  patientProfile: any
  patientProfileLoading: boolean
  patientProfileError: string | null
  patientDietPlan: any
  activeProfileTab: string
  setActiveProfileTab: (tab: string) => void
  isRefreshingRisk: boolean
  profileSectionRef: RefObject<HTMLDivElement | null>
  onClose: () => void
  onIssuePrescription: (data: { patientId: string; patientName: string }) => void
  onRefreshRisk: () => void
  onSelectDietDay: (day: any) => void
  onSelectPrescription: (rx: any) => void
}

export function DoctorPatientProfileView({
  selectedPatientId,
  patientProfile,
  patientProfileLoading,
  patientProfileError,
  patientDietPlan,
  activeProfileTab,
  setActiveProfileTab,
  isRefreshingRisk,
  profileSectionRef,
  onClose,
  onIssuePrescription,
  onRefreshRisk,
  onSelectDietDay,
  onSelectPrescription,
}: DoctorPatientProfileViewProps) {
  const patient = patientProfile?.patient
  const reports = patientProfile?.reports || []
  const trends = patientProfile?.trends || []
  const diseaseRisks = patientProfile?.diseaseRisks || []
  const patientAppointments = patientProfile?.appointments || []
  const patientPrescriptions = patientProfile?.prescriptions || []

  const navigate = useNavigate()
  const [activeTrendFilter, setActiveTrendFilter] = useState(trendTimeFilters[2])

  const filteredMetrics = useMemo(() => {
    if (!Array.isArray(trends) || trends.length === 0) return []
    return trends.map((m: any) => {
      const rawData = m.data || []
      // Keep at least 3 points or max matching filter count so graph line is always rendered smoothly
      const sliceCount = Math.max(3, Math.min(rawData.length, activeTrendFilter.months * 2))
      return {
        ...m,
        data: rawData.slice(Math.max(0, rawData.length - sliceCount)),
      }
    })
  }, [trends, activeTrendFilter])

  return (
    <div ref={profileSectionRef} className="pt-6 border-t border-mist-200 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-8 px-2.5"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
          </Button>
          <h2 className="font-display text-xl font-bold text-ink">
            Patient Profile: {patient?.name || selectedPatientId}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/messages?patientId=${encodeURIComponent(patient?.patientId || patient?.patient_id_code || selectedPatientId)}`)}
            className="text-teal-700 border-teal-200 hover:bg-teal-50 text-xs h-8"
          >
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Message Patient
          </Button>
          <Button
            size="sm"
            onClick={() =>
              onIssuePrescription({
                patientId: selectedPatientId,
                patientName: patient?.name || selectedPatientId
              })
            }
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8"
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" /> Issue Prescription
          </Button>
        </div>
      </div>
      
      {patientProfileLoading ? (
        <div className="p-12 text-center text-xs text-ink-soft">Loading comprehensive patient record...</div>
      ) : patientProfileError ? (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center text-xs text-rose-600">
          {patientProfileError}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profile Sub-tabs */}
          <Tabs value={activeProfileTab} onValueChange={setActiveProfileTab} className="w-full">
            <TabsList className="bg-mist-100 p-1 rounded-xl">
              <TabsTrigger value="overview" className="text-xs font-semibold">Overview</TabsTrigger>
              <TabsTrigger value="reports" className="text-xs font-semibold">Medical Reports ({reports.length})</TabsTrigger>
              <TabsTrigger value="trends" className="text-xs font-semibold">Health Trends</TabsTrigger>
              <TabsTrigger value="risk" className="text-xs font-semibold">ML Risk Analysis</TabsTrigger>
              <TabsTrigger value="diet" className="text-xs font-semibold">Diet & Exercise</TabsTrigger>
              <TabsTrigger value="appointments" className="text-xs font-semibold">Appointments ({patientAppointments.length})</TabsTrigger>
              <TabsTrigger value="prescriptions" className="text-xs font-semibold">Prescriptions ({patientPrescriptions.length})</TabsTrigger>
            </TabsList>

            {/* Sub-tab 1: Overview */}
            <TabsContent value="overview" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 border-mist-200 bg-white">
                  <p className="text-xs font-bold text-ink uppercase tracking-wider">Demographics</p>
                  <div className="mt-3 space-y-1.5 text-xs text-ink-soft">
                    <p><strong className="text-ink">Patient ID:</strong> {patient?.patientId || patient?.id}</p>
                    <p><strong className="text-ink">Email:</strong> {patient?.email || 'N/A'}</p>
                    <p><strong className="text-ink">Age:</strong> {patient?.age ? `${patient.age} yrs` : 'Not recorded'}</p>
                    <p><strong className="text-ink">Gender:</strong> {patient?.gender || 'Not specified'}</p>
                    <p><strong className="text-ink">Blood Group:</strong> {patient?.bloodGroup || 'Not specified'}</p>
                    <p><strong className="text-ink">Height / Weight:</strong> {patient?.heightCm ? `${patient.heightCm} cm` : '—'} / {patient?.weightKg ? `${patient.weightKg} kg` : '—'}</p>
                  </div>
                </Card>

                <Card className="p-4 border-mist-200 bg-white">
                  <p className="text-xs font-bold text-ink uppercase tracking-wider">Latest Extracted Biomarkers</p>
                  <div className="mt-3 space-y-1.5 text-xs text-ink-soft">
                    <p><strong className="text-ink">Blood Glucose:</strong> {patientProfile?.latestVitals?.glucose ? `${patientProfile.latestVitals.glucose} mg/dL` : 'No reading'}</p>
                    <p><strong className="text-ink">HbA1c:</strong> {patientProfile?.latestVitals?.hba1c ? `${patientProfile.latestVitals.hba1c}%` : 'No reading'}</p>
                    <p><strong className="text-ink">Blood Pressure:</strong> {patientProfile?.latestVitals?.bp ? `${patientProfile.latestVitals.bp} mmHg` : 'No reading'}</p>
                    <p><strong className="text-ink">Cholesterol:</strong> {patientProfile?.latestVitals?.cholesterol ? `${patientProfile.latestVitals.cholesterol} mg/dL` : 'No reading'}</p>
                    <p><strong className="text-ink">Hemoglobin:</strong> {patientProfile?.latestVitals?.hemoglobin ? `${patientProfile.latestVitals.hemoglobin} g/dL` : 'No reading'}</p>
                    <p><strong className="text-ink">Creatinine:</strong> {patientProfile?.latestVitals?.creatinine ? `${patientProfile.latestVitals.creatinine} mg/dL` : 'No reading'}</p>
                  </div>
                </Card>

                <Card className="p-4 border-mist-200 bg-white">
                  <p className="text-xs font-bold text-ink uppercase tracking-wider">Clinical Notes & Contact</p>
                  <div className="mt-3 space-y-1.5 text-xs text-ink-soft">
                    <p><strong className="text-ink">Phone:</strong> {patient?.phone || 'Not recorded'}</p>
                    <p><strong className="text-ink">Smoking Habit:</strong> {patient?.smokingHabit || 'Non-smoker'}</p>
                    <p><strong className="text-ink">Activity Level:</strong> {patient?.activityLevel || 'Moderate'}</p>
                    <p><strong className="text-ink">Diet Preference:</strong> {patient?.dietaryPreference || 'Omnivore'}</p>
                    <p><strong className="text-ink">Existing Conditions:</strong> {Array.isArray(patient?.existingConditions) ? patient.existingConditions.join(', ') : (patient?.existingConditions || 'None reported')}</p>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Sub-tab 2: Medical Reports */}
            <TabsContent value="reports" className="space-y-4 pt-4">
              {reports.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-soft bg-white rounded-2xl border border-mist-200">
                  <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="font-semibold text-ink">No medical diagnostic reports uploaded yet.</p>
                  <p className="text-slate-400 mt-0.5">When the patient uploads PDF lab reports or enters manual health values, they will appear here with full OCR extraction.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((r: any) => (
                    <Card key={r.id} className="p-5 border-mist-200 bg-white space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-mist-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-ink">{r.originalFilename || r.source || 'Medical Diagnostic Report'}</h4>
                            <Badge className="bg-teal-50 text-teal-700 text-[10px] border-teal-200">
                              {r.fileType || r.type || 'LAB_REPORT'}
                            </Badge>
                          </div>
                          <p className="text-xs text-ink-soft mt-1">
                            <strong>Date:</strong> {r.reportDate ? toDDMMYYYY(r.reportDate) : 'Recent'}
                            {r.hospital && ` • Hospital: ${r.hospital}`}
                            {r.doctor && ` • Doctor: ${r.doctor}`}
                          </p>
                        </div>

                        {r.fileUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(r.fileUrl, '_blank')}
                            className="text-xs h-7 px-2.5 text-teal-700 border-teal-200"
                          >
                            View PDF Document
                          </Button>
                        )}
                      </div>

                      {/* Summary and Key Findings */}
                      {r.summary && (
                        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed">
                          <strong className="text-slate-800">AI Clinical Summary: </strong>
                          {r.summary}
                        </div>
                      )}

                      {/* Extracted Vitals / Biomarkers Table */}
                      {Array.isArray(r.vitals) && r.vitals.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-ink mb-2">Extracted Biomarker Readings ({r.vitals.length})</p>
                          <div className="overflow-x-auto rounded-xl border border-mist-200">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-mist-50 text-ink-soft font-semibold border-b border-mist-200">
                                <tr>
                                  <th className="py-2 px-3">Biomarker / Test</th>
                                  <th className="py-2 px-3">Measured Value</th>
                                  <th className="py-2 px-3">Unit</th>
                                  <th className="py-2 px-3">Normal Reference</th>
                                  <th className="py-2 px-3 text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-mist-100">
                                {r.vitals.map((v: any, vIdx: number) => (
                                  <tr key={vIdx} className="hover:bg-teal-50/20">
                                    <td className="py-2 px-3 font-semibold text-ink">{v.label}</td>
                                    <td className="py-2 px-3 font-mono text-ink font-bold">{v.value}</td>
                                    <td className="py-2 px-3 text-ink-soft">{v.unit || '—'}</td>
                                    <td className="py-2 px-3 text-ink-soft">{v.referenceRange || '—'}</td>
                                    <td className="py-2 px-3 text-right">
                                      <Badge
                                        className={cn(
                                          'text-[10px]',
                                          v.status === 'HIGH' || v.status === 'CRITICAL' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                          v.status === 'LOW' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        )}
                                      >
                                        {v.status || 'NORMAL'}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Sub-tab 3: Health Trends */}
            <TabsContent value="trends" className="space-y-4 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="inline-flex flex-wrap gap-1 rounded-xl bg-mist-100 p-1">
                  {trendTimeFilters.map((f) => (
                    <button
                      key={f.label}
                      onClick={() => setActiveTrendFilter(f)}
                      className={cn(
                        'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                        activeTrendFilter.label === f.label ? 'bg-white text-teal-700 shadow-xs' : 'text-ink-soft hover:text-ink'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-ink-soft">
                  Real longitudinal biomarker metrics extracted from patient reports & vitals
                </span>
              </div>

              {filteredMetrics.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-soft bg-white rounded-2xl border border-mist-200">
                  <Activity className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="font-semibold text-ink">No health trend records available yet.</p>
                  <p className="text-slate-400 mt-0.5">When medical reports or vital readings are uploaded for this patient, dynamic biomarker graphs will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMetrics.map((metric: any) => {
                    const latest = metric.data && metric.data.length > 0 ? metric.data[metric.data.length - 1] : null
                    const first = metric.data && metric.data.length > 0 ? metric.data[0] : null
                    const delta = latest && first ? Math.round((latest.value - first.value) * 10) / 10 : 0
                    const normMin = Array.isArray(metric.normalRange) ? metric.normalRange[0] : 0
                    const normMax = Array.isArray(metric.normalRange) ? metric.normalRange[1] : 100

                    return (
                      <Card key={metric.id} className="p-4 bg-white border-mist-200 rounded-2xl shadow-xs">
                        <div className="flex flex-row items-center justify-between pb-2 border-b border-mist-100">
                          <div>
                            <h4 className="font-bold text-sm text-ink">{metric.name}</h4>
                            <p className="text-[11px] text-ink-soft">
                              Normal range: {normMin}–{normMax} {metric.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-base font-bold text-ink">
                              {latest?.value ?? 'N/A'} <span className="text-xs font-normal text-ink-soft">{metric.unit}</span>
                            </p>
                            <p className={cn('text-[11px]', delta > 0 ? 'text-coral-600 font-medium' : delta < 0 ? 'text-teal-600 font-medium' : 'text-ink-soft')}>
                              {delta > 0 ? '+' : ''}{delta} over period
                            </p>
                          </div>
                        </div>
                        <div className="pt-3">
                          {metric.data && metric.data.length > 0 ? (
                            <TrendChart metric={metric} height={210} />
                          ) : (
                            <div className="flex h-48 items-center justify-center rounded-xl bg-mist-50 text-xs text-ink-soft">
                              No measurements recorded for {metric.name} yet.
                            </div>
                          )}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* Sub-tab 4: Risk Analysis */}
            <TabsContent value="risk" className="space-y-4 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-ink-soft">Random Forest Multi-Organ Disease Predictions (Real ML)</span>
                <Button size="sm" variant="outline" onClick={onRefreshRisk} disabled={isRefreshingRisk} className="text-xs h-7">
                  <RefreshCw className={cn('mr-1.5 h-3 w-3', isRefreshingRisk && 'animate-spin')} /> Refresh ML
                </Button>
              </div>

              {diseaseRisks.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-soft bg-white rounded-2xl border border-mist-200">
                  <ShieldAlert className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="font-semibold text-ink">No disease risk calculations generated yet.</p>
                  <p className="text-slate-400 mt-0.5">Upload a report or log vitals to run the Random Forest multi-organ risk models.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {diseaseRisks.map((dr: any, idx: number) => {
                    const prob = typeof dr.probability === 'number' ? dr.probability : (dr.percentage !== null && dr.percentage !== undefined ? dr.percentage / 100 : 0.2)
                    const percentage = dr.percentage !== null && dr.percentage !== undefined ? dr.percentage : Math.round(prob * 100)
                    const status = dr.status || dr.risk_level || (percentage >= 60 ? 'High' : percentage >= 30 ? 'Moderate' : 'Low')

                    return (
                      <div key={idx} className="flex flex-col justify-between p-4 bg-white rounded-2xl border border-mist-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-xs text-ink uppercase tracking-wide">{dr.name || dr.disease || 'Risk Assessment'}</p>
                          <Badge
                            className={cn(
                              'text-[10px]',
                              status === 'High' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                              status === 'Moderate' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200'
                            )}
                          >
                            {status} ({percentage}%)
                          </Badge>
                        </div>

                        <div className="flex justify-center py-1">
                          <RiskGauge percentage={percentage} status={status} />
                        </div>

                        {dr.explanation && (
                          <p className="text-[11px] text-ink-soft leading-relaxed border-t border-mist-100 pt-2">
                            {dr.explanation}
                          </p>
                        )}

                        {Array.isArray(dr.suggestions) && dr.suggestions.length > 0 && (
                          <div className="bg-mist-50/60 p-2.5 rounded-xl text-[11px] text-ink space-y-1">
                            <p className="font-bold text-slate-700 text-[10px] uppercase">Clinical Guidance:</p>
                            <ul className="list-disc list-inside space-y-0.5 text-ink-soft text-[10px]">
                              {dr.suggestions.map((sug: string, sIdx: number) => (
                                <li key={sIdx}>{sug}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* Sub-tab 5: Diet & Exercise */}
            <TabsContent value="diet" className="space-y-4 pt-4">
              <Card className="p-4 border-mist-200 bg-white">
                <h3 className="font-bold text-ink text-sm mb-3">IFCT 2017 Prescribed Meal Plan</h3>
                <WeeklyDietTable
                  weeklyPlan={patientDietPlan?.weeklyPlan || weeklyMealPlan}
                  onSelectDay={onSelectDietDay}
                />
              </Card>
            </TabsContent>

            {/* Sub-tab 6: Appointments */}
            <TabsContent value="appointments" className="space-y-4 pt-4">
              <div className="space-y-2">
                {patientAppointments.map((ap: any) => (
                  <div key={ap.id} className="p-3 border border-mist-200 rounded-xl bg-white flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-ink">{ap.appointment_number} - {ap.reason}</p>
                      <p className="text-ink-soft text-[11px]">{toDDMMYYYY(ap.appointment_date)} at {ap.appointment_time}</p>
                    </div>
                    <Badge className="bg-teal-50 text-teal-700">{ap.appointment_status}</Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Sub-tab 7: Prescriptions */}
            <TabsContent value="prescriptions" className="space-y-4 pt-4">
              <div className="space-y-2">
                {patientPrescriptions.map((rx: any) => (
                  <div key={rx.id} className="p-3 border border-mist-200 rounded-xl bg-white flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-ink">{rx.file_name || 'Prescription.pdf'}</p>
                      <p className="text-ink-soft text-[11px]">Uploaded on {toDDMMYYYY(rx.uploaded_at)}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => onSelectPrescription(rx)} className="text-xs h-7">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
