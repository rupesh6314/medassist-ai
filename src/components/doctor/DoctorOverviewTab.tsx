import { useMemo } from 'react'
import {
  Users,
  CalendarCheck,
  UserPlus,
  CalendarX,
  ShieldAlert,
  Clock,
  TrendingUp,
  AlertCircle,
  Calendar as CalendarIcon,
  Video,
  Hospital,
  ChevronDown,
  Filter,
  CheckCircle2,
  Check,
  MoreVertical,
  User as UserIcon,
  FileText,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/utils/cn'
import { normalizeDateString, sortAppointmentsByPriority, toDDMMYYYY } from '@/services/appointmentService'

interface DoctorOverviewTabProps {
  stats?: any
  statsLoading: boolean
  totalPatientsCount: number
  overallBookingsCount: number
  newAppointmentsCount: number
  canceledAppointmentsCount: number
  highRiskCount: number
  appointmentsToday: any[]
  appointments: any[]
  appointmentsLoading: boolean
  pendingRequests?: any[]
  ageCounts: Record<string, number>
  maxAgeCount: number
  ageOverviewRange: 'This Month' | 'Last 3 Months' | 'This Year'
  setAgeOverviewRange: (range: 'This Month' | 'Last 3 Months' | 'This Year') => void
  calendarDays: Array<{ dayNumber: number; dateStr: string; isToday: boolean }>
  selectedDay: number
  setSelectedDay: (day: number) => void
  currentMonthYear: string
  onOpenPatientProfile: (patientId: string) => void
  onMarkAppointmentComplete: (id: string) => void
  onAcceptRequest?: (id: string, name: string) => void
  onRejectRequest?: (id: string, name: string) => void
  onOpenAddPatient: () => void
  onIssuePrescription: (data: { patientId: string; patientName: string; appointmentId?: string; appointmentNumber?: string }) => void
  onNavigate: (path: string) => void
  onViewAllAppointments: () => void
  onFilterClick: () => void
}

export function DoctorOverviewTab({
  statsLoading,
  totalPatientsCount,
  overallBookingsCount,
  newAppointmentsCount,
  canceledAppointmentsCount,
  highRiskCount,
  appointmentsToday,
  appointments,
  appointmentsLoading,
  ageCounts,
  maxAgeCount,
  ageOverviewRange,
  setAgeOverviewRange,
  calendarDays,
  selectedDay,
  setSelectedDay,
  currentMonthYear,
  onOpenPatientProfile,
  onMarkAppointmentComplete,
  onOpenAddPatient,
  onIssuePrescription,
  onNavigate,
  onViewAllAppointments,
  onFilterClick,
}: DoctorOverviewTabProps) {
  const todayDate = new Date().getDate()
  const todayStr = toDDMMYYYY(new Date())

  // Find selected date string
  const selectedCalendarItem = calendarDays.find((c) => c.dayNumber === selectedDay)
  const selectedDateStr = selectedCalendarItem?.dateStr || todayStr
  const selectedNormDate = normalizeDateString(selectedDateStr)

  // Filter ONLY appointments scheduled for the selected day in DD-MM-YYYY format
  const selectedDayAppointments = useMemo(() => {
    const list = appointments.filter((a) => {
      const d = a.appointment_date || a.appointmentDate || ''
      const norm = normalizeDateString(d)
      return norm === selectedNormDate
    })
    return sortAppointmentsByPriority(list)
  }, [appointments, selectedNormDate])

  const selectedDateLabel = useMemo(() => {
    if (selectedNormDate === todayStr || selectedDay === todayDate) return `Today (${selectedNormDate})`
    return selectedNormDate
  }, [selectedNormDate, todayStr, selectedDay, todayDate])

  return (
    <div className="space-y-6 w-full">
      {/* TOP ROW: 6 KPI METRIC CARDS (3 COLS x 2 ROWS) NEXT TO PATIENTS OVERVIEW BOX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT 2/3 (lg:col-span-8): 6 KPI Metric Cards in 3 columns x 2 rows */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 h-full">
            {/* Card 1: Total Patients */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  <Users className="h-4 w-4" />
                </div>
                <div className="flex items-center text-[10px] font-medium text-emerald-600 gap-0.5">
                  <span className="text-slate-400 mr-1">Roster</span>
                  <TrendingUp className="h-2.5 w-2.5" />
                  <span>Active</span>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] text-slate-500 font-medium">Total Patients</p>
                <div className="text-xl font-display font-bold text-slate-800 mt-0.5">
                  {statsLoading ? <Skeleton className="h-6 w-12" /> : totalPatientsCount}
                </div>
              </div>
            </div>

            {/* Card 2: Overall Bookings */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CalendarCheck className="h-4 w-4" />
                </div>
                <div className="flex items-center text-[10px] font-medium text-teal-600 gap-0.5">
                  <span className="text-slate-400 mr-1">All</span>
                  <Check className="h-2.5 w-2.5" />
                  <span>Tracked</span>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] text-slate-500 font-medium">Overall Bookings</p>
                <div className="text-xl font-display font-bold text-slate-800 mt-0.5">
                  {appointmentsLoading ? <Skeleton className="h-6 w-12" /> : overallBookingsCount}
                </div>
              </div>
            </div>

            {/* Card 3: New Appointments */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div className="flex items-center text-[10px] font-medium text-teal-700 gap-0.5">
                  <span className="text-slate-400 mr-1">Status</span>
                  <span>Upcoming</span>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] text-slate-500 font-medium">New Appointments</p>
                <div className="text-xl font-display font-bold text-slate-800 mt-0.5">
                  {appointmentsLoading ? <Skeleton className="h-6 w-12" /> : newAppointmentsCount}
                </div>
              </div>
            </div>

            {/* Card 4: Canceled Appointments */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                  <CalendarX className="h-4 w-4" />
                </div>
                <div className="flex items-center text-[10px] font-medium text-rose-500 gap-0.5">
                  <span className="text-slate-400 mr-1">Status</span>
                  <span>Cancelled</span>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] text-slate-500 font-medium">Canceled Appointments</p>
                <div className="text-xl font-display font-bold text-slate-800 mt-0.5">
                  {appointmentsLoading ? <Skeleton className="h-6 w-12" /> : canceledAppointmentsCount}
                </div>
              </div>
            </div>

            {/* Card 5: High-Risk Alerts */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div className="flex items-center text-[10px] font-medium text-amber-600 gap-0.5">
                  <span className="text-slate-400 mr-1">ML Risk</span>
                  <AlertCircle className="h-2.5 w-2.5" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] text-slate-500 font-medium">High-Risk Patients</p>
                <div className="text-xl font-display font-bold text-slate-800 mt-0.5">
                  {statsLoading ? <Skeleton className="h-6 w-12" /> : highRiskCount}
                </div>
              </div>
            </div>

            {/* Card 6: Appointments Today */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex items-center text-[10px] font-medium text-teal-700 gap-0.5">
                  <span className="text-slate-400 mr-1">Today</span>
                  <CalendarIcon className="h-2.5 w-2.5" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] text-slate-500 font-medium">Appointments Today</p>
                <div className="text-xl font-display font-bold text-slate-800 mt-0.5">
                  {appointmentsLoading ? <Skeleton className="h-6 w-12" /> : String(appointmentsToday.length).padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 1/3 (lg:col-span-4): Patients Overview Demographic Chart */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-800 text-sm">Patients Overview</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 text-xs text-slate-500 font-medium border border-slate-200 rounded-lg px-2.5 py-1 bg-white hover:bg-slate-50 cursor-pointer">
                    <span>{ageOverviewRange}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-xs">
                  <DropdownMenuItem onClick={() => setAgeOverviewRange('This Month')}>This Month</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAgeOverviewRange('Last 3 Months')}>Last 3 Months</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAgeOverviewRange('This Year')}>This Year</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Bar Chart */}
            <div className="relative pt-2 pb-1 flex-1 flex flex-col justify-end">
              <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
                <div className="flex flex-col justify-between h-36 text-[10px] text-slate-400 font-mono pr-2">
                  <span>{maxAgeCount}</span>
                  <span>{Math.round(maxAgeCount * 0.75)}</span>
                  <span>{Math.round(maxAgeCount * 0.5)}</span>
                  <span>{Math.round(maxAgeCount * 0.25)}</span>
                  <span>0</span>
                </div>

                {/* Chart Columns */}
                <div className="flex-1 flex items-end justify-between h-36 border-b border-slate-100 px-2 gap-2">
                  {Object.entries(ageCounts).map(([ageGroup, count], idx) => {
                    const heightPercent = maxAgeCount > 0 ? Math.max((count / maxAgeCount) * 115, count > 0 ? 18 : 6) : 6
                    const isHighlighted = ageGroup === '21-29' || idx === 2

                    return (
                      <div key={ageGroup} className="flex flex-col items-center flex-1 group">
                        <span
                          className={cn(
                            'text-[10px] font-bold mb-1 border rounded-full px-1.5 py-0.5 bg-white shadow-xs',
                            isHighlighted ? 'text-teal-700 border-teal-200' : 'text-slate-500 border-slate-200'
                          )}
                        >
                          {String(count).padStart(2, '0')}
                        </span>
                        <div
                          style={{ height: `${heightPercent}px` }}
                          className={cn(
                            'w-full max-w-[36px] rounded-t-lg transition-all duration-300',
                            isHighlighted
                              ? 'bg-teal-600 hover:bg-teal-700 shadow-sm'
                              : count > 0
                              ? 'bg-teal-100/70 hover:bg-teal-200'
                              : 'bg-slate-100 hover:bg-slate-200'
                          )}
                        />
                        <span
                          className={cn(
                            'text-[10px] font-medium mt-2 truncate',
                            isHighlighted ? 'text-teal-700 font-bold' : 'text-slate-400'
                          )}
                        >
                          {ageGroup}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMBINED FULL-WIDTH: Upcoming Appointments Calendar Strip + Daily Schedule List */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs w-full space-y-5">
        {/* Header with Title, Active Date Pill, and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-base">Upcoming Appointments & Schedule</h3>
              <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-xs font-semibold">
                {selectedDayAppointments.length} Booked
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any date to view and manage consultations scheduled for that day
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDay(todayDate)}
              className={cn(
                'text-xs h-8 px-3 rounded-lg font-medium transition-colors',
                selectedDay === todayDate
                  ? 'bg-teal-50 text-teal-700 border-teal-300 font-bold'
                  : 'text-slate-600 border-slate-200 hover:bg-slate-50'
              )}
            >
              Today
            </Button>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium border border-slate-200 rounded-lg px-2.5 py-1 bg-white">
              <span>{currentMonthYear}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onViewAllAppointments}
              className="text-xs text-teal-700 border-teal-200 h-8 px-3 rounded-lg hover:bg-teal-50"
            >
              All Directory
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onFilterClick}
              className="text-xs text-slate-600 border-slate-200 h-8 px-3 rounded-lg"
            >
              <Filter className="mr-1.5 h-3.5 w-3.5" /> Filter
            </Button>
            <Button
              size="sm"
              onClick={onOpenAddPatient}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold h-8 px-3 rounded-lg shadow-xs"
            >
              <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Add New
            </Button>
          </div>
        </div>

        {/* Horizontal Calendar Date Pills Strip */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
            <span>Select Consultation Date:</span>
            <span className="text-teal-700 font-semibold">{selectedDateLabel}</span>
          </div>

          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none w-full">
            {calendarDays.map((item) => {
              const isSelected = selectedDay === item.dayNumber
              const itemNorm = normalizeDateString(item.dateStr)
              const dayAppts = appointments.filter((a) => {
                const d = a.appointment_date || a.appointmentDate || ''
                return normalizeDateString(d) === itemNorm
              })

              const parts = itemNorm.split('-')
              let weekdayName = 'Day'
              if (parts.length === 3) {
                const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10))
                weekdayName = d.toLocaleDateString([], { weekday: 'short' })
              }

              return (
                <button
                  key={item.dateStr}
                  onClick={() => setSelectedDay(item.dayNumber)}
                  className={cn(
                    'flex flex-col items-center justify-center min-w-[52px] flex-1 h-[58px] rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer relative',
                    isSelected
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 scale-[1.02]'
                      : item.isToday
                      ? 'bg-teal-50/80 border border-teal-300 text-teal-800 hover:bg-teal-100'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <span className={cn('text-[10px] uppercase font-bold', isSelected ? 'text-teal-100' : 'text-slate-400')}>
                    {weekdayName}
                  </span>
                  <span className="font-display font-bold text-sm leading-tight">{item.dayNumber}</span>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {dayAppts.length > 0 ? (
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          isSelected ? 'bg-white' : 'bg-teal-500'
                        )}
                      />
                    ) : (
                      <span className={cn('h-1 w-1 rounded-full', isSelected ? 'bg-teal-400' : 'bg-transparent')} />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Schedule List Table for Selected Date */}
        <div className="pt-2">
          {appointmentsLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading daily schedule...</div>
          ) : selectedDayAppointments.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/60 dark:bg-slate-900/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <CalendarIcon className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-1" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No appointments scheduled for {selectedDateLabel}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 max-w-sm mx-auto">
                There are no patient consultations booked on this date. You can register a new appointment or pick another date from the calendar.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={onOpenAddPatient}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 px-3.5 rounded-lg shadow-xs"
                >
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Book Consultation
                </Button>
                {selectedDay !== todayDate && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedDay(todayDate)}
                    className="text-xs h-8 px-3 rounded-lg border-slate-200 text-slate-600"
                  >
                    Back to Today
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-mist-50 text-slate-600 font-semibold border-b border-slate-100">
                    <th className="py-2.5 px-4">Appoint for</th>
                    <th className="py-2.5 px-4">Patient Name</th>
                    <th className="py-2.5 px-4">Scheduled Time</th>
                    <th className="py-2.5 px-4 text-center">Consultation Mode</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {selectedDayAppointments.map((item: any) => {
                    const isInProgress = item.meetingStatus === 'in_progress' || item.meeting_status === 'in_progress'
                    const isCompleted = item.appointmentStatus === 'completed' || item.appointment_status === 'completed' || item.meetingStatus === 'ended'
                    const patientId = String(item.patient_id_code || item.patientCode || item.patientId || item.patient_id || '')
                    const patientName = String(item.patient_name || item.patientName || 'Registered Patient')
                    const apptNumber = String(item.appointmentNumber || item.appointment_number || item.id || 'APT1001')
                    const apptType = String(item.appointment_type || item.appointmentType || 'online').toLowerCase()

                    const initials = patientName
                      .split(' ')
                      .filter(Boolean)
                      .map((n: string) => n[0] || '')
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || 'P'

                    return (
                      <tr key={String(item.id || apptNumber)} className="hover:bg-slate-50/70 transition-colors group">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700 shrink-0">
                              {apptType === 'online' ? <Video className="h-3.5 w-3.5" /> : <Hospital className="h-3.5 w-3.5" />}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 truncate max-w-[220px]">
                                {item.reason || 'General Consultation'}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                #{apptNumber}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div
                            className="flex items-center gap-2.5 cursor-pointer"
                            onClick={() => onOpenPatientProfile(patientId)}
                          >
                            <div className="h-7 w-7 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-800 border border-teal-200 shrink-0">
                              {initials}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-800 hover:text-teal-700 transition-colors block">
                                {patientName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {patientId || 'P1001'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-medium">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                              <Clock className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                              <span>{item.appointment_time || item.appointmentTime || '09:00 AM'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <CalendarIcon className="h-3 w-3 text-slate-400 shrink-0" />
                              <span>{toDDMMYYYY(item.appointment_date || item.appointmentDate)}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center justify-center">
                            {apptType === 'online' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                <Video className="h-3 w-3" /> ONLINE
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <Hospital className="h-3 w-3" /> IN-CLINIC
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isInProgress ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white uppercase tracking-wider animate-pulse">
                              <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                              Live
                            </span>
                          ) : isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                              Confirmed
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs w-52">
                              <DropdownMenuItem onClick={() => onOpenPatientProfile(patientId)}>
                                <UserIcon className="mr-2 h-3.5 w-3.5 text-teal-600" /> View Patient Profile
                              </DropdownMenuItem>
                              {(item.appointment_status === 'confirmed' || item.appointmentStatus === 'confirmed' || isInProgress) && (
                                <DropdownMenuItem
                                  onClick={() => onNavigate(`/consultation/${encodeURIComponent(apptNumber.toLowerCase())}`)}
                                  className="font-semibold text-teal-800"
                                >
                                  {apptType === 'online' ? (
                                    <>
                                      <Video className="mr-2 h-3.5 w-3.5 text-teal-600" /> Start / Join Meeting
                                    </>
                                  ) : (
                                    <>
                                      <Hospital className="mr-2 h-3.5 w-3.5 text-teal-600" /> Start Consultation
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() =>
                                  onIssuePrescription({
                                    patientId,
                                    patientName,
                                    appointmentId: String(item.id || ''),
                                    appointmentNumber: apptNumber,
                                  })
                                }
                              >
                                <FileText className="mr-2 h-3.5 w-3.5 text-purple-600" /> Issue Prescription
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onNavigate(`/messages?patientId=${encodeURIComponent(patientId)}`)}>
                                <MessageSquare className="mr-2 h-3.5 w-3.5 text-amber-600" /> Send Message
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {!isCompleted && (
                                <DropdownMenuItem onClick={() => onMarkAppointmentComplete(String(item.id || ''))}>
                                  <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-600" /> Mark as Completed
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
