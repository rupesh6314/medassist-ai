import {
  X,
  Calendar,
  Clock,
  Video,
  Hospital,
  User,
  CreditCard,
  FileText,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  Repeat,
  ShieldCheck,
  Activity,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { toDDMMYYYY, type AppointmentItem } from '@/services/appointmentService'

interface AppointmentDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: AppointmentItem | null
  onStartMeeting: (appt: AppointmentItem) => void
  onEndMeeting: (appt: AppointmentItem) => void
  onOpenMeeting: (appt: AppointmentItem) => void
  onOpenPatientProfile: (patientId: string) => void
  onMessagePatient: (patientId: string) => void
  onOpenPrescriptionModal: (appt: AppointmentItem) => void
  onOpenNotesModal: (appt: AppointmentItem) => void
  onOpenFollowUpModal: (appt: AppointmentItem) => void
  onMarkNoShow: (appt: AppointmentItem) => void
  onCancelAppointment: (appt: AppointmentItem) => void
  onMarkComplete: (appt: AppointmentItem) => void
}

export function AppointmentDetailsModal({
  isOpen,
  onClose,
  appointment,
  onStartMeeting,
  onEndMeeting,
  onOpenMeeting,
  onOpenPatientProfile,
  onMessagePatient,
  onOpenPrescriptionModal,
  onOpenNotesModal,
  onOpenFollowUpModal,
  onMarkNoShow,
  onCancelAppointment,
  onMarkComplete,
}: AppointmentDetailsModalProps) {
  if (!isOpen || !appointment) return null

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const isConfirmed = appointment.appointmentStatus === 'confirmed'
  const isCompleted = appointment.appointmentStatus === 'completed'
  const isCancelled = appointment.appointmentStatus === 'cancelled'
  const isNoShow = appointment.appointmentStatus === 'no_show'
  const isInProgress = appointment.meetingStatus === 'in_progress'
  const isMeetingEnded = appointment.meetingStatus === 'ended'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-mist-200 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-white border-b border-mist-100">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                appointment.appointmentType === 'online' ? 'bg-teal-50 text-teal-700' : 'bg-blue-50 text-blue-700'
              )}
            >
              {appointment.appointmentType === 'online' ? <Video className="h-5 w-5" /> : <Hospital className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-ink">
                  Appointment #{appointment.appointmentNumber}
                </h3>
                <Badge
                  className={cn(
                    'text-[10px] font-semibold uppercase',
                    isConfirmed && 'bg-teal-50 text-teal-700 border-teal-200',
                    isCompleted && 'bg-blue-50 text-blue-700 border-blue-200',
                    isCancelled && 'bg-rose-50 text-rose-600 border-rose-200',
                    isNoShow && 'bg-amber-50 text-amber-700 border-amber-200'
                  )}
                >
                  {appointment.appointmentStatus.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-xs text-ink-soft">
                {appointment.appointmentType === 'online' ? 'Online Tele-Consultation' : 'In-Clinic Consultation'} • Created on {toDDMMYYYY(appointment.createdAt)}
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
        <div className="p-5 space-y-5">
          {/* Meeting Status Alert Banner if In Progress */}
          {isInProgress && (
            <div className="flex items-center justify-between p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-xs">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-600"></span>
                </span>
                <div>
                  <p className="font-bold text-teal-900">Consultation Meeting In Progress</p>
                  <p className="text-teal-700 text-[11px]">Started at {appointment.actualStartTime || 'Recently'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => onOpenMeeting(appointment)}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 px-3"
                >
                  <Video className="mr-1.5 h-3.5 w-3.5" /> Open Room
                </Button>
                <Button
                  size="sm"
                  onClick={() => onEndMeeting(appointment)}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8 px-3"
                >
                  <Square className="mr-1.5 h-3.5 w-3.5" /> End Meeting
                </Button>
              </div>
            </div>
          )}

          {/* Patient Profile Card */}
          <div className="p-4 bg-mist-50 rounded-xl border border-mist-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-800 font-display font-bold text-sm border border-teal-200">
                  {appointment.patientName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-ink">{appointment.patientName}</h4>
                  <div className="flex items-center gap-2 text-xs text-ink-soft">
                    <span className="font-mono text-teal-700">ID: {appointment.patientCode || appointment.patientId}</span>
                    <span>•</span>
                    <span>{appointment.patientAge ? `${appointment.patientAge} yrs` : 'Age N/A'}</span>
                    <span>•</span>
                    <span>{appointment.patientGender || 'Gender N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMessagePatient(appointment.patientCode || appointment.patientId)}
                  className="text-xs h-8 text-teal-700 border-teal-200 hover:bg-teal-50"
                >
                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Message
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenPatientProfile(appointment.patientCode || appointment.patientId)}
                  className="text-xs h-8 border-mist-200"
                >
                  <User className="mr-1.5 h-3.5 w-3.5" /> View Patient
                </Button>
              </div>
            </div>
          </div>

          {/* Schedule & Timing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-white rounded-xl border border-mist-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Scheduled Timing</span>
              <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                <Calendar className="h-4 w-4 text-teal-600" />
                <span>{toDDMMYYYY(appointment.appointmentDate)}</span>
                <Clock className="ml-2 h-4 w-4 text-teal-600" />
                <span>{appointment.appointmentTime}</span>
              </div>
              <p className="text-[11px] text-ink-soft">Prescheduled booking slot</p>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-mist-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Actual Consultation Session</span>
              <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                <Activity className="h-4 w-4 text-teal-600" />
                <span>
                  {appointment.meetingStatus === 'not_started'
                    ? 'Not Started'
                    : appointment.actualStartTime
                    ? `Started at ${appointment.actualStartTime}`
                    : 'In Progress'}
                </span>
                {appointment.meetingDurationSeconds && appointment.meetingDurationSeconds > 0 ? (
                  <span className="ml-auto font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-[11px]">
                    {formatDuration(appointment.meetingDurationSeconds)}
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-ink-soft">
                Meeting Status:{' '}
                <strong className="text-ink uppercase">{appointment.meetingStatus.replace('_', ' ')}</strong>
              </p>
            </div>
          </div>

          {/* Reason & Location Details */}
          <div className="p-4 rounded-xl border border-mist-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink">Clinical Reason / Chief Complaint</span>
              <div className="flex items-center gap-1.5 text-xs text-ink-soft">
                <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                <span>Fee: <strong className="text-ink">₹{appointment.fee}</strong> ({appointment.paymentStatus.toUpperCase()})</span>
              </div>
            </div>
            <p className="text-xs text-ink-soft bg-mist-50 p-2.5 rounded-lg leading-relaxed">
              {appointment.reason || 'General Health Consultation'}
            </p>
            {appointment.appointmentType === 'offline' && (
              <div className="pt-2 flex items-center gap-2 text-xs text-ink-soft">
                <Hospital className="h-4 w-4 text-teal-600 shrink-0" />
                <span>
                  <strong>Location:</strong> {appointment.clinicAddress || 'MediAssist Medical Center, Suite 302'} • {appointment.clinicRoom || 'Consultation Room 2'}
                </span>
              </div>
            )}
          </div>

          {/* Consultation Notes Preview (if any) */}
          {appointment.consultationNotes && (
            <div className="p-4 rounded-xl border border-mist-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-700" />
                  <span className="text-xs font-bold text-ink">Clinical Consultation Notes</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenNotesModal(appointment)}
                  className="text-xs h-7 px-2.5 text-teal-700 border-teal-200"
                >
                  Edit / Expand
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-mist-50 rounded-lg">
                  <span className="text-[10px] font-bold text-ink-soft uppercase">Assessment</span>
                  <p className="text-ink mt-0.5 text-[11px] line-clamp-2">{appointment.consultationNotes.assessment || 'N/A'}</p>
                </div>
                <div className="p-2 bg-mist-50 rounded-lg">
                  <span className="text-[10px] font-bold text-ink-soft uppercase">Recommendations</span>
                  <p className="text-ink mt-0.5 text-[11px] line-clamp-2">{appointment.consultationNotes.recommendations || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          {appointment.timeline && appointment.timeline.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-ink uppercase tracking-wider">Appointment Lifecycle Timeline</span>
              <div className="relative pl-6 space-y-3 border-l-2 border-mist-200 ml-3">
                {appointment.timeline.map((event, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full bg-white border-2 border-teal-600 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                    </div>
                    <div className="text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink">{event.event}</span>
                        <span className="text-[10px] text-ink-soft">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                      </div>
                      {event.description && <p className="text-[11px] text-ink-soft mt-0.5">{event.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 p-4 bg-mist-50 border-t border-mist-200">
          <div className="flex items-center gap-2">
            {isConfirmed && !isInProgress && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancelAppointment(appointment)}
                className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 h-8"
              >
                Cancel Appointment
              </Button>
            )}
            {isConfirmed && !isInProgress && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkNoShow(appointment)}
                className="text-xs text-amber-700 border-amber-200 hover:bg-amber-50 h-8"
              >
                Mark No-Show
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Context Actions */}
            {isConfirmed && !isInProgress && (
              <Button
                size="sm"
                onClick={() => onStartMeeting(appointment)}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold h-8 px-4 rounded-lg shadow-xs"
              >
                <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                {appointment.appointmentType === 'online' ? 'Start Meeting' : 'Start Consultation'}
              </Button>
            )}

            {isInProgress && (
              <>
                <Button
                  size="sm"
                  onClick={() => onOpenMeeting(appointment)}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold h-8 px-3"
                >
                  <Video className="mr-1.5 h-3.5 w-3.5" /> Open Meeting
                </Button>
                <Button
                  size="sm"
                  onClick={() => onEndMeeting(appointment)}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-8 px-3"
                >
                  <Square className="mr-1.5 h-3.5 w-3.5" /> End Meeting
                </Button>
              </>
            )}

            {isCompleted && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenNotesModal(appointment)}
                  className="text-xs h-8 text-teal-700 border-teal-200 hover:bg-teal-50"
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5" /> Consultation Notes
                </Button>
                <Button
                  size="sm"
                  onClick={() => onOpenPrescriptionModal(appointment)}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold h-8 px-3"
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5" /> Upload Rx
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenFollowUpModal(appointment)}
                  className="text-xs h-8 border-mist-200"
                >
                  <Repeat className="mr-1.5 h-3.5 w-3.5" /> Schedule Follow-up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
