import { useState } from 'react'
import { X, Calendar, Clock, Video, Hospital, Repeat, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'
import { toDDMMYYYY, type AppointmentItem } from '@/services/appointmentService'

interface ScheduleFollowUpModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: AppointmentItem | null
  onSchedule: (
    originalAppointmentId: string,
    data: {
      appointmentDate: string
      appointmentTime: string
      appointmentType: 'online' | 'offline'
      reason: string
    }
  ) => Promise<void>
}

const AVAILABLE_SLOTS = [
  '09:00 AM',
  '10:30 AM',
  '11:45 AM',
  '02:00 PM',
  '03:30 PM',
  '05:00 PM',
]

export function ScheduleFollowUpModal({
  isOpen,
  onClose,
  appointment,
  onSchedule,
}: ScheduleFollowUpModalProps) {
  const [date, setDate] = useState(() => {
    const nextWk = new Date()
    nextWk.setDate(nextWk.getDate() + 7)
    const y = nextWk.getFullYear()
    const m = String(nextWk.getMonth() + 1).padStart(2, '0')
    const d = String(nextWk.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  })
  const [time, setTime] = useState('10:30 AM')
  const [type, setType] = useState<'online' | 'offline'>('online')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen || !appointment) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSchedule(appointment.id, {
        appointmentDate: toDDMMYYYY(date),
        appointmentTime: time,
        appointmentType: type,
        reason: reason || `Follow-up review for previous consultation #${appointment.appointmentNumber}`,
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Repeat className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-ink">Schedule Follow-up</h3>
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
            {/* Consultation Mode */}
            <div className="space-y-1.5">
              <label className="font-bold text-ink">Consultation Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('online')}
                  className={cn(
                    'flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer',
                    type === 'online'
                      ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-xs'
                      : 'border-mist-200 bg-white text-ink-soft hover:border-mist-300'
                  )}
                >
                  <Video className="h-4 w-4 text-teal-600" />
                  Online Tele-Health
                </button>

                <button
                  type="button"
                  onClick={() => setType('offline')}
                  className={cn(
                    'flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer',
                    type === 'offline'
                      ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-xs'
                      : 'border-mist-200 bg-white text-ink-soft hover:border-mist-300'
                  )}
                >
                  <Hospital className="h-4 w-4 text-teal-600" />
                  In-Clinic (Room 2)
                </button>
              </div>
            </div>

            {/* Date Picker */}
            <div className="space-y-1.5">
              <label className="font-bold text-ink">Follow-up Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  min={(() => {
                    const t = new Date()
                    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
                  })()}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-mist-200 text-xs text-ink focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Time Slots */}
            <div className="space-y-1.5">
              <label className="font-bold text-ink">Select Time Slot</label>
              <div className="grid grid-cols-3 gap-2">
                {AVAILABLE_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTime(slot)}
                    className={cn(
                      'py-2 px-2.5 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer',
                      time === slot
                        ? 'bg-teal-600 text-white border-teal-600 font-bold shadow-xs'
                        : 'bg-white border-mist-200 text-ink-soft hover:border-teal-200'
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="font-bold text-ink">Clinical Follow-up Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Review repeat lipid panel, glucose trends, medication titration..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-mist-200 text-xs text-ink focus:border-teal-600 focus:outline-none resize-none leading-relaxed"
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
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold h-8 px-4"
            >
              {loading ? 'Scheduling...' : 'Confirm Follow-up Appointment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
