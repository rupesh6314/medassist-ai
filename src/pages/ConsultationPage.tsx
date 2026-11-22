import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  MessageSquare,
  FileText,
  Activity,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Send,
  User,
  Stethoscope,
  Clock,
  Sparkles,
  Share2,
  Hospital,
  AlertTriangle,
  Repeat,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Save,
  Square,
  Play,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { api } from '@/services/api'
import { appointmentService, type AppointmentItem, type ConsultationNotes } from '@/services/appointmentService'
import { UploadPrescriptionModal } from '@/components/prescriptions/UploadPrescriptionModal'
import { ScheduleFollowUpModal } from '@/components/appointments/ScheduleFollowUpModal'
import { EndMeetingConfirmModal } from '@/components/appointments/EndMeetingConfirmModal'
import { TrendChart } from '@/components/trends/TrendChart'
import { RiskGauge } from '@/components/risk/RiskGauge'
import { cn } from '@/utils/cn'

export default function ConsultationPage() {
  const { appointmentNumber } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const isDoctor = (user?.role || '').toLowerCase() === 'doctor'

  // Appointment & Meeting Data
  const [appointment, setAppointment] = useState<AppointmentItem | null>(null)
  const [appointmentLoading, setAppointmentLoading] = useState(true)

  // Patient detailed clinical profile for quick review
  const [patientProfile, setPatientProfile] = useState<any | null>(null)

  // Consultation controls
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)

  // Live Timer State
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Side panel tabs: 'chat' | 'notes' | 'summary' | 'reports' | 'trends' | 'risk'
  const [activeSideTab, setActiveSideTab] = useState<'notes' | 'chat' | 'summary' | 'trends' | 'risk'>('notes')

  // In-call chat
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([
    {
      sender: 'System Assistant',
      text: 'Encrypted telemedicine session initialized. Audio and video streams are active.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [chatInput, setChatInput] = useState('')

  // Structured Clinical Notes Form State
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [observations, setObservations] = useState('')
  const [assessment, setAssessment] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  // Modals state
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false)
  const [isEndMeetingModalOpen, setIsEndMeetingModalOpen] = useState(false)
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false)

  // Load appointment details and initialize notes
  const loadAppointmentData = async () => {
    if (!appointmentNumber) return
    setAppointmentLoading(true)
    try {
      const data = await appointmentService.getAppointmentById(appointmentNumber)
      if (data) {
        setAppointment(data)

        // Pre-fill notes if available
        const n = data.consultationNotes
        setChiefComplaint(n?.chiefComplaint || data.reason || '')
        setSymptoms(n?.symptoms || '')
        setObservations(n?.observations || '')
        setAssessment(n?.assessment || '')
        setRecommendations(n?.recommendations || '')
        setFollowUp(n?.followUp || '')

        // Fetch patient profile for comprehensive history review
        if (data.patientCode || data.patientId) {
          try {
            const prof = await api.getDoctorPatientProfile(data.patientCode || data.patientId)
            setPatientProfile(prof)
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      /* ignore */
    } finally {
      setAppointmentLoading(false)
    }
  }

  useEffect(() => {
    loadAppointmentData()
  }, [appointmentNumber])

  // Live Consultation Timer calculated from actual meetingStartedAt timestamp
  useEffect(() => {
    const updateTimer = () => {
      if (!appointment) return

      if (appointment.meetingStatus === 'in_progress' && appointment.meetingStartedAt) {
        const startMs = new Date(appointment.meetingStartedAt).getTime()
        const nowMs = Date.now()
        const diffSecs = Math.max(0, Math.floor((nowMs - startMs) / 1000))
        setElapsedSeconds(diffSecs)
      } else if (appointment.meetingStatus === 'ended' && appointment.meetingDurationSeconds) {
        setElapsedSeconds(appointment.meetingDurationSeconds)
      } else {
        setElapsedSeconds(0)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [appointment])

  const formatDuration = (secs: number) => {
    const hrs = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // Handle Start Meeting (if not started yet)
  const handleStartMeeting = async () => {
    if (!appointment) return
    try {
      const updated = await appointmentService.startMeeting(appointment.id, user?.id || 'D000001')
      setAppointment(updated)
      showToast('Meeting Started', 'Consultation session is now in progress with active timer.', 'success')
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to start meeting.', 'danger')
    }
  }

  // Handle Save Notes
  const handleSaveNotes = async () => {
    if (!appointment) return
    setSavingNotes(true)
    try {
      const updatedNotes: ConsultationNotes = {
        appointmentId: appointment.id,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        chiefComplaint,
        symptoms,
        observations,
        assessment,
        recommendations,
        followUp,
      }
      const updated = await appointmentService.saveConsultationNotes(appointment.id, updatedNotes)
      setAppointment(updated)
      showToast('Notes Saved', 'Clinical consultation notes recorded successfully.', 'success')
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to save notes.', 'danger')
    } finally {
      setSavingNotes(false)
    }
  }

  // Handle End Consultation
  const handleConfirmEnd = async (appointmentId: string, notes?: Partial<ConsultationNotes>) => {
    try {
      const finalNotes: Partial<ConsultationNotes> = {
        chiefComplaint,
        symptoms,
        observations,
        assessment: notes?.assessment || assessment || 'Clinical consultation concluded.',
        recommendations: notes?.recommendations || recommendations || 'Treatment plan advised.',
        followUp: notes?.followUp || followUp || 'As scheduled.',
      }
      const updated = await appointmentService.endMeeting(appointmentId, finalNotes)
      setAppointment(updated)
      showToast('Consultation Concluded', 'Meeting status is ENDED and appointment marked as COMPLETED.', 'success')

      // Automatically offer prescription upload
      if (isDoctor) {
        setIsPrescriptionModalOpen(true)
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to end meeting.', 'danger')
    }
  }

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    setChatMessages((prev) => [
      ...prev,
      {
        sender: user?.name || (isDoctor ? 'Doctor' : 'Patient'),
        text: chatInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
    setChatInput('')
  }

  const handleScheduleFollowUp = async (
    origId: string,
    data: { appointmentDate: string; appointmentTime: string; appointmentType: 'online' | 'offline'; reason: string }
  ) => {
    try {
      const created = await appointmentService.scheduleFollowUp(origId, data)
      showToast('Follow-up Scheduled', `Follow-up #${created.appointmentNumber} registered for ${data.appointmentDate}.`, 'success')
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to schedule follow-up.', 'danger')
    }
  }

  const isOnline = appointment?.appointmentType === 'online'
  const isInProgress = appointment?.meetingStatus === 'in_progress'
  const isEnded = appointment?.meetingStatus === 'ended' || appointment?.appointmentStatus === 'completed'

  return (
    <div className="space-y-4">
      {/* Top Consultation Navigation & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-mist-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(isDoctor ? '/doctor-dashboard?tab=appointments' : '/appointments')}
            className="text-xs h-9 px-2.5 border-mist-200"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Portal
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-base text-ink">
                {isOnline ? 'Online Consultation' : 'In-Clinic Consultation'} #{appointment?.appointmentNumber || appointmentNumber}
              </h3>
              <Badge
                className={cn(
                  'text-[10px] uppercase font-mono',
                  isInProgress && 'bg-teal-600 text-white animate-pulse',
                  isEnded && 'bg-blue-50 text-blue-700 border-blue-200',
                  !isInProgress && !isEnded && 'bg-mist-100 text-ink-soft'
                )}
              >
                {isInProgress ? 'In Progress' : isEnded ? 'Ended' : 'Not Started'}
              </Badge>
            </div>
            <p className="text-xs text-ink-soft">
              {isDoctor
                ? `Patient: ${appointment?.patientName || 'Patient'} (${appointment?.patientCode || appointment?.patientId || 'P1001'})`
                : `Consulting Physician: ${appointment?.doctorName || 'Dr. Sarah Jenkins'}`}
            </p>
          </div>
        </div>

        {/* Live Timer & Primary Actions */}
        <div className="flex items-center gap-2.5">
          {/* Live Duration Display */}
          <div className="flex items-center gap-2 rounded-xl bg-mist-100 px-3.5 py-1.5 text-xs font-mono font-bold text-ink border border-mist-200">
            <Clock className={cn('h-4 w-4', isInProgress ? 'text-teal-600 animate-spin' : 'text-ink-soft')} />
            <span>Duration: {formatDuration(elapsedSeconds)}</span>
          </div>

          {/* If Not Started -> Start Meeting */}
          {!isInProgress && !isEnded && isDoctor && (
            <Button
              size="sm"
              onClick={handleStartMeeting}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold h-9 px-4 rounded-xl shadow-xs"
            >
              <Play className="mr-1.5 h-3.5 w-3.5 fill-current" /> Start Consultation
            </Button>
          )}

          {/* If In Progress -> End Meeting */}
          {isInProgress && isDoctor && (
            <Button
              size="sm"
              onClick={() => setIsEndMeetingModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-9 px-4 rounded-xl shadow-xs"
            >
              <Square className="mr-1.5 h-3.5 w-3.5 fill-current" /> End Meeting
            </Button>
          )}

          {/* Quick Message Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/messages?patientId=${encodeURIComponent(appointment?.patientCode || appointment?.patientId || '')}`)}
            className="text-teal-700 border-teal-200 hover:bg-teal-50 text-xs h-9"
          >
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Message Patient
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Area (Video / In-Clinic Screen) (7 cols) + Right Area (Notes / History / Reports) (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[580px]">
        {/* LEFT 7 COLS: Video Tele-health Feed OR In-Clinic Consultation Stage */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {isOnline ? (
            /* ONLINE TELE-CONSULTATION VIDEO STREAM */
            <div className="relative flex-1 min-h-[440px] rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shadow-md">
              {/* Main Remote Feed */}
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-white text-center space-y-3">
                <div className="relative">
                  <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-3xl font-bold font-display shadow-lg border-4 border-slate-800">
                    {isDoctor
                      ? appointment?.patientName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'P'
                      : appointment?.doctorName?.replace('Dr. ', '').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'D'}
                  </div>
                  <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
                </div>

                <div>
                  <h4 className="font-display font-bold text-lg text-white">
                    {isDoctor ? appointment?.patientName || 'Rahul Kumar' : appointment?.doctorName || 'Dr. Sarah Jenkins'}
                  </h4>
                  <p className="text-xs text-teal-200/80">
                    {isDoctor ? 'Patient Feed (Connected • 1080p WebRTC Encrypted)' : 'Specialist Tele-health Consultation Stream'}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-300 border border-emerald-500/30">
                    <ShieldCheck className="h-3.5 w-3.5" /> HIPAA/ISO Encrypted Tele-Health Session
                  </span>
                </div>
              </div>

              {/* Doctor Self PIP */}
              <div className="absolute bottom-4 right-4 w-36 sm:w-44 h-28 sm:h-32 rounded-xl bg-slate-800 border-2 border-teal-500/50 shadow-xl overflow-hidden flex flex-col items-center justify-center p-2 text-white">
                {videoEnabled ? (
                  <div className="flex flex-col items-center justify-center text-center space-y-1">
                    <div className="h-10 w-10 rounded-full bg-teal-700 flex items-center justify-center text-xs font-bold font-display">
                      {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'DR'}
                    </div>
                    <p className="text-[10px] font-semibold truncate max-w-[120px]">{user?.name || 'Dr. Jenkins'}</p>
                    <span className="text-[9px] text-teal-300 font-mono">You (Local Camera)</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <VideoOff className="h-6 w-6 mb-1" />
                    <span className="text-[10px]">Camera off</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* OFFLINE IN-CLINIC CONSULTATION ROOM STAGE */
            <div className="relative flex-1 min-h-[440px] rounded-2xl bg-gradient-to-br from-mist-50 to-white border border-mist-200 p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-xs">
              <div className="h-20 w-20 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
                <Hospital className="h-10 w-10" />
              </div>

              <div className="max-w-md space-y-1.5">
                <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-xs font-semibold">
                  In-Clinic Face-to-Face Consultation
                </Badge>
                <h4 className="font-display font-bold text-xl text-ink">{appointment?.patientName || 'Patient Consultation'}</h4>
                <p className="text-xs text-ink-soft">
                  {appointment?.clinicAddress || 'MediAssist Medical Center, Suite 302, Medical City'}
                </p>
                <div className="inline-block bg-teal-100/60 text-teal-900 font-bold px-3 py-1 rounded-lg text-xs mt-2">
                  📍 {appointment?.clinicRoom || 'Consultation Room 2'}
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-mist-200 max-w-md w-full text-left space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">Scheduled Time:</span>
                  <span className="font-mono text-teal-800 font-semibold">{appointment?.appointmentTime || '11:00 AM'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">Started At:</span>
                  <span className="font-mono text-ink-soft">{appointment?.actualStartTime || 'Not started'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">Reason:</span>
                  <span className="text-ink-soft">{appointment?.reason || 'Health Follow-up'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Floating Control Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-mist-200 shadow-xs">
            <div className="flex items-center gap-2">
              {isOnline && (
                <>
                  <Button
                    size="sm"
                    variant={videoEnabled ? 'default' : 'outline'}
                    onClick={() => setVideoEnabled(!videoEnabled)}
                    className={cn('rounded-xl h-9 px-3.5 text-xs font-medium', videoEnabled ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'text-ink-soft')}
                  >
                    {videoEnabled ? <Video className="mr-1.5 h-4 w-4" /> : <VideoOff className="mr-1.5 h-4 w-4 text-rose-500" />}
                    {videoEnabled ? 'Camera On' : 'Camera Off'}
                  </Button>

                  <Button
                    size="sm"
                    variant={audioEnabled ? 'default' : 'outline'}
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={cn('rounded-xl h-9 px-3.5 text-xs font-medium', audioEnabled ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'text-ink-soft')}
                  >
                    {audioEnabled ? <Mic className="mr-1.5 h-4 w-4" /> : <MicOff className="mr-1.5 h-4 w-4 text-rose-500" />}
                    {audioEnabled ? 'Mic On' : 'Muted'}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsScreenSharing(!isScreenSharing)}
                    className={cn('rounded-xl h-9 px-3.5 text-xs font-medium', isScreenSharing ? 'bg-teal-50 border-teal-500 text-teal-700' : 'text-ink-soft')}
                  >
                    <Share2 className="mr-1.5 h-4 w-4" />
                    {isScreenSharing ? 'Sharing' : 'Share'}
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isDoctor && (
                <>
                  <Button
                    size="sm"
                    onClick={() => setIsPrescriptionModalOpen(true)}
                    className="bg-teal-700 hover:bg-teal-800 text-white rounded-xl h-9 px-3.5 text-xs font-semibold shadow-xs"
                  >
                    <FileText className="mr-1.5 h-4 w-4" /> Issue Prescription
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsFollowUpModalOpen(true)}
                    className="rounded-xl h-9 px-3 text-xs border-mist-200"
                  >
                    <Repeat className="mr-1.5 h-4 w-4" /> Follow-up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLS: Complete Longitudinal Patient Review & Clinical Notes Workbench */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl bg-white border border-mist-200 shadow-xs overflow-hidden h-full min-h-[580px]">
          {/* Panel Tab Navigation */}
          <div className="flex border-b border-mist-100 bg-mist-50/70 p-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveSideTab('notes')}
              className={cn(
                'flex-1 py-2 px-2 text-xs font-semibold rounded-lg transition-all text-center whitespace-nowrap cursor-pointer',
                activeSideTab === 'notes' ? 'bg-white text-teal-800 shadow-xs' : 'text-ink-soft hover:text-ink'
              )}
            >
              <FileText className="inline mr-1 h-3.5 w-3.5" /> Notes
            </button>
            <button
              onClick={() => setActiveSideTab('summary')}
              className={cn(
                'flex-1 py-2 px-2 text-xs font-semibold rounded-lg transition-all text-center whitespace-nowrap cursor-pointer',
                activeSideTab === 'summary' ? 'bg-white text-teal-800 shadow-xs' : 'text-ink-soft hover:text-ink'
              )}
            >
              <User className="inline mr-1 h-3.5 w-3.5" /> Summary
            </button>
            <button
              onClick={() => setActiveSideTab('trends')}
              className={cn(
                'flex-1 py-2 px-2 text-xs font-semibold rounded-lg transition-all text-center whitespace-nowrap cursor-pointer',
                activeSideTab === 'trends' ? 'bg-white text-teal-800 shadow-xs' : 'text-ink-soft hover:text-ink'
              )}
            >
              <TrendingUp className="inline mr-1 h-3.5 w-3.5" /> Trends
            </button>
            <button
              onClick={() => setActiveSideTab('risk')}
              className={cn(
                'flex-1 py-2 px-2 text-xs font-semibold rounded-lg transition-all text-center whitespace-nowrap cursor-pointer',
                activeSideTab === 'risk' ? 'bg-white text-teal-800 shadow-xs' : 'text-ink-soft hover:text-ink'
              )}
            >
              <Activity className="inline mr-1 h-3.5 w-3.5" /> Risk
            </button>
            <button
              onClick={() => setActiveSideTab('chat')}
              className={cn(
                'flex-1 py-2 px-2 text-xs font-semibold rounded-lg transition-all text-center whitespace-nowrap cursor-pointer',
                activeSideTab === 'chat' ? 'bg-white text-teal-800 shadow-xs' : 'text-ink-soft hover:text-ink'
              )}
            >
              <MessageSquare className="inline mr-1 h-3.5 w-3.5" /> Chat
            </button>
          </div>

          {/* TAB 1: CLINICAL NOTES WORKBENCH */}
          {activeSideTab === 'notes' && (
            <div className="flex-1 p-4 space-y-3 overflow-y-auto flex flex-col justify-between">
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-ink uppercase tracking-wider text-[11px]">
                    Clinical Consultation Assessment
                  </h4>
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-7 px-3 rounded-lg"
                  >
                    <Save className="mr-1 h-3 w-3" /> {savingNotes ? 'Saving...' : 'Save Notes'}
                  </Button>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink-soft">Chief Complaint</label>
                  <input
                    type="text"
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="e.g., Follow-up for elevated glucose & hypertension"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-mist-200 text-xs text-ink focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink-soft">Symptoms & Patient History</label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    rows={2}
                    placeholder="Patient complaints, symptoms onset, duration..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-mist-200 text-xs text-ink focus:border-teal-600 focus:outline-none resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink-soft">Observations & Vitals</label>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    rows={2}
                    placeholder="BP, Heart Rate, SpO2, physical observations..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-mist-200 text-xs text-ink focus:border-teal-600 focus:outline-none resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink-soft">Assessment / Clinical Diagnosis</label>
                  <textarea
                    value={assessment}
                    onChange={(e) => setAssessment(e.target.value)}
                    rows={2}
                    placeholder="Clinical evaluation and diagnosis..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-mist-200 text-xs text-ink focus:border-teal-600 focus:outline-none resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink-soft">Recommendations & Treatment</label>
                  <textarea
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    rows={2}
                    placeholder="Prescribed medicine regimen, dietary changes..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-mist-200 text-xs text-ink focus:border-teal-600 focus:outline-none resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink-soft">Follow-Up Instructions</label>
                  <input
                    type="text"
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    placeholder="e.g., Return in 2 weeks with repeat fasting glucose"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-mist-200 text-xs text-ink focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  size="sm"
                  onClick={() => setIsPrescriptionModalOpen(true)}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold h-9 rounded-xl shadow-xs"
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5" /> Issue Digital Prescription PDF
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: PATIENT MEDICAL SUMMARY (Requirement 13) */}
          {activeSideTab === 'summary' && (
            <div className="flex-1 p-4 space-y-3 overflow-y-auto text-xs">
              <h4 className="font-bold text-ink uppercase tracking-wider text-[11px]">
                Patient Longitudinal Profile
              </h4>

              {/* Compact Patient Summary Card */}
              <div className="p-3 bg-mist-50 rounded-xl border border-mist-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-ink-soft">Demographics</span>
                  <Badge className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] font-mono">
                    {appointment?.patientCode || appointment?.patientId || 'P1001'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-ink">
                  <div><strong>Name:</strong> {appointment?.patientName || 'Rahul Kumar'}</div>
                  <div><strong>Age / Gender:</strong> {appointment?.patientAge ? `${appointment.patientAge} yrs` : '42 yrs'} / {appointment?.patientGender || 'Male'}</div>
                  <div><strong>Blood Group:</strong> {patientProfile?.patient?.bloodGroup || 'O+'}</div>
                  <div><strong>Phone:</strong> {appointment?.patientPhone || '+91 98765 43210'}</div>
                </div>
              </div>

              {/* Latest Extracted Biomarkers */}
              <div className="p-3 bg-white rounded-xl border border-mist-200 space-y-2">
                <span className="text-[10px] uppercase font-bold text-ink-soft">Latest Extracted Biomarkers</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-mist-50 rounded-lg">
                    <span className="text-ink-soft">Fasting Glucose</span>
                    <p className="font-bold text-ink text-xs">{patientProfile?.latestVitals?.glucose ? `${patientProfile.latestVitals.glucose} mg/dL` : '134 mg/dL'}</p>
                  </div>
                  <div className="p-2 bg-mist-50 rounded-lg">
                    <span className="text-ink-soft">HbA1c</span>
                    <p className="font-bold text-ink text-xs">{patientProfile?.latestVitals?.hba1c ? `${patientProfile.latestVitals.hba1c}%` : '7.2%'}</p>
                  </div>
                  <div className="p-2 bg-mist-50 rounded-lg">
                    <span className="text-ink-soft">Blood Pressure</span>
                    <p className="font-bold text-ink text-xs">{patientProfile?.latestVitals?.bp ? `${patientProfile.latestVitals.bp} mmHg` : '138/88 mmHg'}</p>
                  </div>
                  <div className="p-2 bg-mist-50 rounded-lg">
                    <span className="text-ink-soft">Total Cholesterol</span>
                    <p className="font-bold text-ink text-xs">{patientProfile?.latestVitals?.cholesterol ? `${patientProfile.latestVitals.cholesterol} mg/dL` : '218 mg/dL'}</p>
                  </div>
                </div>
              </div>

              {/* Consultation Counts */}
              <div className="p-3 bg-mist-50 rounded-xl border border-mist-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-ink-soft">Previous Consultations:</span>
                  <p className="font-bold text-ink text-sm">{patientProfile?.appointments?.length || 3}</p>
                </div>
                <div>
                  <span className="text-ink-soft">Prescriptions Issued:</span>
                  <p className="font-bold text-ink text-sm">{patientProfile?.prescriptions?.length || 2}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/doctor-dashboard?tab=patients&patientId=${encodeURIComponent(appointment?.patientCode || appointment?.patientId || '')}`)}
                  className="text-xs h-7 text-teal-700 border-teal-200"
                >
                  Full Profile
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: HEALTH TRENDS (Requirement 12) */}
          {activeSideTab === 'trends' && (
            <div className="flex-1 p-4 space-y-4 overflow-y-auto text-xs">
              <h4 className="font-bold text-ink uppercase tracking-wider text-[11px]">
                Biomarker Health Trends
              </h4>
              {patientProfile?.trends && patientProfile.trends.length > 0 ? (
                <div className="space-y-4">
                  {patientProfile.trends.slice(0, 3).map((trend: any) => (
                    <div key={trend.id} className="p-3 rounded-xl border border-mist-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-ink">{trend.name}</span>
                        {trend.normalRange && Array.isArray(trend.normalRange) && (
                          <span className="text-[10px] text-teal-700 font-mono">
                            Normal: {trend.normalRange[0]}-{trend.normalRange[1]} {trend.unit}
                          </span>
                        )}
                      </div>
                      <TrendChart metric={trend} height={140} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-ink-soft bg-mist-50/50 rounded-xl border border-mist-200">
                  <Activity className="h-6 w-6 mx-auto mb-2 text-ink-soft/60" />
                  <p className="font-medium text-ink">No biomarker trends yet</p>
                  <p className="text-[11px] mt-0.5">Trends will automatically generate as lab reports are parsed.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ML DISEASE RISK (Requirement 12) */}
          {activeSideTab === 'risk' && (
            <div className="flex-1 p-4 space-y-3 overflow-y-auto text-xs">
              <h4 className="font-bold text-ink uppercase tracking-wider text-[11px]">
                ML Disease Risk Prediction
              </h4>
              {patientProfile?.diseaseRisks && patientProfile.diseaseRisks.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {patientProfile.diseaseRisks.map((r: any) => (
                    <div key={r.id || r.name} className="p-3 rounded-xl border border-mist-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-ink">{r.name}</span>
                        <Badge
                          className={cn(
                            'text-[10px] font-semibold',
                            (r.status === 'High' || r.status === 'High Risk') && 'bg-rose-50 text-rose-600 border-rose-200',
                            (r.status === 'Moderate' || r.status === 'Moderate Risk') && 'bg-amber-50 text-amber-700 border-amber-200',
                            (r.status === 'Low' || r.status === 'Low Risk') && 'bg-teal-50 text-teal-700 border-teal-200'
                          )}
                        >
                          {r.status || 'Assessed'} {r.percentage ? `(${r.percentage}%)` : ''}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-ink-soft leading-relaxed">{r.explanation || 'Analyzed based on latest clinical metrics and health profiles.'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-ink-soft bg-mist-50/50 rounded-xl border border-mist-200">
                  <ShieldAlert className="h-6 w-6 mx-auto mb-2 text-ink-soft/60" />
                  <p className="font-medium text-ink">No disease risk assessments yet</p>
                  <p className="text-[11px] mt-0.5">Assessments will calculate upon analyzing patient clinical data.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: IN-CALL CHAT */}
          {activeSideTab === 'chat' && (
            <div className="flex-1 flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-mist-50/20 max-h-[380px]">
                {chatMessages.map((m, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white border border-mist-200 text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink text-[11px]">{m.sender}</span>
                      <span className="text-[10px] text-ink-soft">{m.time}</span>
                    </div>
                    <p className="text-ink-soft text-xs leading-relaxed">{m.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendChat} className="p-2.5 border-t border-mist-100 bg-white flex items-center gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type message in session chat..."
                  className="text-xs h-9 bg-mist-50/50"
                />
                <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-700 text-white h-9 px-3">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Upload Prescription Modal */}
      {isDoctor && (
        <UploadPrescriptionModal
          isOpen={isPrescriptionModalOpen}
          onClose={() => setIsPrescriptionModalOpen(false)}
          patientId={appointment?.patientCode || appointment?.patientId || 'P1001'}
          patientName={appointment?.patientName || 'Patient'}
          appointmentId={appointment?.id}
          appointmentNumber={appointment?.appointmentNumber}
          onSuccess={() => {
            showToast('Prescription Attached', 'Digital prescription issued and attached to consultation.', 'success')
            loadAppointmentData()
          }}
        />
      )}

      {/* 2. End Meeting Confirmation Modal */}
      <EndMeetingConfirmModal
        isOpen={isEndMeetingModalOpen}
        onClose={() => setIsEndMeetingModalOpen(false)}
        appointment={appointment}
        onConfirmEnd={handleConfirmEnd}
      />

      {/* 3. Schedule Follow-up Modal */}
      <ScheduleFollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        appointment={appointment}
        onSchedule={handleScheduleFollowUp}
      />
    </div>
  )
}
