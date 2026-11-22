import { useState, useEffect, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  Video,
  Hospital,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  FileText,
  MessageSquare,
  User,
  Square,
  Play,
  Repeat,
  AlertCircle,
  Plus,
  RefreshCw,
  MoreVertical,
  Activity,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  UserX,
  XCircle,
  SlidersHorizontal,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  appointmentService,
  sortAppointmentsByPriority,
  toDDMMYYYY,
  normalizeDateString,
  getDateSortKey,
  type AppointmentItem,
  type ConsultationNotes,
} from '@/services/appointmentService'
import { AppointmentDetailsModal } from '@/components/appointments/AppointmentDetailsModal'
import { ConsultationNotesModal } from '@/components/appointments/ConsultationNotesModal'
import { ScheduleFollowUpModal } from '@/components/appointments/ScheduleFollowUpModal'
import { EndMeetingConfirmModal } from '@/components/appointments/EndMeetingConfirmModal'
import { NoShowModal } from '@/components/appointments/NoShowModal'
import { CancelAppointmentModal } from '@/components/appointments/CancelAppointmentModal'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/utils/cn'

interface DoctorAppointmentsTabProps {
  appointments?: any[]
  appointmentsLoading?: boolean
  appointmentStatusFilter?: string
  setAppointmentStatusFilter?: (status: string) => void
  onNavigate: (path: string) => void
  onIssuePrescription: (data: { patientId: string; patientName: string; appointmentId?: string; appointmentNumber?: string }) => void
  onMarkAppointmentComplete?: (id: string) => void
  onOpenPatientProfile?: (patientId: string) => void
}

type TabCategory = 'all' | 'today' | 'active' | 'upcoming' | 'completed' | 'cancelled'

export function DoctorAppointmentsTab({
  onNavigate,
  onIssuePrescription,
  onOpenPatientProfile,
}: DoctorAppointmentsTabProps) {
  const { showToast } = useToast()

  const [appointments, setAppointments] = useState<AppointmentItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filtering and Searching State
  const [activeTabCategory, setActiveTabCategory] = useState<TabCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [dateFilter, setDateFilter] = useState<string>('')

  // Modals state
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false)
  const [isEndMeetingModalOpen, setIsEndMeetingModalOpen] = useState(false)
  const [isNoShowModalOpen, setIsNoShowModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  // Live seconds tick for duration calculation
  const [liveSeconds, setLiveSeconds] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveSeconds((s) => s + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Load appointments function (silent = true prevents full screen loader flicker)
  const loadAppointments = async (silent = true) => {
    if (!silent && appointments.length === 0) {
      setLoading(true)
    }
    try {
      const data = await appointmentService.getAppointments()
      setAppointments(data)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments(false)

    // Listen for cross-component update events
    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setAppointments(sortAppointmentsByPriority(e.detail))
      } else {
        loadAppointments(true)
      }
    }
    window.addEventListener('medassist:appointments_updated', handleUpdate)
    return () => window.removeEventListener('medassist:appointments_updated', handleUpdate)
  }, [])

  // Calculate live duration formatted
  const getMeetingDurationFormatted = (appt: AppointmentItem) => {
    if (appt.meetingStatus === 'ended' || appt.appointmentStatus === 'completed') {
      const secs = appt.meetingDurationSeconds || 0
      const m = Math.floor(secs / 60)
      const s = secs % 60
      return `${m}m ${s}s`
    }

    if (appt.meetingStatus === 'in_progress' && appt.meetingStartedAt) {
      const startMs = new Date(appt.meetingStartedAt).getTime()
      const nowMs = Date.now()
      const totalSecs = Math.max(0, Math.floor((nowMs - startMs) / 1000))
      const m = Math.floor(totalSecs / 60)
      const s = totalSecs % 60
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }

    return '00:00'
  }

  // Action Handlers
  const handleStartMeeting = async (appt: AppointmentItem) => {
    try {
      const updated = await appointmentService.startMeeting(appt.id, 'D000001')
      showToast('Meeting Started', `Consultation #${updated.appointmentNumber} with ${updated.patientName} is now in progress.`, 'success')
      loadAppointments(true)

      // Redirect to consultation room if online
      if (appt.appointmentType === 'online') {
        onNavigate(`/consultation/${appt.appointmentNumber.toLowerCase()}`)
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to start meeting.', 'danger')
    }
  }

  const handleOpenMeeting = (appt: AppointmentItem) => {
    if (appt.appointmentType === 'online') {
      onNavigate(`/consultation/${appt.appointmentNumber.toLowerCase()}`)
    } else {
      setSelectedAppointment(appt)
      setIsDetailsModalOpen(true)
    }
  }

  const handleEndMeeting = async (appointmentId: string, notes?: Partial<ConsultationNotes>) => {
    try {
      const updated = await appointmentService.endMeeting(appointmentId, notes)
      showToast('Meeting Ended', `Consultation #${updated.appointmentNumber} concluded. Duration recorded.`, 'success')
      loadAppointments(true)
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to end meeting.', 'danger')
    }
  }

  const handleSaveNotes = async (appointmentId: string, notes: ConsultationNotes) => {
    try {
      await appointmentService.saveConsultationNotes(appointmentId, notes)
      showToast('Notes Saved', 'Clinical consultation notes saved successfully.', 'success')
      loadAppointments(true)
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to save notes.', 'danger')
    }
  }

  const handleScheduleFollowUp = async (
    originalAppointmentId: string,
    data: {
      appointmentDate: string
      appointmentTime: string
      appointmentType: 'online' | 'offline'
      reason: string
    }
  ) => {
    try {
      const created = await appointmentService.scheduleFollowUp(originalAppointmentId, data)
      showToast('Follow-up Scheduled', `Follow-up #${created.appointmentNumber} scheduled for ${created.patientName} on ${data.appointmentDate}.`, 'success')
      loadAppointments(true)
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to schedule follow-up.', 'danger')
    }
  }

  const handleMarkNoShow = async (appointmentId: string, note?: string) => {
    try {
      await appointmentService.markNoShow(appointmentId, note)
      showToast('Marked No-Show', 'Appointment marked as No-Show in consultation records.', 'info')
      loadAppointments(true)
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to mark as No-Show.', 'danger')
    }
  }

  const handleCancelAppointment = async (appointmentId: string, reason?: string) => {
    try {
      await appointmentService.cancelAppointment(appointmentId, reason)
      showToast('Appointment Cancelled', 'Appointment has been cancelled.', 'info')
      loadAppointments(true)
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to cancel appointment.', 'danger')
    }
  }

  const handleMarkCompleteDirect = async (appt: AppointmentItem) => {
    try {
      await appointmentService.markCompleted(appt.id)
      showToast('Completed', `Appointment #${appt.appointmentNumber} marked as completed.`, 'success')
      loadAppointments(true)
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to complete appointment.', 'danger')
    }
  }

  const handleMessage = (patientCodeOrId: string) => {
    onNavigate(`/messages?patientId=${encodeURIComponent(patientCodeOrId)}`)
  }

  const handlePatientProfile = (patientCodeOrId: string) => {
    if (onOpenPatientProfile) {
      onOpenPatientProfile(patientCodeOrId)
    } else {
      onNavigate(`/doctor-dashboard?tab=patients&patientId=${encodeURIComponent(patientCodeOrId)}`)
    }
  }

  // Today Date String in DD-MM-YYYY format
  const todayStr = useMemo(() => toDDMMYYYY(new Date()), [])
  const todaySortKey = useMemo(() => getDateSortKey(todayStr), [todayStr])

  // Categorized Appointments with Normalized Dates
  const activeConsultations = useMemo(
    () => appointments.filter((a) => a.meetingStatus === 'in_progress'),
    [appointments]
  )

  const todayAppointments = useMemo(
    () => appointments.filter((a) => normalizeDateString(a.appointmentDate) === todayStr),
    [appointments, todayStr]
  )

  const upcomingAppointments = useMemo(
    () => appointments.filter((a) => {
      const apptKey = getDateSortKey(a.appointmentDate)
      return apptKey > todaySortKey && a.appointmentStatus !== 'cancelled'
    }),
    [appointments, todaySortKey]
  )

  const completedConsultations = useMemo(
    () => appointments.filter((a) => a.appointmentStatus === 'completed' || a.meetingStatus === 'ended'),
    [appointments]
  )

  const cancelledAndNoShow = useMemo(
    () => appointments.filter((a) => a.appointmentStatus === 'cancelled' || a.appointmentStatus === 'no_show'),
    [appointments]
  )

  // Filtered Appointments based on Current View Tab & Controls
  const filteredAppointments = useMemo(() => {
    let list = [...appointments]

    // Tab Category Filter
    if (activeTabCategory === 'today') {
      list = list.filter((a) => normalizeDateString(a.appointmentDate) === todayStr)
    } else if (activeTabCategory === 'active') {
      list = list.filter((a) => a.meetingStatus === 'in_progress')
    } else if (activeTabCategory === 'upcoming') {
      list = list.filter((a) => {
        const apptKey = getDateSortKey(a.appointmentDate)
        return apptKey > todaySortKey && a.appointmentStatus !== 'cancelled'
      })
    } else if (activeTabCategory === 'completed') {
      list = list.filter((a) => a.appointmentStatus === 'completed' || a.meetingStatus === 'ended')
    } else if (activeTabCategory === 'cancelled') {
      list = list.filter((a) => a.appointmentStatus === 'cancelled' || a.appointmentStatus === 'no_show')
    }

    // Status Filter dropdown
    if (statusFilter !== 'ALL') {
      const s = statusFilter.toLowerCase()
      if (s === 'in_progress') {
        list = list.filter((a) => a.meetingStatus === 'in_progress')
      } else {
        list = list.filter((a) => a.appointmentStatus.toLowerCase() === s)
      }
    }

    // Type Filter
    if (typeFilter !== 'ALL') {
      list = list.filter((a) => a.appointmentType.toLowerCase() === typeFilter.toLowerCase())
    }

    // Date Filter
    if (dateFilter) {
      list = list.filter((a) => normalizeDateString(a.appointmentDate) === normalizeDateString(dateFilter))
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (a) =>
          a.patientName?.toLowerCase().includes(q) ||
          a.patientCode?.toLowerCase().includes(q) ||
          a.patientId?.toLowerCase().includes(q) ||
          a.appointmentNumber?.toLowerCase().includes(q) ||
          a.reason?.toLowerCase().includes(q) ||
          a.appointmentDate?.toLowerCase().includes(q)
      )
    }

    return sortAppointmentsByPriority(list)
  }, [appointments, activeTabCategory, statusFilter, typeFilter, dateFilter, searchQuery, todayStr])

  return (
    <div className="space-y-6">
      {/* Top Section Header & KPI summary pills */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-mist-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-xl text-ink">Clinical Appointments & Consultations</h2>
            {activeConsultations.length > 0 && (
              <span className="flex items-center gap-1 bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold px-2.5 py-0.5 rounded-full animate-pulse">
                <span className="h-2 w-2 rounded-full bg-teal-600 animate-ping" />
                {activeConsultations.length} Active Meeting{activeConsultations.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-ink-soft mt-1">
            Manage end-to-end appointment lifecycle, launch tele-consultations, conduct in-clinic sessions, record notes, and issue prescriptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadAppointments()
              showToast('Refreshed', 'Appointments synchronized.', 'info')
            }}
            className="text-xs h-9 border-mist-200"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Sync
          </Button>
        </div>
      </div>

      {/* SECTION 1: ACTIVE MEETINGS BANNER (if any active meeting exists) */}
      {activeConsultations.length > 0 && (
        <div className="bg-gradient-to-r from-teal-700 to-teal-900 rounded-2xl p-4 sm:p-5 text-white shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white animate-pulse">
                <Video className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm tracking-wide">
                  ACTIVE CONSULTATION IN PROGRESS
                </h3>
                <p className="text-[11px] text-teal-100">
                  Doctor session is currently live and active.
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-500 text-white border-none text-[10px] font-mono uppercase tracking-wider">
              Live Session
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {activeConsultations.map((active) => (
              <div
                key={active.id}
                className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm truncate">{active.patientName}</span>
                    <span className="text-[11px] font-mono text-teal-200">#{active.appointmentNumber}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-teal-100">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-teal-300" />
                      Started: {active.actualStartTime || 'Recently'}
                    </span>
                    <span className="flex items-center gap-1 font-mono font-bold text-emerald-300">
                      <Activity className="h-3.5 w-3.5" />
                      {getMeetingDurationFormatted(active)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleOpenMeeting(active)}
                    className="bg-white text-teal-900 hover:bg-teal-50 font-bold text-xs h-8 px-3.5 rounded-lg shadow-xs"
                  >
                    <Video className="mr-1.5 h-3.5 w-3.5" /> Open Room
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedAppointment(active)
                      setIsEndMeetingModalOpen(true)
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8 px-3 rounded-lg shadow-xs"
                  >
                    <Square className="mr-1.5 h-3.5 w-3.5" /> End Meeting
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Tab Navigation & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-mist-200 shadow-xs space-y-4">
        {/* Sub-tab navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-mist-100 pb-3">
          <div className="flex flex-wrap items-center gap-1">
            {[
              { key: 'all', label: 'All Appointments', count: appointments.length },
              { key: 'today', label: "Today's", count: todayAppointments.length },
              { key: 'active', label: 'Active Meetings', count: activeConsultations.length },
              { key: 'upcoming', label: 'Upcoming', count: upcomingAppointments.length },
              { key: 'completed', label: 'Completed History', count: completedConsultations.length },
              { key: 'cancelled', label: 'Cancelled / No-Show', count: cancelledAndNoShow.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTabCategory(tab.key as TabCategory)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                  activeTabCategory === tab.key
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-ink-soft hover:text-ink hover:bg-mist-100'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                    activeTabCategory === tab.key ? 'bg-teal-700 text-white' : 'bg-mist-200 text-ink-soft'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <span className="text-xs text-ink-soft hidden lg:inline">
            Showing <strong>{filteredAppointments.length}</strong> of <strong>{appointments.length}</strong> appointments
          </span>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-center">
          {/* Search bar (6 cols) */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-soft" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, ID, APT number, reason..."
              className="pl-9 text-xs h-9 bg-mist-50/50"
            />
          </div>

          {/* Status Dropdown (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs border border-mist-200 rounded-lg px-2.5 py-2 bg-white text-ink cursor-pointer focus:border-teal-600 focus:outline-none"
            >
              <option value="ALL">Status: All</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No-Show</option>
            </select>
          </div>

          {/* Type Dropdown (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full text-xs border border-mist-200 rounded-lg px-2.5 py-2 bg-white text-ink cursor-pointer focus:border-teal-600 focus:outline-none"
            >
              <option value="ALL">Type: All</option>
              <option value="online">Online Tele-Health</option>
              <option value="offline">In-Clinic Offline</option>
            </select>
          </div>

          {/* Date Picker (3 cols) */}
          <div className="md:col-span-3 flex items-center gap-1.5">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full text-xs border border-mist-200 rounded-lg px-2.5 py-1.5 bg-white text-ink cursor-pointer focus:border-teal-600 focus:outline-none"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-[11px] text-teal-700 hover:underline shrink-0 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Appointment Cards Grid */}
      {loading && appointments.length === 0 ? (
        <div className="p-12 text-center text-xs text-ink-soft bg-white rounded-2xl border border-mist-200">
          <RefreshCw className="h-6 w-6 text-teal-600 animate-spin mx-auto mb-2" />
          Loading appointments & consultation directory...
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-mist-200 space-y-2">
          <CalendarIcon className="mx-auto h-12 w-12 text-mist-300" />
          <h3 className="font-display font-bold text-sm text-ink">No appointments found</h3>
          <p className="text-xs text-ink-soft max-w-sm mx-auto">
            No consultations match your current search or filter criteria. Try selecting "All Appointments" or clearing the filters.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setActiveTabCategory('all')
              setSearchQuery('')
              setStatusFilter('ALL')
              setTypeFilter('ALL')
              setDateFilter('')
            }}
            className="text-xs text-teal-700 border-teal-200 mt-2"
          >
            Reset All Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.map((appt) => {
            const isConfirmed = appt.appointmentStatus === 'confirmed'
            const isCompleted = appt.appointmentStatus === 'completed'
            const isCancelled = appt.appointmentStatus === 'cancelled'
            const isNoShow = appt.appointmentStatus === 'no_show'
            const isInProgress = appt.meetingStatus === 'in_progress'
            const isMeetingEnded = appt.meetingStatus === 'ended'

            return (
              <div
                key={appt.id}
                className={cn(
                  'bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 space-y-4 shadow-xs hover:shadow-sm flex flex-col justify-between',
                  isInProgress
                    ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/20'
                    : 'border-mist-200 hover:border-teal-200'
                )}
              >
                {/* Card Top: Appointment Number, Type Pill & Status Badges */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-xs font-mono font-bold">
                        #{appt.appointmentNumber}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-semibold flex items-center gap-1',
                          appt.appointmentType === 'online'
                            ? 'bg-teal-50/60 text-teal-700 border-teal-200'
                            : 'bg-blue-50/60 text-blue-700 border-blue-200'
                        )}
                      >
                        {appt.appointmentType === 'online' ? <Video className="h-3 w-3" /> : <Hospital className="h-3 w-3" />}
                        {appt.appointmentType === 'online' ? 'ONLINE' : 'IN-CLINIC'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Meeting Status Badge */}
                      {isInProgress ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                          Meeting In Progress
                        </span>
                      ) : isMeetingEnded ? (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                          Meeting Ended
                        </Badge>
                      ) : (
                        <Badge className="bg-mist-100 text-ink-soft border-mist-200 text-[10px]">
                          Not Started
                        </Badge>
                      )}

                      {/* Appointment Status Badge */}
                      <Badge
                        className={cn(
                          'text-[10px] font-semibold uppercase',
                          isConfirmed && 'bg-teal-50 text-teal-700 border-teal-200',
                          isCompleted && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          isCancelled && 'bg-rose-50 text-rose-600 border-rose-200',
                          isNoShow && 'bg-amber-50 text-amber-700 border-amber-200'
                        )}
                      >
                        {appt.appointmentStatus.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  {/* Patient Info Row */}
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div className="flex items-start gap-3">
                      <div
                        onClick={() => handlePatientProfile(appt.patientCode || appt.patientId)}
                        className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-800 border border-teal-200 shrink-0 cursor-pointer hover:bg-teal-200 transition-colors"
                      >
                        {appt.patientName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4
                          onClick={() => handlePatientProfile(appt.patientCode || appt.patientId)}
                          className="font-bold text-sm text-ink hover:text-teal-700 transition-colors cursor-pointer"
                        >
                          {appt.patientName}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-ink-soft mt-0.5">
                          <span className="font-mono text-teal-700">{appt.patientCode || appt.patientId}</span>
                          <span>•</span>
                          <span>{appt.patientAge ? `${appt.patientAge} yrs` : 'Age N/A'}</span>
                          <span>•</span>
                          <span>{appt.patientGender || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-[10px] text-ink-soft uppercase font-semibold">Fee</span>
                      <p className="font-bold text-ink">₹{appt.fee}</p>
                    </div>
                  </div>

                  {/* Scheduled Time vs Actual Time Display */}
                  <div className="p-2.5 rounded-xl bg-mist-50 border border-mist-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-ink">
                        <CalendarIcon className="h-3.5 w-3.5 text-teal-600" />
                        <span className="font-semibold">{toDDMMYYYY(appt.appointmentDate)}</span>
                        <span className="text-ink-soft">at</span>
                        <span className="font-semibold text-teal-800">{appt.appointmentTime}</span>
                      </div>
                      <span className="text-[10px] text-ink-soft font-mono uppercase">
                        Scheduled
                      </span>
                    </div>

                    {/* Actual Session Started / Duration info */}
                    {isInProgress && (
                      <div className="flex items-center justify-between pt-1 border-t border-mist-200/60 text-[11px] text-teal-800 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-teal-600" />
                          Started: {appt.actualStartTime || 'Just now'}
                        </span>
                        <span className="font-mono font-bold bg-teal-100/70 px-1.5 py-0.5 rounded text-teal-900">
                          ⏱ {getMeetingDurationFormatted(appt)}
                        </span>
                      </div>
                    )}

                    {isCompleted && (
                      <div className="flex items-center justify-between pt-1 border-t border-mist-200/60 text-[11px] text-ink-soft">
                        <span>
                          Session Duration:{' '}
                          <strong className="text-ink">{getMeetingDurationFormatted(appt)}</strong>
                        </span>
                        {appt.prescriptionId && (
                          <span className="text-teal-700 font-semibold flex items-center gap-1 text-[10px]">
                            <CheckCircle2 className="h-3 w-3" /> Rx Uploaded
                          </span>
                        )}
                      </div>
                    )}

                    {appt.appointmentType === 'offline' && appt.clinicRoom && (
                      <div className="text-[11px] text-ink-soft pt-1 flex items-center gap-1">
                        <Hospital className="h-3 w-3 text-teal-600" />
                        <span>Room: <strong className="text-ink">{appt.clinicRoom}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Clinical Reason */}
                  <p className="text-[11px] text-ink-soft italic line-clamp-1">
                    Reason: {appt.reason || 'General Consultation'}
                  </p>
                </div>

                {/* Card Bottom: Actions according to requirements section 6 */}
                <div className="pt-3 border-t border-mist-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {/* View Details Button (Always available) */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAppointment(appt)
                        setIsDetailsModalOpen(true)
                      }}
                      className="text-xs h-8 px-2 text-ink-soft hover:text-ink"
                    >
                      View Details
                    </Button>

                    {/* View Patient Profile */}
                    {!isCancelled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePatientProfile(appt.patientCode || appt.patientId)}
                        className="text-xs h-8 px-2 text-teal-700 hover:bg-teal-50"
                      >
                        <User className="mr-1 h-3 w-3" /> Patient
                      </Button>
                    )}

                    {/* Message Patient */}
                    {!isCancelled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMessage(appt.patientCode || appt.patientId)}
                        className="text-xs h-8 px-2 text-ink-soft hover:text-ink"
                      >
                        <MessageSquare className="mr-1 h-3 w-3" /> Message
                      </Button>
                    )}
                  </div>

                  {/* Primary Context Actions */}
                  <div className="flex items-center gap-1.5">
                    {/* 1. Confirmed Appointment -> [Start Meeting] / [Start Consultation] */}
                    {isConfirmed && !isInProgress && (
                      <Button
                        size="sm"
                        onClick={() => handleStartMeeting(appt)}
                        className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold h-8 px-3 rounded-lg shadow-xs"
                      >
                        <Play className="mr-1 h-3.5 w-3.5 fill-current" />
                        {appt.appointmentType === 'online' ? 'Start Meeting' : 'Start Consultation'}
                      </Button>
                    )}

                    {/* 2. Active Meeting -> [Open Meeting] & [End Meeting] */}
                    {isInProgress && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleOpenMeeting(appt)}
                          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold h-8 px-3 rounded-lg"
                        >
                          <Video className="mr-1 h-3.5 w-3.5" /> Open
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAppointment(appt)
                            setIsEndMeetingModalOpen(true)
                          }}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-8 px-2.5 rounded-lg"
                        >
                          <Square className="mr-1 h-3 w-3 fill-current" /> End
                        </Button>
                      </>
                    )}

                    {/* 3. Completed Appointment -> [Consultation Notes] & [Upload Prescription] */}
                    {isCompleted && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAppointment(appt)
                            setIsNotesModalOpen(true)
                          }}
                          className="text-xs h-8 px-2.5 text-teal-700 border-teal-200 hover:bg-teal-50"
                        >
                          <FileText className="mr-1 h-3 w-3" /> Notes
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            onIssuePrescription({
                              patientId: appt.patientCode || appt.patientId,
                              patientName: appt.patientName,
                              appointmentId: appt.id,
                              appointmentNumber: appt.appointmentNumber,
                            })
                          }
                          className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold h-8 px-2.5 rounded-lg"
                        >
                          <FileText className="mr-1 h-3 w-3" /> Upload Rx
                        </Button>
                      </>
                    )}

                    {/* More options menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-lg text-ink-soft hover:text-ink hover:bg-mist-100 cursor-pointer">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs w-48">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAppointment(appt)
                            setIsDetailsModalOpen(true)
                          }}
                        >
                          <FileText className="mr-2 h-3.5 w-3.5 text-teal-600" /> Full Details
                        </DropdownMenuItem>

                        {!isCancelled && (
                          <DropdownMenuItem onClick={() => handlePatientProfile(appt.patientCode || appt.patientId)}>
                            <User className="mr-2 h-3.5 w-3.5 text-teal-600" /> View Medical Profile
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem onClick={() => handleMessage(appt.patientCode || appt.patientId)}>
                          <MessageSquare className="mr-2 h-3.5 w-3.5 text-blue-600" /> Send Message
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAppointment(appt)
                            setIsFollowUpModalOpen(true)
                          }}
                        >
                          <Repeat className="mr-2 h-3.5 w-3.5 text-teal-600" /> Schedule Follow-up
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {isConfirmed && !isInProgress && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleMarkCompleteDirect(appt)}
                              className="text-emerald-700"
                            >
                              <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-600" /> Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAppointment(appt)
                                setIsNoShowModalOpen(true)
                              }}
                              className="text-amber-700"
                            >
                              <UserX className="mr-2 h-3.5 w-3.5 text-amber-600" /> Mark as No-Show
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAppointment(appt)
                                setIsCancelModalOpen(true)
                              }}
                              className="text-rose-600"
                            >
                              <XCircle className="mr-2 h-3.5 w-3.5 text-rose-500" /> Cancel Appointment
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODALS */}
      {/* 1. Appointment Details Modal */}
      <AppointmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setSelectedAppointment(null)
        }}
        appointment={selectedAppointment}
        onStartMeeting={(a) => {
          setIsDetailsModalOpen(false)
          handleStartMeeting(a)
        }}
        onEndMeeting={(a) => {
          setIsDetailsModalOpen(false)
          setSelectedAppointment(a)
          setIsEndMeetingModalOpen(true)
        }}
        onOpenMeeting={(a) => {
          setIsDetailsModalOpen(false)
          handleOpenMeeting(a)
        }}
        onOpenPatientProfile={(pid) => {
          setIsDetailsModalOpen(false)
          handlePatientProfile(pid)
        }}
        onMessagePatient={(pid) => {
          setIsDetailsModalOpen(false)
          handleMessage(pid)
        }}
        onOpenPrescriptionModal={(a) => {
          setIsDetailsModalOpen(false)
          onIssuePrescription({
            patientId: a.patientCode || a.patientId,
            patientName: a.patientName,
            appointmentId: a.id,
            appointmentNumber: a.appointmentNumber,
          })
        }}
        onOpenNotesModal={(a) => {
          setIsDetailsModalOpen(false)
          setSelectedAppointment(a)
          setIsNotesModalOpen(true)
        }}
        onOpenFollowUpModal={(a) => {
          setIsDetailsModalOpen(false)
          setSelectedAppointment(a)
          setIsFollowUpModalOpen(true)
        }}
        onMarkNoShow={(a) => {
          setIsDetailsModalOpen(false)
          setSelectedAppointment(a)
          setIsNoShowModalOpen(true)
        }}
        onCancelAppointment={(a) => {
          setIsDetailsModalOpen(false)
          setSelectedAppointment(a)
          setIsCancelModalOpen(true)
        }}
        onMarkComplete={(a) => {
          setIsDetailsModalOpen(false)
          handleMarkCompleteDirect(a)
        }}
      />

      {/* 2. Clinical Consultation Notes Modal */}
      <ConsultationNotesModal
        isOpen={isNotesModalOpen}
        onClose={() => {
          setIsNotesModalOpen(false)
          setSelectedAppointment(null)
        }}
        appointment={selectedAppointment}
        onSaveNotes={handleSaveNotes}
        onOpenPrescriptionModal={(a) => {
          setIsNotesModalOpen(false)
          onIssuePrescription({
            patientId: a.patientCode || a.patientId,
            patientName: a.patientName,
            appointmentId: a.id,
            appointmentNumber: a.appointmentNumber,
          })
        }}
      />

      {/* 3. Schedule Follow-Up Modal */}
      <ScheduleFollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => {
          setIsFollowUpModalOpen(false)
          setSelectedAppointment(null)
        }}
        appointment={selectedAppointment}
        onSchedule={handleScheduleFollowUp}
      />

      {/* 4. End Meeting Confirmation Modal */}
      <EndMeetingConfirmModal
        isOpen={isEndMeetingModalOpen}
        onClose={() => {
          setIsEndMeetingModalOpen(false)
          setSelectedAppointment(null)
        }}
        appointment={selectedAppointment}
        onConfirmEnd={handleEndMeeting}
      />

      {/* 5. Mark No-Show Modal */}
      <NoShowModal
        isOpen={isNoShowModalOpen}
        onClose={() => {
          setIsNoShowModalOpen(false)
          setSelectedAppointment(null)
        }}
        appointment={selectedAppointment}
        onConfirmNoShow={handleMarkNoShow}
      />

      {/* 6. Cancel Appointment Modal */}
      <CancelAppointmentModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false)
          setSelectedAppointment(null)
        }}
        appointment={selectedAppointment}
        onConfirmCancel={handleCancelAppointment}
      />
    </div>
  )
}
