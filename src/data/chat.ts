import type { ChatMessage } from '@/types'

export const suggestedQuestions: string[] = [
  'Explain my latest lab report',
  'What do my recent vital trends indicate?',
  'How can I improve my diet based on my plan?',
  'What foods are rich in dietary fiber and low in sodium?',
  'What questions should I prepare for my next doctor visit?',
]

export const suggestedDoctorQuestions: string[] = [
  'Do I have any appointments scheduled for today?',
  'Summarize the latest report for patient P000001',
  'Which of my patients are currently flagged as high risk?',
  'Show me the recent consultations and booked slots',
]

export function createWelcomeMessage(userName?: string, role: string = 'patient'): ChatMessage {
  const nameStr = userName ? ` ${userName}` : ''
  const content = role === 'doctor'
    ? `Hello Dr.${nameStr}! I'm your MediAssist AI Clinical Assistant. You can ask me about your schedule today (e.g. "any appointments today?"), look up patient clinical reports (e.g. "detailed reports of patient P000001"), or check high-risk patient flags. How can I assist you?`
    : `Hello${nameStr}! I'm your MediAssist AI Health Assistant. I can help explain your lab reports, analyze your vital trends, and discuss healthy nutrition. How can I assist you today?`

  return {
    id: 'welcome',
    role: 'assistant',
    content,
    timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}

