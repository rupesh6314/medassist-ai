import { useState } from 'react'
import { X, AlertCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AppointmentItem } from '@/services/appointmentService'

interface CancelAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: AppointmentItem | null
  onConfirmCancel: (appointmentId: string, reason?: string) => Promise<void>
}

export function CancelAppointmentModal({
  isOpen,
  onClose,
  appointment,
  onConfirmCancel,
}: CancelAppointmentModalProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen || !appointment) return null

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirmCancel(appointment.id, reason || 'Cancelled by physician.')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden bg-white rounded-2xl border border-mist-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-white border-b border-mist-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-ink">Cancel Appointment</h3>
              <p className="text-xs text-ink-soft">
                #{appointment.appointmentNumber} • {appointment.patientName}
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

        {/* Content */}
        <div className="p-5 space-y-3 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
            <p className="font-bold">Are you sure you want to cancel this appointment?</p>
            <p className="text-[11px] mt-0.5">The patient will be notified and the appointment will be marked as Cancelled.</p>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-ink">Reason for Cancellation (Optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Doctor emergency reschedule, patient requested cancellation..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-mist-200 text-xs text-ink focus:border-teal-600 focus:outline-none resize-none"
            />
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
            Keep Appointment
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={loading}
            onClick={handleConfirm}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-8 px-4"
          >
            {loading ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </div>
      </div>
    </div>
  )
}
