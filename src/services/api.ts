const rawApiUrl = (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_URL

// In production, require VITE_API_BASE_URL or VITE_API_URL to be set explicitly
if ((import.meta as any).env?.PROD && !rawApiUrl) {
  throw new Error('FATAL CONFIGURATION ERROR: VITE_API_BASE_URL or VITE_API_URL environment variable is required in production builds.')
}

const API_BASE_URL = rawApiUrl || ((import.meta as any).env?.DEV ? 'http://127.0.0.1:5000/api' : '')

export function getToken(): string | null {
  try {
    return localStorage.getItem('medassist_token')
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem('medassist_token', token)
    } else {
      localStorage.removeItem('medassist_token')
    }
  } catch {
    /* noop */
  }
}

export function getStoredUser(): any | null {
  try {
    const raw = localStorage.getItem('medassist_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredUser(user: any | null) {
  try {
    if (user) {
      localStorage.setItem('medassist_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('medassist_user')
    }
  } catch {
    /* noop */
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })
  } catch (err: any) {
    throw new Error('Unable to connect to backend server. Make sure the server is running on port 5000.')
  }

  const contentType = response.headers.get('content-type') || ''
  let data: any

  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    const text = await response.text()
    if (!response.ok) {
      throw new Error(`Server returned error (${response.status} ${response.statusText})`)
    }
    data = text
  }

  if (!response.ok) {
    const errorMsg =
      typeof data?.error === 'string'
        ? data.error
        : data?.error?.message || data?.message || 'API request failed'
    throw new Error(errorMsg)
  }

  return data as T
}

export const api = {
  // Auth
  register: (data: {
    name: string
    email: string
    password: string
    role?: 'patient' | 'doctor'
    phone?: string
    age?: number
    gender?: string
    bloodGroup?: string
    heightCm?: number
    weightKg?: number
    smokingHabit?: string
    activityLevel?: string
    dietaryPreference?: string
    allergies?: string[]
    existingConditions?: string[]
    hospitalName?: string
    hospital_name?: string
    specialization?: string
    experienceYears?: number
    experience_years?: number
    qualification?: string
    medicalLicense?: string
    medical_license?: string
    consultationFee?: number
    consultation_fee?: number
    clinicAddress?: string
    clinic_address?: string
    bio?: string
    consultationType?: string
    consultation_type?: string
    availability?: string[]
  }) =>
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { identifier?: string; email?: string; phone?: string; mobile?: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (data: { token: string; email?: string; password: string }) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCurrentUser: () => request<{ user: any }>('/auth/me'),

  // Doctor API
  getDoctorStats: () =>
    request<{ doctorId: string; totalPatients: number; highRiskPatients: number; newAlerts: number; upcomingAppointments?: number }>('/doctor/stats'),

  getDoctorPatients: (search?: string) =>
    request<{ patients: any[] }>('/doctor/patients' + (search ? `?search=${encodeURIComponent(search)}` : '')),

  addDoctorPatient: (patientId: string, reason?: string) =>
    request<{ message: string; relationship: any; patient: any }>('/doctor/patients', {
      method: 'POST',
      body: JSON.stringify({ patientId, reason }),
    }),

  removeDoctorPatient: (patientId: string) =>
    request<{ message: string }>(`/doctor/patients/${encodeURIComponent(patientId)}`, {
      method: 'DELETE',
    }),

  getDoctorPatientProfile: (patientId: string) =>
    request<{
      patient: any;
      reports: any[];
      reportSummary: any;
      trends: any[];
      diseaseRisks: any[];
      dietPlan?: any;
      appointments?: any[];
      prescriptions?: any[];
      messagesCount?: number;
    }>(`/doctor/patient/${encodeURIComponent(patientId)}`),

  searchPatient: (patientId: string) =>
    request<{
      patient: any;
      reports: any[];
      reportSummary: any;
      trends: any[];
      diseaseRisks: any[];
      dietPlan?: any;
      appointments?: any[];
      prescriptions?: any[];
      messagesCount?: number;
    }>('/doctor/patient/' + encodeURIComponent(patientId)),

  getDoctorAlerts: (status?: string) =>
    request<{ alerts: any[] }>('/doctor/alerts' + (status ? `?status=${encodeURIComponent(status)}` : '')),

  reviewPatientAlert: (alertId: string) =>
    request<{ message: string; alert: any }>(`/doctor/alerts/${encodeURIComponent(alertId)}/review`, {
      method: 'PUT',
    }),

  // Appointments API & Doctor Discovery
  getAvailableDoctors: () =>
    request<{ doctors: any[] }>('/appointments/doctors'),

  getDoctorDetails: (doctorId: string, date?: string) =>
    request<{ doctor: any; slots: { time: string; isAvailable: boolean }[] }>(
      `/appointments/doctors/${encodeURIComponent(doctorId)}` + (date ? `?date=${encodeURIComponent(date)}` : '')
    ),

  bookAppointment: (data: {
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentType: 'online' | 'offline';
    reason?: string;
    fee?: number;
    paymentMethod?: string;
    paymentReference?: string;
  }) =>
    request<{ message: string; appointment: any; payment: any }>('/appointments/book', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyAppointments: (filters?: { status?: string; type?: string; date?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.date) params.set('date', filters.date);
    const qs = params.toString();
    return request<{ appointments: any[] }>('/appointments/my' + (qs ? `?${qs}` : ''));
  },

  getAppointmentById: (id: string) =>
    request<{ appointment: any }>(`/appointments/${encodeURIComponent(id)}`),

  updateAppointmentStatus: (id: string, data: { status: 'confirmed' | 'completed' | 'cancelled'; doctorNotes?: string }) =>
    request<{ message: string; appointment: any }>(`/appointments/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Messages API (Doctor <-> Patient)
  getConversations: () =>
    request<{ conversations: { partner: any; latestMessage: any; unreadCount: number; lastActivity: string }[] }>('/messages/conversations'),

  getMessageThread: (otherUserId: string) =>
    request<{ partner: any; messages: any[] }>(`/messages/${encodeURIComponent(otherUserId)}`),

  sendMessage: (otherUserId: string, message: string, appointmentId?: string) =>
    request<{ message: string; data: any }>(`/messages/${encodeURIComponent(otherUserId)}`, {
      method: 'POST',
      body: JSON.stringify({ message, appointmentId }),
    }),

  markThreadRead: (otherUserId: string) =>
    request<{ message: string }>(`/messages/read/${encodeURIComponent(otherUserId)}`, {
      method: 'PUT',
    }),

  // Prescriptions API
  uploadPrescription: (formData: FormData) =>
    request<{ message: string; prescription: any }>('/prescriptions/upload', {
      method: 'POST',
      body: formData,
    }),

  getMyPrescriptions: () =>
    request<{ prescriptions: any[] }>('/prescriptions/my'),

  getPatientPrescriptions: (patientId: string) =>
    request<{ prescriptions: any[] }>(`/prescriptions/patient/${encodeURIComponent(patientId)}`),

  getPrescriptionDownloadUrl: (id: string) => {
    return `${API_BASE_URL}/prescriptions/download/${encodeURIComponent(id)}`;
  },

  // Notifications API
  getNotifications: () =>
    request<{ notifications: any[]; unreadCount: number }>('/notifications'),

  markNotificationRead: (id: string) =>
    request<{ message: string; notification: any }>(`/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PUT',
    }),

  markAllNotificationsRead: () =>
    request<{ message: string }>('/notifications/read-all', {
      method: 'PUT',
    }),

  // Telegram Notifications API
  getTelegramStatus: () =>
    request<{
      connected: boolean;
      botConfigured: boolean;
      botUsername: string;
      chatId?: string;
      username?: string | null;
      firstName?: string | null;
      connectedAt?: string;
      timezone?: string;
      preferences: {
        notifyMedicines: boolean;
        notifyAppointments: boolean;
        notifyReports: boolean;
        notifyMessages: boolean;
        notifyDiet: boolean;
      };
    }>('/notifications/telegram/status'),

  generateTelegramToken: () =>
    request<{
      message: string;
      token: string;
      botUsername: string;
      deepLink: string;
      webLink?: string;
      expiresAt: string;
      expiresInMinutes: number;
    }>('/notifications/telegram/token', {
      method: 'POST',
    }),

  disconnectTelegram: () =>
    request<{ success: boolean; message: string }>('/notifications/telegram/disconnect', {
      method: 'POST',
    }),

  updateTelegramPreferences: (preferences: {
    notifyMedicines?: boolean;
    notifyAppointments?: boolean;
    notifyReports?: boolean;
    notifyMessages?: boolean;
    notifyDiet?: boolean;
  }) =>
    request<{
      message: string;
      preferences: {
        notifyMedicines: boolean;
        notifyAppointments: boolean;
        notifyReports: boolean;
        notifyMessages: boolean;
        notifyDiet: boolean;
      };
    }>('/notifications/telegram/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),

  sendTelegramTestNotification: () =>
    request<{ message: string; messageId?: number }>('/notifications/telegram/test', {
      method: 'POST',
    }),

  sendEmailTestNotification: (email?: string) =>
    request<{ message: string; success: boolean; messageId: string }>('/notifications/email/test', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),


  // Profile & Settings
  getProfile: () => request<{ profile?: any; user?: any }>('/users/profile'),

  updateProfile: (data: Partial<{
    name: string
    phone: string
    age: number
    gender: string
    heightCm: number
    weightKg: number
    bloodGroup: string
    height_cm: number
    weight_kg: number
    blood_type: string
    smokingHabit: string
    activityLevel: string
    dietaryPreference: string
    allergies: string[]
    existingConditions: string[]
    hospitalName: string
    hospital_name: string
    specialization: string
    experienceYears: number
    experience_years: number
    qualification: string
    medicalLicense: string
    medical_license: string
    consultationFee: number
    consultation_fee: number
    clinicAddress: string
    clinic_address: string
    bio: string
    consultationType: string
    consultation_type: string
    availability: string[]
  }>) =>
    request<{ profile?: any; user?: any }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getSettings: () => request<{ settings: any }>('/users/settings'),

  updateSettings: (data: Partial<{ theme: string; language: string; email_notifications: boolean; data_sharing: boolean }>) =>
    request<{ settings: any }>('/users/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Reports
  createManualReport: (data: any) =>
    request<{ report: any; message: string }>('/reports/manual', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  uploadReport: (formData: FormData) =>
    request<{ report: any; parsed_data: any }>('/reports/upload', {
      method: 'POST',
      body: formData,
    }),

  getReports: () => request<{ reports: any[] }>('/reports'),

  getReportById: (id: string) => request<{ report: any }>('/reports/' + id),

  getReportRisk: (id: string) =>
    request<{
      reportId: string;
      patientName: string;
      findings: Array<{
        organ_system: string;
        finding_name: string;
        value: string;
        stage: string;
        interpretation: string;
        guideline: string;
        source_trace: any;
      }>;
      ml_risk: {
        status: string;
        reason?: string;
        model_name?: string;
        predicted_probability?: number;
        risk_category?: string;
        top_driving_features?: Array<{ feature: string; importance_weight: number }>;
        missing_required_markers?: string[];
      };
      action_required: boolean;
      emergency_alert?: string | null;
      disclaimer: string;
    }>('/reports/' + id + '/risk'),

  getReportSummaryPdfUrl: (id: string) => `${API_BASE_URL}/reports/${encodeURIComponent(id)}/summary-pdf`,
  getReportFileUrl: (id: string) => `${API_BASE_URL}/reports/${encodeURIComponent(id)}/file`,

  getTrends: () => request<{ trends: any[] }>('/reports/trends'),

  getDiseaseRisks: () =>
    request<{ hasData?: boolean; diseaseRisks: any[]; lastAnalyzedAt?: string; message?: string }>('/reports/disease-risks'),

  getDiseaseRiskDetails: (organ: string) =>
    request<any>('/reports/disease-risks/' + organ + '/details'),

  analyzeDiseaseRisks: () =>
    request<{ hasData?: boolean; diseaseRisks: any[]; lastAnalyzedAt?: string; message?: string }>('/reports/disease-risks/analyze', {
      method: 'POST',
    }),

  deleteReport: (id: string) =>
    request<{ message: string }>('/reports/' + id, {
      method: 'DELETE',
    }),

  consolidateManualReports: () =>
    request<{ message: string; targetReportId?: string; totalVitals?: number }>('/reports/consolidate-manual', {
      method: 'POST',
    }),

  // Model Status
  getModelStatus: () =>
    request<{ status: string; model_status: string; is_ready: boolean; message: string; model_name?: string }>('/health/model-status'),

  // Diet Planner API
  getDietProfile: (patientId?: string) =>
    request<{
      preferences: any;
      patient: any;
      clinicalVitals: any;
      diseaseRisks: any[];
    }>('/diet/profile' + (patientId ? `?patientId=${encodeURIComponent(patientId)}` : '')),

  updateDietProfile: (data: {
    dietType?: string;
    foodPreference?: string;
    activityLevel?: string;
    mealCount?: number;
    allergies?: string[];
    excludedFoods?: string[];
    healthGoal?: string;
    calorieTargetOverride?: number | null;
  }) =>
    request<{ message: string; preferences: any }>('/diet/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  generateDietPlan: (data: Record<string, any> = {}) =>
    request<{
      message: string;
      planId: string;
      generatedAt: string;
      weekRange?: string;
      targetCalories: number;
      mealCount: number;
      weeklyPlan: any[];
      meals: Record<string, { title: string; items: any[]; nutrition: any }>;
      dailyNutrition: any;
      clinicalContext: any;
      safety: { safetyStatus: string; warnings: any[] };
      preferences: any;
      diseaseRisks: any[];
    }>('/diet/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCurrentDietPlan: (patientId?: string) =>
    request<{
      planId: string;
      generatedAt: string;
      weekRange?: string;
      targetCalories?: number;
      mealCount?: number;
      weeklyPlan?: any[];
      meals: Record<string, { title: string; items: any[]; nutrition: any }>;
      dailyNutrition: any;
      clinicalContext: any;
      safety: { safetyStatus: string; warnings: any[] };
      diseaseRisks?: any[];
      preferences?: any;
    }>('/diet/current' + (patientId ? `?patientId=${encodeURIComponent(patientId)}` : '')),

  getDietPlanHistory: (patientId?: string) =>
    request<{ total: number; history: any[] }>(
      '/diet/history' + (patientId ? `?patientId=${encodeURIComponent(patientId)}` : '')
    ),

  deleteDietPlan: (id: string) =>
    request<{ message: string; deletedId?: string }>('/diet/history/' + encodeURIComponent(id), {
      method: 'DELETE',
    }),

  searchFoods: (q?: string, group?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (group) params.set('group', group);
    if (limit) params.set('limit', String(limit));
    const qs = params.toString();
    return request<{ total: number; foods: any[] }>('/diet/foods/search' + (qs ? `?${qs}` : ''));
  },

  getFoodDetails: (id: string) =>
    request<{ food: any }>('/diet/foods/' + encodeURIComponent(id)),

  // AI Assistant & Explanation
  sendChatMessage: (message: string) =>
    request<{ message: string; model: string; isEmergency?: boolean; timestamp: string }>('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  streamChatMessage: async (
    message: string,
    onToken: (token: string) => void,
    onComplete: (data: { fullText: string; model?: string; isEmergency?: boolean; timingMs?: number }) => void,
    onError: (err: Error) => void
  ) => {
    try {
      const token = getToken();
      const res = await fetch('/api/assistant/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP ${res.status}`);
      }

      if (!res.body) {
        throw new Error('ReadableStream not supported');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let fullText = '';
      let model = '';
      let isEmergency = false;
      let timingMs = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.token) {
                fullText += parsed.token;
                onToken(parsed.token);
              }
              if (parsed.done) {
                if (parsed.fullText) fullText = parsed.fullText;
                if (parsed.model) model = parsed.model;
                if (parsed.isEmergency) isEmergency = parsed.isEmergency;
                if (parsed.timingMs) timingMs = parsed.timingMs;
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e: any) {
              if (e.message && e.message.includes('interrupted')) throw e;
            }
          }
        }
      }

      onComplete({ fullText, model, isEmergency, timingMs });
    } catch (err: any) {
      onError(err);
    }
  },

  getChatHistory: () =>
    request<{ messages: { id: string; role: 'user' | 'assistant'; content: string; timestamp: string }[] }>('/assistant/history'),

  clearChatHistory: () =>
    request<{ message: string }>('/assistant/history', {
      method: 'DELETE',
    }),

  getAiHealth: () =>
    request<{ available: boolean; model: string; baseUrl?: string; error?: string; activeModel?: string; installedModels?: string[] }>('/assistant/health'),

  reExplainReport: (id: string) =>
    request<{ message: string; keyFindings: any[]; aiExplanation: any }>(`/reports/${encodeURIComponent(id)}/explain`, {
      method: 'POST',
    }),
}

