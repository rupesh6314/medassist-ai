import { useState, useEffect } from 'react'
import { X, FileText, CheckCircle2, Stethoscope, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { AppointmentItem, ConsultationNotes } from '@/services/appointmentService'

interface ConsultationNotesModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: AppointmentItem | null
  onSaveNotes: (appointmentId: string, notes: ConsultationNotes) => Promise<void>
  onOpenPrescriptionModal?: (appt: AppointmentItem) => void
}

export function ConsultationNotesModal({
  isOpen,
  onClose,
  appointment,
  onSaveNotes,
  onOpenPrescriptionModal,
}: ConsultationNotesModalProps) {
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [observations, setObservations] = useState('')
  const [assessment, setAssessment] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (appointment) {
      const n = appointment.consultationNotes
      setChiefComplaint(n?.chiefComplaint || appointment.reason || '')
      setSymptoms(n?.symptoms || '')
      setObservations(n?.observations || '')
      setAssessment(n?.assessment || '')
      setRecommendations(n?.recommendations || '')
      setFollowUp(n?.followUp || '')
    }
  }, [appointment])

  if (!isOpen || !appointment) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSaveNotes(appointment.id, {
        appointmentId: appointment.id,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        chiefComplaint,
        symptoms,
        observations,
        assessment,
        recommendations,
        followUp,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-mist-200 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-white border-b border-mist-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-ink">Clinical Consultation Notes</h3>
                <Badge className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] font-mono">
                  #{appointment.appointmentNumber}
                </Badge>
              </div>
              <p className="text-xs text-ink-soft">
                Patient: <strong className="text-ink">{appointment.patientName}</strong> ({appointment.patientCode || appointment.patientId})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-mist-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4 text-xs">
            {/* Chief Complaint */}
            <div className="space-y-1.5">
              <label className="font-bold text-ink flex items-center justify-between">
                <span>Chief Complaint</span>
                <span className="text-[10px] text-ink-soft font-normal">Primary reason for consult</span>
              </label>
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="e.g., Elevated blood sugar, acute headaches, follow-up..."
                className="w-full px-3 py-2 rounded-xl border border-mist-200 text-xs text-ink focus:border-teal-600 focus:outline-none"
              />
            </div>

            {/* Symptoms Reported */}
            <div className="space-y-1.5">
              <label className="font-bold text-ink">Symptoms & Clinical Presentation</label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={2}
                placeholder="Describe patient-reported symptoms, onset, severity, duration..."
                className="w-full px-3 py-2 rounded-xl border border-mist-200 text-xs text-ink focus:border-teal-600 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Observations & Physical Examination */}
            <div className="space-y-1.5">
              <label className="font-bold text-ink">Physical Observations & Biomarkers</label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={2}
                placeholder="BP: 120/80 mmHg, Pulse: 72 bpm, SpO2: 98%, heart sounds, respiratory observations..."
                className="w-full px-3 py-2 rounded-xl border border-mist-200 text-xs text-ink focus:border-teal-600 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Assessment & Clinical Diagnosis */}
            <div className="space-y-1.5">
              <label className="font-bold text-ink">Assessment / Clinical Diagnosis</label>
              <textarea
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                rows={2}
                placeholder="Clinical evaluation, disease stage, differential diagnosis..."
                className="w-full px-3 py-2 rounded-xl border border-mist-200 text-xs text-ink focus:border-teal-600 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Recommendations & Treatment Plan */}
            <div className="space-y-1.5">
              <label className="font-bold text-ink">Management Plan & Clinical Recommendations</label>
              <textarea
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                rows={2}
                placeholder="Medications prescribed, lifestyle modifications, diet adjustments..."
                className="w-full px-3 py-2 rounded-xl border border-mist-200 text-xs text-ink focus:border-teal-600 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Follow-up instructions */}
            <div className="space-y-1.5">
              <label className="font-bold text-ink">Follow-Up Instructions</label>
              <input
                type="text"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                placeholder="e.g., Return in 2 weeks with repeat fasting glucose and lipid panel..."
                className="w-full px-3 py-2 rounded-xl border border-mist-200 text-xs text-ink focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 z-10 flex items-center justify-between p-4 bg-mist-50 border-t border-mist-200">
            {onOpenPrescriptionModal ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose()
                  onOpenPrescriptionModal(appointment)
                }}
                className="text-xs text-teal-700 border-teal-200 hover:bg-teal-50 h-8"
              >
                <FileText className="mr-1.5 h-3.5 w-3.5" /> Upload Prescription PDF
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold h-8 px-4"
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {saving ? 'Saving Notes...' : 'Save Consultation Notes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
