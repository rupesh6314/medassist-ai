import { useState } from 'react'
import { X, UserX, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AppointmentItem } from '@/services/appointmentService'

interface NoShowModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: AppointmentItem | null
  onConfirmNoShow: (appointmentId: string, note?: string) => Promise<void>
}

export function NoShowModal({
  isOpen,
  onClose,
  appointment,
  onConfirmNoShow,
}: NoShowModalProps) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen || !appointment) return null

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirmNoShow(appointment.id, note || 'Patient did not attend scheduled consultation.')
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-ink">Mark as No-Show</h3>
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
          <p className="text-ink-soft leading-relaxed">
            Marking this appointment as <strong>No-Show</strong> indicates the patient was not available at the scheduled time. This appointment will remain recorded in patient consultation history.
          </p>

          <div className="space-y-1">
            <label className="font-semibold text-ink">Physician Note (Optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Waited 15 minutes, patient did not join online room..."
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
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={loading}
            onClick={handleConfirm}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold h-8 px-4"
          >
            {loading ? 'Saving...' : 'Confirm No-Show'}
          </Button>
        </div>
      </div>
    </div>
  )
}
