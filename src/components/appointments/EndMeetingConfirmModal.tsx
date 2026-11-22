import { useState } from 'react'
import { X, Square, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { AppointmentItem, ConsultationNotes } from '@/services/appointmentService'

interface EndMeetingConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: AppointmentItem | null
  onConfirmEnd: (appointmentId: string, notes?: Partial<ConsultationNotes>) => Promise<void>
}

export function EndMeetingConfirmModal({
  isOpen,
  onClose,
  appointment,
  onConfirmEnd,
}: EndMeetingConfirmModalProps) {
  const [assessment, setAssessment] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen || !appointment) return null

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirmEnd(appointment.id, {
        assessment: assessment || appointment.consultationNotes?.assessment || 'Consultation session concluded.',
        recommendations: recommendations || appointment.consultationNotes?.recommendations || 'Follow treatment regimen as discussed.',
        followUp: followUp || appointment.consultationNotes?.followUp || 'As scheduled.',
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden bg-white rounded-2xl border border-mist-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-white border-b border-mist-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Square className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-ink">End Consultation Session</h3>
              <p className="text-xs text-ink-soft">
                Conclude #{appointment.appointmentNumber} with {appointment.patientName}
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

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>Are you ready to conclude this consultation?</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Ending the meeting will stop the live timer, calculate final duration, mark appointment as COMPLETED, and enable digital prescription issuance.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <h4 className="font-bold text-ink uppercase tracking-wider text-[11px]">
              Quick Consultation Assessment (Optional)
            </h4>

            <div className="space-y-1">
              <label className="font-medium text-ink-soft">Clinical Assessment / Diagnosis</label>
              <textarea
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                placeholder="Key clinical impressions, diagnosis, or findings..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-mist-200 text-xs text-ink focus:border-teal-600 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-ink-soft">Management Plan & Rx Advice</label>
              <textarea
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Prescribed medicines, dietary guidance, precautions..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-mist-200 text-xs text-ink focus:border-teal-600 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-ink-soft">Follow-up Recommendation</label>
              <input
                type="text"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                placeholder="e.g., Return in 2 weeks or schedule next visit"
                className="w-full px-3 py-2 rounded-xl border border-mist-200 text-xs text-ink focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 bg-mist-50 border-t border-mist-200">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-8"
          >
            Stay in Consultation
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={loading}
            onClick={handleConfirm}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-8 px-4"
          >
            {loading ? 'Concluding...' : 'Confirm & End Meeting'}
          </Button>
        </div>
      </div>
    </div>
  )
}
