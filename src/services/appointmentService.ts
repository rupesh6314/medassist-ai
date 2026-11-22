import { api, getStoredUser } from '@/services/api'

export interface ConsultationNotes {
  appointmentId?: string
  doctorId?: string
  patientId?: string
  chiefComplaint: string
  symptoms: string
  observations: string
  assessment: string
  recommendations: string
  followUp: string
  updatedAt?: string
}

export interface AppointmentItem {
  id: string
  appointmentNumber: string
  doctorId: string
  doctorName?: string
  doctorSpecialization?: string
  doctorCode?: string
  patientId: string
  patientCode: string
  patientName: string
  patientEmail?: string
  patientPhone?: string
  patientAge?: number
  patientGender?: string
  appointmentDate: string // YYYY-MM-DD or DD-MM-YYYY
  appointmentTime: string // e.g. "09:00 AM", "10:30 AM"
  appointmentType: 'online' | 'offline'
  reason: string
  fee: number
  paymentStatus: 'pending' | 'successful' | 'failed' | 'refunded'
  appointmentStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  meetingStatus: 'not_started' | 'in_progress' | 'ended'
  meetingStartedAt?: string | null
  meetingEndedAt?: string | null
  meetingDurationSeconds?: number
  actualStartTime?: string | null
  startedByDoctorId?: string | null
  consultationNotes?: ConsultationNotes | null
  prescriptionId?: string | null
  prescriptionFileName?: string | null
  prescriptionFilePath?: string | null
  meetingLink?: string | null
  clinicAddress?: string | null
  clinicRoom?: string | null
  doctorNotes?: string | null
  createdAt: string
  updatedAt?: string
  timeline?: {
    event: string
    timestamp: string
    description?: string
  }[]
}

const STORAGE_KEY = 'medassist_doctor_appointments_v4'

// Format any date input (Date object, DD-MM-YYYY, YYYY-MM-DD, ISO string) strictly as "DD-MM-YYYY"
export function toDDMMYYYY(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return ''
  if (dateInput instanceof Date) {
    const d = String(dateInput.getDate()).padStart(2, '0')
    const m = String(dateInput.getMonth() + 1).padStart(2, '0')
    const y = dateInput.getFullYear()
    return `${d}-${m}-${y}`
  }
  const clean = String(dateInput).trim().split('T')[0]

  // DD-MM-YYYY, D-M-YYYY, DD/MM/YYYY, D/M/YYYY, DD.MM.YYYY
  if (/^\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{4}$/.test(clean)) {
    const parts = clean.split(/[-\/\.]/)
    const day = parts[0].padStart(2, '0')
    const month = parts[1].padStart(2, '0')
    const year = parts[2]
    return `${day}-${month}-${year}`
  }

  // YYYY-MM-DD, YYYY-M-D, YYYY/MM/DD, YYYY/M/D
  if (/^\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2}$/.test(clean)) {
    const parts = clean.split(/[-\/\.]/)
    const year = parts[0]
    const month = parts[1].padStart(2, '0')
    const day = parts[2].padStart(2, '0')
    return `${day}-${month}-${year}`
  }

  return clean
}

// Normalize any date format to standard "DD-MM-YYYY"
export function normalizeDateString(dateStr: string): string {
  if (!dateStr) return '01-01-2099'
  return toDDMMYYYY(dateStr)
}

// Convert "DD-MM-YYYY" to integer YYYYMMDD for accurate chronological sorting
export function getDateSortKey(dateStr: string): number {
  const norm = normalizeDateString(dateStr)
  if (!norm || !norm.includes('-')) return 99999999
  const parts = norm.split('-')
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10) || 0
    const month = parseInt(parts[1], 10) || 0
    const year = parseInt(parts[2], 10) || 0
    return year * 10000 + month * 100 + day
  }
  return 99999999
}

// Convert "09:00 AM", "9:00 AM", "10:30 AM", "02:00 PM", "5:00 PM", "14:30" to minutes from midnight (0 - 1439)
// Guarantees that 9:00 AM (540 mins) comes strictly before 10:30 AM (630 mins)
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const clean = String(timeStr).trim().toUpperCase()
  const isPM = clean.includes('PM')
  const isAM = clean.includes('AM')
  
  const standardized = clean.replace(/\./g, ':')
  const timeOnly = standardized.replace(/[^\d:]/g, '')
  const parts = timeOnly.split(':')
  let hours = parseInt(parts[0] || '0', 10)
  const minutes = parseInt(parts[1] || '0', 10)

  if (isPM && hours < 12) hours += 12
  if (isAM && hours === 12) hours = 0

  return hours * 60 + minutes
}

// Multi-tier Priority & Chronological Sorting Algorithm
// 1. In-progress meetings at top (Tier 0)
// 2. Chronological order by Date (earliest first), then Time (e.g. 9:00 AM before 10:30 AM) (Tier 1-3)
// 3. Completed history (Tier 4) and Cancelled/No-show (Tier 5-6)
export function sortAppointmentsByPriority(list: AppointmentItem[]): AppointmentItem[] {
  const todaySortKey = getDateSortKey(toDDMMYYYY(new Date()))

  const getTier = (appt: AppointmentItem): number => {
    // Tier 0 (Highest Priority): Active meeting currently in progress
    if (appt.meetingStatus === 'in_progress') return 0

    const apptKey = getDateSortKey(appt.appointmentDate)

    // Tier 1: Confirmed appointments scheduled for TODAY
    if (apptKey === todaySortKey && appt.appointmentStatus === 'confirmed') return 1

    // Tier 2: Pending requests
    if (appt.appointmentStatus === 'pending') return 2

    // Tier 3: Upcoming future confirmed appointments
    if (apptKey > todaySortKey && appt.appointmentStatus === 'confirmed') return 3

    // Tier 4: Completed consultations
    if (appt.appointmentStatus === 'completed' || appt.meetingStatus === 'ended') return 4

    // Tier 5: No-show appointments
    if (appt.appointmentStatus === 'no_show') return 5

    // Tier 6: Cancelled appointments
    if (appt.appointmentStatus === 'cancelled') return 6

    return 7
  }

  return [...list].sort((a, b) => {
    const tierA = getTier(a)
    const tierB = getTier(b)

    if (tierA !== tierB) {
      return tierA - tierB
    }

    const keyA = getDateSortKey(a.appointmentDate)
    const keyB = getDateSortKey(b.appointmentDate)
    const timeA = parseTimeToMinutes(a.appointmentTime)
    const timeB = parseTimeToMinutes(b.appointmentTime)

    // Tier 0: In Progress -> Most recently started first
    if (tierA === 0) {
      const startA = a.meetingStartedAt ? new Date(a.meetingStartedAt).getTime() : 0
      const startB = b.meetingStartedAt ? new Date(b.meetingStartedAt).getTime() : 0
      return startB - startA
    }

    // Tier 1, 2, 3: Active schedule (Today & Upcoming) -> Strict chronological order
    // Earliest date first; on same date: earlier time first (9:00 AM before 10:30 AM before 5:00 PM)
    if (tierA <= 3) {
      if (keyA !== keyB) {
        return keyA - keyB
      }
      return timeA - timeB
    }

    // Tier 4: Completed consultations -> Most recent date & time first
    if (tierA === 4) {
      if (keyA !== keyB) {
        return keyB - keyA
      }
      return timeB - timeA
    }

    // Tier 5, 6: Cancelled / No-show -> Most recent first
    if (keyA !== keyB) {
      return keyB - keyA
    }
    return timeB - timeA
  })
}

// Seed demo appointments with realistic chronological slots in standard DD-MM-YYYY format
const getInitialDemoAppointments = (): AppointmentItem[] => {
  const now = new Date()
  const todayStr = toDDMMYYYY(now)

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = toDDMMYYYY(yesterday)

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = toDDMMYYYY(tomorrow)

  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 5)
  const nextWeekStr = toDDMMYYYY(nextWeek)

  const inProgressStart = new Date(Date.now() - 18 * 60 * 1000).toISOString()

  return [
    {
      id: 'apt-1002',
      appointmentNumber: 'APT1002',
      doctorId: 'D000001',
      doctorName: 'Dr. Sarah Jenkins',
      doctorSpecialization: 'General Physician & Cardiologist',
      patientId: 'P1002',
      patientCode: 'P1002',
      patientName: 'Ananya Reddy',
      patientEmail: 'ananya.reddy@example.com',
      patientPhone: '+91 98112 34567',
      patientAge: 35,
      patientGender: 'Female',
      appointmentDate: todayStr,
      appointmentTime: '11:00 AM',
      appointmentType: 'offline',
      reason: 'Routine quarterly health assessment & lipid profile evaluation',
      fee: 650,
      paymentStatus: 'successful',
      appointmentStatus: 'confirmed',
      meetingStatus: 'in_progress',
      meetingStartedAt: inProgressStart,
      meetingEndedAt: null,
      meetingDurationSeconds: 1080,
      actualStartTime: new Date(inProgressStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      startedByDoctorId: 'D000001',
      consultationNotes: {
        appointmentId: 'apt-1002',
        doctorId: 'D000001',
        patientId: 'P1002',
        chiefComplaint: 'Periodic fatigue and mild palpitations during exercise',
        symptoms: 'Fatigue (1 week), occasional dizziness after prolonged sitting',
        observations: 'BP: 124/82 mmHg, Pulse: 74 bpm, Heart sounds normal S1/S2',
        assessment: 'Borderline cholesterol with mild sedentary fatigue. Low cardiovascular risk.',
        recommendations: 'Daily 30-min brisk walk, reduce saturated fat intake, repeat lipid panel in 6 weeks',
        followUp: 'Return in 6 weeks with fresh fasting lipid profile',
        updatedAt: inProgressStart
      },
      prescriptionId: null,
      meetingLink: null,
      clinicAddress: 'MediAssist Medical Center, Suite 302, Medical City',
      clinicRoom: 'Consultation Room 2',
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      updatedAt: inProgressStart,
      timeline: [
        { event: 'Appointment Created', timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), description: 'In-clinic appointment booked' },
        { event: 'Appointment Confirmed', timestamp: new Date(Date.now() - 47 * 3600 * 1000).toISOString(), description: 'Room 2 allocated for 11:00 AM' },
        { event: 'Payment Completed', timestamp: new Date(Date.now() - 47 * 3600 * 1000).toISOString(), description: '₹650 paid' },
        { event: 'Consultation Started', timestamp: inProgressStart, description: 'Doctor began consultation' }
      ]
    },
    {
      id: 'apt-1009',
      appointmentNumber: 'APT1009',
      doctorId: 'D000001',
      doctorName: 'Dr. Sarah Jenkins',
      doctorSpecialization: 'General Physician & Cardiologist',
      patientId: 'P1009',
      patientCode: 'P1009',
      patientName: 'Rohan Verma',
      patientEmail: 'rohan.v@example.com',
      patientPhone: '+91 98450 11223',
      patientAge: 28,
      patientGender: 'Male',
      appointmentDate: todayStr,
      appointmentTime: '09:00 AM',
      appointmentType: 'online',
      reason: 'Morning fasting glucose and allergy symptom review',
      fee: 500,
      paymentStatus: 'successful',
      appointmentStatus: 'confirmed',
      meetingStatus: 'not_started',
      meetingStartedAt: null,
      meetingEndedAt: null,
      meetingDurationSeconds: 0,
      actualStartTime: null,
      startedByDoctorId: null,
      consultationNotes: null,
      prescriptionId: null,
      meetingLink: '/consultation/apt1009',
      clinicAddress: null,
      clinicRoom: null,
      createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      timeline: [
        { event: 'Appointment Created', timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString() },
        { event: 'Appointment Confirmed', timestamp: new Date(Date.now() - 17 * 3600 * 1000).toISOString() }
      ]
    },
    {
      id: 'apt-1010',
      appointmentNumber: 'APT1010',
      doctorId: 'D000001',
      doctorName: 'Dr. Sarah Jenkins',
      doctorSpecialization: 'General Physician & Cardiologist',
      patientId: 'P1010',
      patientCode: 'P1010',
      patientName: 'Meera Nambiar',
      patientEmail: 'meera.n@example.com',
      patientPhone: '+91 97334 88990',
      patientAge: 38,
      patientGender: 'Female',
      appointmentDate: todayStr,
      appointmentTime: '10:30 AM',
      appointmentType: 'online',
      reason: 'Thyroid function TSH test interpretation',
      fee: 500,
      paymentStatus: 'successful',
      appointmentStatus: 'confirmed',
      meetingStatus: 'not_started',
      meetingStartedAt: null,
      meetingEndedAt: null,
      meetingDurationSeconds: 0,
      actualStartTime: null,
      startedByDoctorId: null,
      consultationNotes: null,
      prescriptionId: null,
      meetingLink: '/consultation/apt1010',
      clinicAddress: null,
      clinicRoom: null,
      createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      timeline: [
        { event: 'Appointment Created', timestamp: new Date(Date.now() - 20 * 3600 * 1000).toISOString() },
        { event: 'Appointment Confirmed', timestamp: new Date(Date.now() - 19 * 3600 * 1000).toISOString() }
      ]
    },
    {
      id: 'apt-1001',
      appointmentNumber: 'APT1001',
      doctorId: 'D000001',
      doctorName: 'Dr. Sarah Jenkins',
      doctorSpecialization: 'General Physician & Cardiologist',
      patientId: 'P1001',
      patientCode: 'P1001',
      patientName: 'Rahul Kumar',
      patientEmail: 'rahul.kumar@example.com',
      patientPhone: '+91 98765 43210',
      patientAge: 42,
      patientGender: 'Male',
      appointmentDate: todayStr,
      appointmentTime: '05:00 PM',
      appointmentType: 'online',
      reason: 'Follow-up consultation for elevated blood sugar & hypertension review',
      fee: 500,
      paymentStatus: 'successful',
      appointmentStatus: 'confirmed',
      meetingStatus: 'not_started',
      meetingStartedAt: null,
      meetingEndedAt: null,
      meetingDurationSeconds: 0,
      actualStartTime: null,
      startedByDoctorId: null,
      consultationNotes: null,
      prescriptionId: null,
      meetingLink: '/consultation/apt1001',
      clinicAddress: null,
      clinicRoom: null,
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      timeline: [
        { event: 'Appointment Created', timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), description: 'Online consultation booked by Rahul Kumar' },
        { event: 'Appointment Confirmed', timestamp: new Date(Date.now() - 23 * 3600 * 1000).toISOString(), description: 'Slot scheduled for 05:00 PM' },
        { event: 'Payment Completed', timestamp: new Date(Date.now() - 23 * 3600 * 1000).toISOString(), description: '₹500 received via Razorpay (card)' },
      ]
    },
    {
      id: 'apt-1004',
      appointmentNumber: 'APT1004',
      doctorId: 'D000001',
      doctorName: 'Dr. Sarah Jenkins',
      doctorSpecialization: 'General Physician & Cardiologist',
      patientId: 'P1004',
      patientCode: 'P1004',
      patientName: 'Priya Sharma',
      patientEmail: 'priya.sharma@example.com',
      patientPhone: '+91 99887 65432',
      patientAge: 29,
      patientGender: 'Female',
      appointmentDate: tomorrowStr,
      appointmentTime: '10:30 AM',
      appointmentType: 'online',
      reason: 'CBC blood panel review & Iron deficiency anemia management',
      fee: 500,
      paymentStatus: 'successful',
      appointmentStatus: 'confirmed',
      meetingStatus: 'not_started',
      meetingStartedAt: null,
      meetingEndedAt: null,
      meetingDurationSeconds: 0,
      actualStartTime: null,
      startedByDoctorId: null,
      consultationNotes: null,
      prescriptionId: null,
      meetingLink: '/consultation/apt1004',
      clinicAddress: null,
      clinicRoom: null,
      createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      timeline: [
        { event: 'Appointment Created', timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), description: 'Booked online' },
        { event: 'Appointment Confirmed', timestamp: new Date(Date.now() - 11 * 3600 * 1000).toISOString(), description: 'Scheduled for tomorrow 10:30 AM' },
        { event: 'Payment Completed', timestamp: new Date(Date.now() - 11 * 3600 * 1000).toISOString(), description: '₹500 received' }
      ]
    },
    {
      id: 'apt-1005',
      appointmentNumber: 'APT1005',
      doctorId: 'D000001',
      doctorName: 'Dr. Sarah Jenkins',
      doctorSpecialization: 'General Physician & Cardiologist',
      patientId: 'P1005',
      patientCode: 'P1005',
      patientName: 'Vikram Patel',
      patientEmail: 'vikram.patel@example.com',
      patientPhone: '+91 97110 23456',
      patientAge: 48,
      patientGender: 'Male',
      appointmentDate: nextWeekStr,
      appointmentTime: '04:00 PM',
      appointmentType: 'offline',
      reason: 'Pre-diabetic glycemic check & dietary counseling',
      fee: 600,
      paymentStatus: 'successful',
      appointmentStatus: 'confirmed',
      meetingStatus: 'not_started',
      meetingStartedAt: null,
      meetingEndedAt: null,
      meetingDurationSeconds: 0,
      actualStartTime: null,
      startedByDoctorId: null,
      consultationNotes: null,
      prescriptionId: null,
      meetingLink: null,
      clinicAddress: 'MediAssist Medical Center, Suite 302, Medical City',
      clinicRoom: 'Consultation Room 1',
      createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      timeline: [
        { event: 'Appointment Created', timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(), description: 'In-clinic appointment registered' },
        { event: 'Appointment Confirmed', timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), description: 'Confirmed for Room 1' },
        { event: 'Payment Completed', timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), description: '₹600 received' }
      ]
    },
    {
      id: 'apt-1003',
      appointmentNumber: 'APT1003',
      doctorId: 'D000001',
      doctorName: 'Dr. Sarah Jenkins',
      doctorSpecialization: 'General Physician & Cardiologist',
      patientId: 'P1003',
      patientCode: 'P1003',
      patientName: 'Suresh Kumar',
      patientEmail: 'suresh.k@example.com',
      patientPhone: '+91 97234 56789',
      patientAge: 52,
      patientGender: 'Male',
      appointmentDate: todayStr,
      appointmentTime: '02:30 PM',
      appointmentType: 'online',
      reason: 'Chest tightness evaluation and ECG report review',
      fee: 750,
      paymentStatus: 'successful',
      appointmentStatus: 'completed',
      meetingStatus: 'ended',
      meetingStartedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      meetingEndedAt: new Date(Date.now() - 2.45 * 3600 * 1000).toISOString(),
      meetingDurationSeconds: 1980, // 33 minutes
      actualStartTime: '02:25 PM',
      startedByDoctorId: 'D000001',
      consultationNotes: {
        appointmentId: 'apt-1003',
        doctorId: 'D000001',
        patientId: 'P1003',
        chiefComplaint: 'Exertional chest discomfort and breathlessness when climbing stairs',
        symptoms: 'Substernal tightness lasting 2-3 minutes during exertion, resolves with rest',
        observations: 'BP: 138/88 mmHg, resting heart rate: 78 bpm. Bilateral clear breath sounds.',
        assessment: 'Suspected stable angina / coronary risk factors. Recommend TMT and echocardiogram.',
        recommendations: 'Start Tab. Atorvastatin 20mg OD, Tab. Aspirin 75mg OD. Urgent TMT scheduling.',
        followUp: 'Schedule Follow-up with TMT stress test and 2D Echo results within 7 days',
        updatedAt: new Date(Date.now() - 2.45 * 3600 * 1000).toISOString()
      },
      prescriptionId: 'rx-1003',
      prescriptionFileName: 'Prescription_SureshKumar_APT1003.pdf',
      prescriptionFilePath: '/uploads/prescriptions/sample_rx_suresh.pdf',
      meetingLink: '/consultation/apt1003',
      clinicAddress: null,
      clinicRoom: null,
      createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2.45 * 3600 * 1000).toISOString(),
      timeline: [
        { event: 'Appointment Created', timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(), description: 'Tele-consultation booked' },
        { event: 'Appointment Confirmed', timestamp: new Date(Date.now() - 35 * 3600 * 1000).toISOString(), description: 'Confirmed by clinic' },
        { event: 'Payment Completed', timestamp: new Date(Date.now() - 35 * 3600 * 1000).toISOString(), description: '₹750 received' },
        { event: 'Meeting Started', timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), description: 'Doctor joined at 02:25 PM' },
        { event: 'Meeting Ended', timestamp: new Date(Date.now() - 2.45 * 3600 * 1000).toISOString(), description: 'Session concluded (Duration: 33 mins)' },
        { event: 'Consultation Completed', timestamp: new Date(Date.now() - 2.45 * 3600 * 1000).toISOString(), description: 'Clinical assessment and diagnosis recorded' },
        { event: 'Prescription Uploaded', timestamp: new Date(Date.now() - 2.4 * 3600 * 1000).toISOString(), description: 'Digital Rx issued & synced to patient portal' }
      ]
    },
    {
      id: 'apt-1006',
      appointmentNumber: 'APT1006',
      doctorId: 'D000001',
      doctorName: 'Dr. Sarah Jenkins',
      doctorSpecialization: 'General Physician & Cardiologist',
      patientId: 'P1001',
      patientCode: 'P1001',
      patientName: 'Rahul Kumar',
      patientEmail: 'rahul.kumar@example.com',
      patientPhone: '+91 98765 43210',
      patientAge: 42,
      patientGender: 'Male',
      appointmentDate: yesterdayStr,
      appointmentTime: '03:00 PM',
      appointmentType: 'online',
      reason: 'Initial consultation for metabolic screening',
      fee: 500,
      paymentStatus: 'successful',
      appointmentStatus: 'completed',
      meetingStatus: 'ended',
      meetingStartedAt: new Date(Date.now() - 27 * 3600 * 1000).toISOString(),
      meetingEndedAt: new Date(Date.now() - 26.6 * 3600 * 1000).toISOString(),
      meetingDurationSeconds: 1440, // 24 mins
      actualStartTime: '03:00 PM',
      startedByDoctorId: 'D000001',
      consultationNotes: {
        appointmentId: 'apt-1006',
        doctorId: 'D000001',
        patientId: 'P1001',
        chiefComplaint: 'High fasting blood glucose recorded on home glucometer',
        symptoms: 'Polydipsia, occasional postprandial fatigue',
        observations: 'BMI: 27.4 kg/m², Fasting glucose: 134 mg/dL',
        assessment: 'Early Type 2 Diabetes Mellitus. Needs lifestyle modification and oral anti-diabetic medication.',
        recommendations: 'Tab. Metformin 500mg BD after meals. Low glycemic diet plan provided.',
        followUp: 'Follow-up consultation scheduled for blood sugar monitoring',
        updatedAt: new Date(Date.now() - 26.6 * 3600 * 1000).toISOString()
      },
      prescriptionId: 'rx-1001',
      prescriptionFileName: 'Prescription_RahulKumar_APT1006.pdf',
      prescriptionFilePath: '/uploads/prescriptions/sample_rx_rahul.pdf',
      meetingLink: '/consultation/apt1006',
      clinicAddress: null,
      clinicRoom: null,
      createdAt: new Date(Date.now() - 50 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 26.6 * 3600 * 1000).toISOString(),
      timeline: [
        { event: 'Appointment Created', timestamp: new Date(Date.now() - 50 * 3600 * 1000).toISOString() },
        { event: 'Appointment Confirmed', timestamp: new Date(Date.now() - 49 * 3600 * 1000).toISOString() },
        { event: 'Payment Completed', timestamp: new Date(Date.now() - 49 * 3600 * 1000).toISOString() },
        { event: 'Meeting Started', timestamp: new Date(Date.now() - 27 * 3600 * 1000).toISOString() },
        { event: 'Meeting Ended', timestamp: new Date(Date.now() - 26.6 * 3600 * 1000).toISOString() },
        { event: 'Consultation Completed', timestamp: new Date(Date.now() - 26.6 * 3600 * 1000).toISOString() },
        { event: 'Prescription Uploaded', timestamp: new Date(Date.now() - 26.5 * 3600 * 1000).toISOString() }
      ]
    },
    {
      id: 'apt-1007',
      appointmentNumber: 'APT1007',
      doctorId: 'D000001',
      doctorName: 'Dr. Sarah Jenkins',
      doctorSpecialization: 'General Physician & Cardiologist',
      patientId: 'P1004',
      patientCode: 'P1004',
      patientName: 'Priya Sharma',
      patientEmail: 'priya.sharma@example.com',
      patientPhone: '+91 99887 65432',
      patientAge: 29,
      patientGender: 'Female',
      appointmentDate: yesterdayStr,
      appointmentTime: '01:00 PM',
      appointmentType: 'online',
      reason: 'General wellness check',
      fee: 500,
      paymentStatus: 'successful',
      appointmentStatus: 'cancelled',
      meetingStatus: 'not_started',
      meetingStartedAt: null,
      meetingEndedAt: null,
      meetingDurationSeconds: 0,
      actualStartTime: null,
      startedByDoctorId: null,
      consultationNotes: null,
      prescriptionId: null,
      meetingLink: '/consultation/apt1007',
      clinicAddress: null,
      clinicRoom: null,
      createdAt: new Date(Date.now() - 60 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
      timeline: [
        { event: 'Appointment Created', timestamp: new Date(Date.now() - 60 * 3600 * 1000).toISOString() },
        { event: 'Appointment Confirmed', timestamp: new Date(Date.now() - 59 * 3600 * 1000).toISOString() },
        { event: 'Payment Completed', timestamp: new Date(Date.now() - 59 * 3600 * 1000).toISOString() },
        { event: 'Appointment Cancelled', timestamp: new Date(Date.now() - 30 * 3600 * 1000).toISOString(), description: 'Cancelled by patient due to schedule conflict' }
      ]
    },
    {
      id: 'apt-1008',
      appointmentNumber: 'APT1008',
      doctorId: 'D000001',
      doctorName: 'Dr. Sarah Jenkins',
      doctorSpecialization: 'General Physician & Cardiologist',
      patientId: 'P1005',
      patientCode: 'P1005',
      patientName: 'Vikram Patel',
      patientEmail: 'vikram.patel@example.com',
      patientPhone: '+91 97110 23456',
      patientAge: 48,
      patientGender: 'Male',
      appointmentDate: yesterdayStr,
      appointmentTime: '04:30 PM',
      appointmentType: 'offline',
      reason: 'Routine BP follow-up',
      fee: 600,
      paymentStatus: 'successful',
      appointmentStatus: 'no_show',
      meetingStatus: 'not_started',
      meetingStartedAt: null,
      meetingEndedAt: null,
      meetingDurationSeconds: 0,
      actualStartTime: null,
      startedByDoctorId: null,
      consultationNotes: null,
      prescriptionId: null,
      meetingLink: null,
      clinicAddress: 'MediAssist Medical Center, Suite 302, Medical City',
      clinicRoom: 'Consultation Room 1',
      doctorNotes: 'Patient did not attend in-clinic slot. Attempted phone reach without response.',
      createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 25 * 3600 * 1000).toISOString(),
      timeline: [
        { event: 'Appointment Created', timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString() },
        { event: 'Appointment Confirmed', timestamp: new Date(Date.now() - 71 * 3600 * 1000).toISOString() },
        { event: 'Payment Completed', timestamp: new Date(Date.now() - 71 * 3600 * 1000).toISOString() },
        { event: 'Marked No-Show', timestamp: new Date(Date.now() - 25 * 3600 * 1000).toISOString(), description: 'Patient did not arrive for scheduled slot' }
      ]
    }
  ]
}

export const appointmentService = {
  // Get storage key scoped per doctor
  getStorageKey(): string {
    const user = getStoredUser()
    const docId = user?.id || user?.doctorId
    return docId ? `medassist_doctor_appointments_${docId}` : STORAGE_KEY
  },

  // Read stored appointments scoped to the logged-in doctor
  getStoredAppointments(): AppointmentItem[] {
    const key = this.getStorageKey()
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          return parsed
        }
      }
    } catch {
      /* ignore */
    }

    const user = getStoredUser()
    // Only load initial demo appointments if user is the generic demo doctor
    const isDemoDoctor = !user || user.email === 'doctor@demo.com' || user.doctorId === 'D000001'
    if (isDemoDoctor) {
      const initial = getInitialDemoAppointments()
      this.saveStoredAppointments(initial, false)
      return initial
    }

    // New doctor with no appointments yet starts with an empty list
    return []
  },

  // Save appointments to storage and optionally broadcast event
  saveStoredAppointments(appointments: AppointmentItem[], broadcast = true) {
    const key = this.getStorageKey()
    try {
      localStorage.setItem(key, JSON.stringify(appointments))
      if (broadcast) {
        window.dispatchEvent(new CustomEvent('medassist:appointments_updated', { detail: appointments }))
      }
    } catch {
      /* ignore */
    }
  },

  // Normalize server appointment to our rich AppointmentItem model
  normalizeAppointment(raw: any): AppointmentItem {
    return {
      id: raw.id || raw.appointment_number || `apt-${Date.now()}`,
      appointmentNumber: raw.appointmentNumber || raw.appointment_number || 'APT1001',
      doctorId: raw.doctorId || raw.doctor_id || 'D000001',
      doctorName: raw.doctorName || raw.doctor?.name || 'Dr. Physician',
      doctorSpecialization: raw.doctorSpecialization || raw.doctor?.specialization || 'General Physician',
      doctorCode: raw.doctorCode || raw.doctor?.doctorId || 'D000001',
      patientId: raw.patientId || raw.patient_id || raw.patientCode || 'P1001',
      patientCode: raw.patientCode || raw.patient_id_code || raw.patientId || 'P1001',
      patientName: raw.patientName || raw.patient_name || 'Patient',
      patientEmail: raw.patientEmail || raw.patient_email || '',
      patientPhone: raw.patientPhone || raw.patient_phone || '',
      patientAge: raw.patientAge || raw.patient_age || (raw.age ? Number(raw.age) : 40),
      patientGender: raw.patientGender || raw.patient_gender || raw.gender || 'Not specified',
      appointmentDate: toDDMMYYYY(raw.appointmentDate || raw.appointment_date || new Date()),
      appointmentTime: raw.appointmentTime || raw.appointment_time || '10:00 AM',
      appointmentType: (raw.appointmentType || raw.appointment_type || 'online').toLowerCase() as 'online' | 'offline',
      reason: raw.reason || 'General Consultation',
      fee: Number(raw.fee || 500),
      paymentStatus: (raw.paymentStatus || raw.payment_status || 'successful') as any,
      appointmentStatus: (raw.appointmentStatus || raw.appointment_status || 'confirmed').toLowerCase() as any,
      meetingStatus: (raw.meetingStatus || raw.meeting_status || 'not_started').toLowerCase() as any,
      meetingStartedAt: raw.meetingStartedAt || raw.meeting_started_at || null,
      meetingEndedAt: raw.meetingEndedAt || raw.meeting_ended_at || null,
      meetingDurationSeconds: Number(raw.meetingDurationSeconds || raw.meeting_duration_seconds || 0),
      actualStartTime: raw.actualStartTime || raw.actual_start_time || null,
      startedByDoctorId: raw.startedByDoctorId || raw.started_by_doctor_id || null,
      consultationNotes: raw.consultationNotes || raw.consultation_notes || null,
      prescriptionId: raw.prescriptionId || raw.prescription_id || null,
      prescriptionFileName: raw.prescriptionFileName || raw.prescription_file_name || null,
      prescriptionFilePath: raw.prescriptionFilePath || raw.prescription_file_path || null,
      meetingLink: raw.meetingLink || raw.meeting_link || null,
      clinicAddress: raw.clinicAddress || raw.clinic_address || null,
      clinicRoom: raw.clinicRoom || (raw.appointment_type === 'offline' ? 'Consultation Room 2' : null),
      doctorNotes: raw.doctorNotes || raw.doctor_notes || null,
      createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
      updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
      timeline: raw.timeline || []
    }
  },

  // Match an appointment by ID, Number, or case-insensitive variant
  findAppointmentIndex(list: AppointmentItem[], identifier: string): number {
    if (!identifier) return -1
    const clean = identifier.trim().toLowerCase()
    const cleanNoDash = clean.replace(/-/g, '')

    return list.findIndex((a) => {
      const aId = (a.id || '').toLowerCase()
      const aNum = (a.appointmentNumber || '').toLowerCase()
      const aIdNoDash = aId.replace(/-/g, '')
      const aNumNoDash = aNum.replace(/-/g, '')

      return (
        aId === clean ||
        aNum === clean ||
        aIdNoDash === cleanNoDash ||
        aNumNoDash === cleanNoDash
      )
    })
  },

  // Fetch all appointments with sync and priority sorting
  async getAppointments(filters?: { status?: string; type?: string; date?: string; search?: string }): Promise<AppointmentItem[]> {
    let localList = this.getStoredAppointments()
    const user = getStoredUser()
    const currentDocId = user?.id
    const currentDocCode = user?.doctorId
    const currentDocName = user?.name ? user.name.toLowerCase().trim() : ''

    try {
      const serverRes = await api.getMyAppointments({
        status: filters?.status,
        type: filters?.type,
        date: filters?.date
      })
      if (serverRes?.appointments && Array.isArray(serverRes.appointments)) {
        const serverNormalized = serverRes.appointments.map((a: any) => this.normalizeAppointment(a))
        
        // Merge server normalized appointments with local metadata (like active meeting state)
        const mergedList: AppointmentItem[] = serverNormalized.map((sItem) => {
          const localItem = localList.find((l) => l.appointmentNumber === sItem.appointmentNumber || l.id === sItem.id)
          if (localItem) {
            return {
              ...sItem,
              meetingStatus: localItem.meetingStatus || sItem.meetingStatus,
              meetingStartedAt: localItem.meetingStartedAt || sItem.meetingStartedAt,
              meetingEndedAt: localItem.meetingEndedAt || sItem.meetingEndedAt,
              meetingDurationSeconds: localItem.meetingDurationSeconds || sItem.meetingDurationSeconds,
              actualStartTime: localItem.actualStartTime || sItem.actualStartTime,
              consultationNotes: localItem.consultationNotes || sItem.consultationNotes,
              prescriptionId: localItem.prescriptionId || sItem.prescriptionId,
              appointmentStatus: localItem.appointmentStatus || sItem.appointmentStatus,
            }
          }
          return sItem
        })

        localList = mergedList
        // Save quietly without broadcasting to prevent infinite render loops
        this.saveStoredAppointments(localList, false)
      }
    } catch {
      // Backend not connected; continue seamlessly
    }

    // Filter appointments strictly to ensure they belong to this logged-in doctor
    let filtered = localList.filter((a) => {
      if (!user || user.role !== 'doctor') return true
      if (currentDocId && (a.doctorId === currentDocId || (a as any).doctor_id === currentDocId)) return true
      if (currentDocCode && (a.doctorCode === currentDocCode || a.doctorId === currentDocCode)) return true
      if (currentDocName && (a.doctorName?.toLowerCase().trim() === currentDocName || a.doctorName?.toLowerCase().includes(currentDocName))) return true
      // If demo doctor or no specific ID
      if (!currentDocId && !currentDocCode) return true
      return false
    })

    // Apply filters
    if (filters?.status && filters.status !== 'ALL') {
      const s = filters.status.toLowerCase()
      if (s === 'in_progress') {
        filtered = filtered.filter((a) => a.meetingStatus === 'in_progress')
      } else {
        filtered = filtered.filter((a) => a.appointmentStatus.toLowerCase() === s)
      }
    }

    if (filters?.type && filters.type !== 'ALL') {
      filtered = filtered.filter((a) => a.appointmentType.toLowerCase() === filters.type!.toLowerCase())
    }

    if (filters?.date) {
      const normTargetDate = normalizeDateString(filters.date)
      filtered = filtered.filter((a) => normalizeDateString(a.appointmentDate) === normTargetDate)
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim()
      filtered = filtered.filter(
        (a) =>
          a.patientName?.toLowerCase().includes(q) ||
          a.patientCode?.toLowerCase().includes(q) ||
          a.patientId?.toLowerCase().includes(q) ||
          a.appointmentNumber?.toLowerCase().includes(q) ||
          a.reason?.toLowerCase().includes(q) ||
          a.appointmentDate?.toLowerCase().includes(q)
      )
    }

    // Apply strict multi-tier priority & chronological sorting
    return sortAppointmentsByPriority(filtered)
  },

  // Get single appointment by ID or Number
  async getAppointmentById(idOrNumber: string): Promise<AppointmentItem | null> {
    const list = this.getStoredAppointments()
    const idx = this.findAppointmentIndex(list, idOrNumber)
    let found = idx !== -1 ? list[idx] : null

    try {
      const serverRes = await api.getAppointmentById(idOrNumber)
      if (serverRes?.appointment) {
        const norm = this.normalizeAppointment(serverRes.appointment)
        if (found) {
          found = {
            ...norm,
            meetingStatus: found.meetingStatus || norm.meetingStatus,
            meetingStartedAt: found.meetingStartedAt || norm.meetingStartedAt,
            meetingEndedAt: found.meetingEndedAt || norm.meetingEndedAt,
            meetingDurationSeconds: found.meetingDurationSeconds || norm.meetingDurationSeconds,
            actualStartTime: found.actualStartTime || norm.actualStartTime,
            consultationNotes: found.consultationNotes || norm.consultationNotes,
            prescriptionId: found.prescriptionId || norm.prescriptionId,
            appointmentStatus: found.appointmentStatus || norm.appointmentStatus,
          }
        } else {
          found = norm
        }
      }
    } catch {
      /* fallback to local */
    }

    return found || null
  },

  // START MEETING (Single-point atomic execution with 1 broadcast)
  async startMeeting(appointmentId: string, doctorId: string): Promise<AppointmentItem> {
    const list = this.getStoredAppointments()
    const apptIndex = this.findAppointmentIndex(list, appointmentId)
    if (apptIndex === -1) {
      throw new Error('Appointment not found.')
    }

    const appt = list[apptIndex]

    if (appt.appointmentStatus === 'cancelled') {
      throw new Error('Cannot start a meeting for a cancelled appointment.')
    }

    // If already in progress, return smoothly
    if (appt.meetingStatus === 'in_progress') {
      return appt
    }

    const now = new Date()
    const nowIso = now.toISOString()
    const formattedActualStart = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const updatedTimeline = [
      ...(appt.timeline || []),
      {
        event: 'Meeting Started',
        timestamp: nowIso,
        description: `Doctor started ${appt.appointmentType === 'online' ? 'tele-consultation' : 'in-clinic session'} at ${formattedActualStart}`
      }
    ]

    const updatedAppt: AppointmentItem = {
      ...appt,
      meetingStatus: 'in_progress',
      meetingStartedAt: nowIso,
      actualStartTime: formattedActualStart,
      startedByDoctorId: doctorId || appt.doctorId,
      updatedAt: nowIso,
      timeline: updatedTimeline
    }

    list[apptIndex] = updatedAppt
    this.saveStoredAppointments(list, true)

    // Sync with backend API
    try {
      await api.updateAppointmentStatus(appt.appointmentNumber || appt.id, {
        status: 'confirmed',
        meetingStatus: 'in_progress',
        meetingStartedAt: nowIso,
      } as any)
    } catch {
      /* ignore */
    }

    return updatedAppt
  },

  // END MEETING (Single-point atomic execution with 1 broadcast)
  async endMeeting(
    appointmentId: string,
    notes?: Partial<ConsultationNotes>
  ): Promise<AppointmentItem> {
    const list = this.getStoredAppointments()
    const apptIndex = this.findAppointmentIndex(list, appointmentId)
    if (apptIndex === -1) {
      throw new Error('Appointment not found.')
    }

    const appt = list[apptIndex]
    const now = new Date()
    const nowIso = now.toISOString()

    // Calculate actual duration in seconds
    let durationSeconds = 0
    if (appt.meetingStartedAt) {
      const startMs = new Date(appt.meetingStartedAt).getTime()
      const endMs = now.getTime()
      durationSeconds = Math.max(0, Math.round((endMs - startMs) / 1000))
    } else {
      durationSeconds = appt.meetingDurationSeconds || 600
    }

    const durationMinutes = Math.max(1, Math.round(durationSeconds / 60))

    const consultationNotesObj: ConsultationNotes = {
      appointmentId: appt.id,
      doctorId: appt.doctorId,
      patientId: appt.patientId,
      chiefComplaint: notes?.chiefComplaint || appt.consultationNotes?.chiefComplaint || appt.reason || 'General Consultation',
      symptoms: notes?.symptoms || appt.consultationNotes?.symptoms || 'Reported symptoms reviewed during session',
      observations: notes?.observations || appt.consultationNotes?.observations || 'Vitals and patient condition evaluated',
      assessment: notes?.assessment || appt.consultationNotes?.assessment || 'Clinical assessment completed',
      recommendations: notes?.recommendations || appt.consultationNotes?.recommendations || 'Treatment plan advised',
      followUp: notes?.followUp || appt.consultationNotes?.followUp || 'As required or scheduled',
      updatedAt: nowIso
    }

    const updatedTimeline = [
      ...(appt.timeline || []),
      {
        event: 'Meeting Ended',
        timestamp: nowIso,
        description: `Consultation concluded. Total duration: ${durationMinutes} minutes.`
      },
      {
        event: 'Consultation Completed',
        timestamp: nowIso,
        description: 'Status updated to Completed. Clinical consultation record saved.'
      }
    ]

    const updatedAppt: AppointmentItem = {
      ...appt,
      appointmentStatus: 'completed',
      meetingStatus: 'ended',
      meetingEndedAt: nowIso,
      meetingDurationSeconds: durationSeconds,
      consultationNotes: consultationNotesObj,
      updatedAt: nowIso,
      timeline: updatedTimeline
    }

    list[apptIndex] = updatedAppt
    this.saveStoredAppointments(list, true)

    // Sync with backend API
    try {
      await api.updateAppointmentStatus(appt.appointmentNumber || appt.id, {
        status: 'completed',
        meetingStatus: 'ended',
        meetingEndedAt: nowIso,
        meetingDurationSeconds: durationSeconds,
        consultationNotes: consultationNotesObj,
        doctorNotes: consultationNotesObj.assessment
      } as any)
    } catch {
      /* ignore */
    }

    return updatedAppt
  },

  // SAVE CONSULTATION NOTES
  async saveConsultationNotes(
    appointmentId: string,
    notes: ConsultationNotes
  ): Promise<AppointmentItem> {
    const list = this.getStoredAppointments()
    const apptIndex = this.findAppointmentIndex(list, appointmentId)
    if (apptIndex === -1) {
      throw new Error('Appointment not found.')
    }

    const nowIso = new Date().toISOString()
    const appt = list[apptIndex]
    const updatedNotes = {
      ...notes,
      appointmentId: appt.id,
      doctorId: appt.doctorId,
      patientId: appt.patientId,
      updatedAt: nowIso
    }

    const updatedAppt: AppointmentItem = {
      ...appt,
      consultationNotes: updatedNotes,
      updatedAt: nowIso
    }

    list[apptIndex] = updatedAppt
    this.saveStoredAppointments(list, true)

    try {
      await api.updateAppointmentStatus(appt.appointmentNumber || appt.id, {
        consultationNotes: updatedNotes,
        doctorNotes: updatedNotes.assessment
      } as any)
    } catch {
      /* ignore */
    }

    return updatedAppt
  },

  // ASSOCIATE PRESCRIPTION
  async attachPrescriptionToAppointment(
    appointmentId: string,
    prescriptionData: { id: string; fileName: string; filePath?: string }
  ): Promise<AppointmentItem> {
    const list = this.getStoredAppointments()
    const apptIndex = this.findAppointmentIndex(list, appointmentId)
    if (apptIndex === -1) {
      throw new Error('Appointment not found.')
    }

    const nowIso = new Date().toISOString()
    const appt = list[apptIndex]

    const updatedTimeline = [
      ...(appt.timeline || []),
      {
        event: 'Prescription Uploaded',
        timestamp: nowIso,
        description: `Prescription ${prescriptionData.fileName} attached to appointment.`
      }
    ]

    const updatedAppt: AppointmentItem = {
      ...appt,
      prescriptionId: prescriptionData.id,
      prescriptionFileName: prescriptionData.fileName,
      prescriptionFilePath: prescriptionData.filePath || null,
      updatedAt: nowIso,
      timeline: updatedTimeline
    }

    list[apptIndex] = updatedAppt
    this.saveStoredAppointments(list, true)
    return updatedAppt
  },

  // SCHEDULE FOLLOW-UP APPOINTMENT
  async scheduleFollowUp(
    originalAppointmentId: string,
    data: {
      appointmentDate: string
      appointmentTime: string
      appointmentType: 'online' | 'offline'
      reason: string
    }
  ): Promise<AppointmentItem> {
    const list = this.getStoredAppointments()
    const origIdx = this.findAppointmentIndex(list, originalAppointmentId)
    if (origIdx === -1) {
      throw new Error('Original appointment not found.')
    }
    const original = list[origIdx]

    const nextNumber = `APT${Math.floor(1000 + Math.random() * 9000)}`
    const newId = `apt-${Date.now()}`
    const nowIso = new Date().toISOString()

    const newAppt: AppointmentItem = {
      id: newId,
      appointmentNumber: nextNumber,
      doctorId: original.doctorId,
      doctorName: original.doctorName,
      doctorSpecialization: original.doctorSpecialization,
      doctorCode: original.doctorCode,
      patientId: original.patientId,
      patientCode: original.patientCode,
      patientName: original.patientName,
      patientEmail: original.patientEmail,
      patientPhone: original.patientPhone,
      patientAge: original.patientAge,
      patientGender: original.patientGender,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      appointmentType: data.appointmentType,
      reason: data.reason || `Follow-up to consultation #${original.appointmentNumber}`,
      fee: original.fee,
      paymentStatus: 'successful',
      appointmentStatus: 'confirmed',
      meetingStatus: 'not_started',
      meetingStartedAt: null,
      meetingEndedAt: null,
      meetingDurationSeconds: 0,
      actualStartTime: null,
      startedByDoctorId: null,
      consultationNotes: null,
      prescriptionId: null,
      meetingLink: data.appointmentType === 'online' ? `/consultation/${nextNumber.toLowerCase()}` : null,
      clinicAddress: data.appointmentType === 'offline' ? (original.clinicAddress || 'MediAssist Medical Center, Suite 302, Medical City') : null,
      clinicRoom: data.appointmentType === 'offline' ? 'Consultation Room 2' : null,
      createdAt: nowIso,
      updatedAt: nowIso,
      timeline: [
        { event: 'Appointment Created', timestamp: nowIso, description: `Follow-up consultation scheduled by doctor` },
        { event: 'Appointment Confirmed', timestamp: nowIso, description: `Scheduled for ${data.appointmentDate} at ${data.appointmentTime}` }
      ]
    }

    const updatedList = [newAppt, ...list]
    this.saveStoredAppointments(updatedList, true)

    try {
      await api.bookAppointment({
        doctorId: original.doctorId,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        appointmentType: data.appointmentType,
        reason: newAppt.reason,
        fee: original.fee
      })
    } catch {
      /* ignore */
    }

    return newAppt
  },

  // MARK AS NO-SHOW
  async markNoShow(appointmentId: string, note?: string): Promise<AppointmentItem> {
    const list = this.getStoredAppointments()
    const apptIndex = this.findAppointmentIndex(list, appointmentId)
    if (apptIndex === -1) {
      throw new Error('Appointment not found.')
    }

    const nowIso = new Date().toISOString()
    const appt = list[apptIndex]

    if (appt.appointmentStatus === 'completed' || appt.meetingStatus === 'in_progress') {
      throw new Error('Cannot mark an active or completed appointment as No-Show.')
    }

    const updatedTimeline = [
      ...(appt.timeline || []),
      {
        event: 'Marked No-Show',
        timestamp: nowIso,
        description: note || 'Patient did not attend scheduled consultation slot.'
      }
    ]

    const updatedAppt: AppointmentItem = {
      ...appt,
      appointmentStatus: 'no_show',
      meetingStatus: 'not_started',
      doctorNotes: note || 'Patient No-Show',
      updatedAt: nowIso,
      timeline: updatedTimeline
    }

    list[apptIndex] = updatedAppt
    this.saveStoredAppointments(list, true)

    try {
      await api.updateAppointmentStatus(appt.appointmentNumber || appt.id, {
        status: 'no_show' as any,
        doctorNotes: note || 'Patient No-Show'
      })
    } catch {
      /* ignore */
    }

    return updatedAppt
  },

  // CANCEL APPOINTMENT
  async cancelAppointment(appointmentId: string, reason?: string): Promise<AppointmentItem> {
    const list = this.getStoredAppointments()
    const apptIndex = this.findAppointmentIndex(list, appointmentId)
    if (apptIndex === -1) {
      throw new Error('Appointment not found.')
    }

    const nowIso = new Date().toISOString()
    const appt = list[apptIndex]

    if (appt.appointmentStatus === 'completed') {
      throw new Error('Cannot cancel an already completed appointment.')
    }
    if (appt.meetingStatus === 'in_progress') {
      throw new Error('Cannot cancel an appointment with a consultation currently in progress. Please end the consultation first.')
    }

    const updatedTimeline = [
      ...(appt.timeline || []),
      {
        event: 'Appointment Cancelled',
        timestamp: nowIso,
        description: reason || 'Cancelled by physician.'
      }
    ]

    const updatedAppt: AppointmentItem = {
      ...appt,
      appointmentStatus: 'cancelled',
      meetingStatus: 'not_started',
      doctorNotes: reason || 'Cancelled by Doctor',
      updatedAt: nowIso,
      timeline: updatedTimeline
    }

    list[apptIndex] = updatedAppt
    this.saveStoredAppointments(list, true)

    try {
      await api.updateAppointmentStatus(appt.appointmentNumber || appt.id, {
        status: 'cancelled',
        doctorNotes: reason || 'Cancelled by Doctor'
      })
    } catch {
      /* ignore */
    }

    return updatedAppt
  },

  // MARK COMPLETED DIRECTLY
  async markCompleted(appointmentId: string, doctorNotes?: string): Promise<AppointmentItem> {
    const list = this.getStoredAppointments()
    const apptIndex = this.findAppointmentIndex(list, appointmentId)
    if (apptIndex === -1) {
      throw new Error('Appointment not found.')
    }

    const nowIso = new Date().toISOString()
    const appt = list[apptIndex]

    const updatedTimeline = [
      ...(appt.timeline || []),
      {
        event: 'Appointment Completed',
        timestamp: nowIso,
        description: doctorNotes || 'Consultation marked as completed.'
      }
    ]

    const updatedAppt: AppointmentItem = {
      ...appt,
      appointmentStatus: 'completed',
      meetingStatus: 'ended',
      doctorNotes: doctorNotes || appt.doctorNotes,
      updatedAt: nowIso,
      timeline: updatedTimeline
    }

    list[apptIndex] = updatedAppt
    this.saveStoredAppointments(list, true)

    try {
      await api.updateAppointmentStatus(appt.appointmentNumber || appt.id, {
        status: 'completed',
        doctorNotes: doctorNotes || undefined
      })
    } catch {
      /* ignore */
    }

    return updatedAppt
  }
}
