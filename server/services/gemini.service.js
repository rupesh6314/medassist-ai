/**
 * Central Google Gemini AI Service
 * MedAssist AI — Natural Language Report Explanations and Health Assistant Chat
 * 
 * Powered by Google's official @google/genai JavaScript SDK.
 * Server-side ONLY. API keys are strictly kept on the backend.
 */

const { GoogleGenAI, Type } = require('@google/genai');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || '';
}

function getGeminiClient() {
  const apiKey = getGeminiApiKey();
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured in server/.env. Please configure a valid Google Gemini API key.');
  }
  return new GoogleGenAI({ apiKey: apiKey.trim() });
}

/**
 * Format milliseconds duration
 */
function formatMs(ms) {
  return `${Math.round(ms)}ms (${(ms / 1000).toFixed(2)}s)`;
}

/**
 * Safe logging helper (zero patient PII, zero credentials logged)
 */
function logGeminiTelemetry(type, model, durationMs, extra = '') {
  console.log(`[Gemini Telemetry] [${type}] Model: ${model} | Latency: ${formatMs(durationMs)}${extra ? ' | ' + extra : ''}`);
}

/**
 * Check real-time Gemini AI availability and configuration
 */
async function checkGeminiHealth() {
  const apiKey = getGeminiApiKey();
  const configuredModel = GEMINI_MODEL;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    return {
      available: false,
      model: configuredModel,
      provider: 'Google Gemini AI',
      error: 'GEMINI_API_KEY is not configured in server/.env'
    };
  }

  try {
    const ai = getGeminiClient();
    // Verify client initialization
    if (!ai || !ai.models) {
      throw new Error('Failed to initialize Gemini API client');
    }

    return {
      available: true,
      model: configuredModel,
      provider: 'Google Gemini AI'
    };
  } catch (err) {
    return {
      available: false,
      model: configuredModel,
      provider: 'Google Gemini AI',
      error: err.message || 'Unable to connect to Google Gemini API'
    };
  }
}

// System instruction for Medical Report Explanations
const REPORT_SYSTEM_INSTRUCTION = `You are the medical report explanation component of MediAssist AI.

Your task is to explain laboratory parameters from an already-extracted medical report in simple, patient-friendly language.

The supplied report values are authoritative.

For every supplied parameter:
- Explain what the parameter measures.
- Explain what the reported result means relative to the supplied reference range.
- Explain why the parameter is clinically relevant.
- If abnormal, briefly explain common factors or conditions that can be associated with such a result.
- Use cautious medical language.
- Do not diagnose the patient from a single laboratory value.
- Do not prescribe medication or treatment.
- Do not invent missing clinical information.
- Do not change the reported numerical value.
- Do not change the unit.
- Do not change the reference range.
- Do not change the supplied status.
- Do not calculate disease-risk percentages.
- Do not generate unrelated medical information.

The explanation must be specific to the supplied parameter.
Do not use generic explanations that could apply to unrelated parameters.
The actual report data is authoritative; your role is explanation only.`;

/**
 * Generate structured report explanation via Gemini API (Single batch request with JSON schema)
 */
async function generateReportExplanation(patientInfo = {}, vitals = []) {
  const validParams = (vitals || []).filter(v => {
    const lbl = (v.label || v.name || v.parameter || v.parameter_name || '').trim();
    return lbl.length > 0 && !/^(test|parameter|investigation|name|result|unit|range)$/i.test(lbl);
  });

  if (validParams.length === 0) {
    return {
      isAiGenerated: false,
      summary: 'No clinical vital parameters available for explanation.',
      parameters: []
    };
  }

  const startTime = Date.now();
  const activeModel = GEMINI_MODEL;

  try {
    const ai = getGeminiClient();

    const formattedParams = validParams.map(v => ({
      name: (v.label || v.name || v.parameter || v.parameter_name || '').trim(),
      value: v.value !== undefined ? v.value : v.val,
      unit: v.unit || '',
      referenceRange: v.referenceRange || v.reference_range || 'Standard lab range',
      status: v.status || 'normal'
    }));

    const promptText = JSON.stringify({
      patientContext: {
        age: patientInfo.age || null,
        gender: patientInfo.gender || null,
        reportType: patientInfo.type || 'Clinical Lab Report'
      },
      parameters: formattedParams
    }, null, 2);

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description: 'A 1-2 sentence overall summary of the report parameters in plain language.'
        },
        explanations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              parameter: {
                type: Type.STRING,
                description: 'The exact parameter name matching the input.'
              },
              explanation: {
                type: Type.STRING,
                description: 'Clear, concise 1-2 sentence patient-friendly explanation specific to this parameter and result.'
              }
            },
            required: ['parameter', 'explanation']
          }
        }
      },
      required: ['summary', 'explanations']
    };

    console.log(`[Gemini Start] Report Explanation | Model: ${activeModel} | Params: ${validParams.length}`);

    const response = await ai.models.generateContent({
      model: activeModel,
      contents: promptText,
      config: {
        systemInstruction: REPORT_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.1
      }
    });

    const elapsed = Date.now() - startTime;
    logGeminiTelemetry('ReportExplanation', activeModel, elapsed, `Count: ${validParams.length}`);

    let parsed = null;
    try {
      const responseText = response.text || '';
      parsed = JSON.parse(responseText);
    } catch (parseErr) {
      console.warn('[Gemini Parse Warning] Failed to parse structured JSON:', parseErr.message);
    }

    if (parsed && Array.isArray(parsed.explanations)) {
      const explanationsList = parsed.explanations;
      
      const mappedParameters = validParams.map(v => {
        const pName = (v.label || v.name || v.parameter || v.parameter_name || '').trim().toLowerCase();
        
        // Exact or case-insensitive match
        const found = explanationsList.find(e => {
          const eName = (e.parameter || e.name || '').trim().toLowerCase();
          return eName === pName || pName.includes(eName) || eName.includes(pName);
        });

        return {
          name: (v.label || v.name || v.parameter || v.parameter_name || '').trim(),
          value: v.value !== undefined ? v.value : v.val,
          unit: v.unit || '',
          status: v.status || 'normal',
          referenceRange: v.referenceRange || v.reference_range || '',
          explanation: found ? found.explanation : `Measures ${v.label || v.name || v.parameter_name || 'this parameter'} relative to standard reference ranges.`
        };
      });

      return {
        isAiGenerated: true,
        model: activeModel,
        summary: parsed.summary || 'Report parameters evaluated by Gemini AI.',
        parameters: mappedParameters,
        timingMs: elapsed
      };
    }

    throw new Error('Gemini returned an invalid response structure');
  } catch (err) {
    console.warn('[Gemini Explainer Warning]', err.message);
    const elapsed = Date.now() - startTime;

    return {
      isAiGenerated: false,
      model: activeModel,
      summary: 'AI explanation is currently unavailable. Please check Gemini API configuration.',
      parameters: validParams.map(v => ({
        name: (v.label || v.name || v.parameter || v.parameter_name || '').trim(),
        value: v.value !== undefined ? v.value : v.val,
        unit: v.unit || '',
        status: v.status || 'normal',
        referenceRange: v.referenceRange || v.reference_range || '',
        explanation: 'AI explanation unavailable.'
      })),
      error: err.message,
      timingMs: elapsed
    };
  }
}

// System instruction for Health Assistant Chat
const ASSISTANT_SYSTEM_INSTRUCTION = `You are MediAssist AI Clinical & Health Assistant.
You assist both patients and doctors with clinical comprehension, schedule queries, and medical records.

Rules:
1. Use the data supplied by the application in the context as the authoritative source.
2. If the user is a Doctor asking about appointments today or scheduled patients, summarize the appointment details from the context clearly (times, patient names, status, reasons).
3. If the user is a Doctor asking about a specific patient (e.g. by patient ID like P000001 or by name), provide a clear clinical summary using the patient's reports, vitals, and risk factors from the context.
4. If the user is a Patient, explain their lab results, vital trends, and diet guidance in simple, compassionate language.
5. Never invent or alter patient values, lab results, or disease-risk percentages.
6. Do not prescribe medication or recommend changing prescriptions.
7. If requested records or appointments are not found in the supplied context, state clearly that no records were found.
8. Protect patient privacy and maintain clinical confidentiality.
9. If someone describes an emergency (crushing chest pain, severe shortness of breath), advise urgent medical attention.`;

/**
 * Dynamic Context Builder for Health Assistant
 * Supports both Patient context and Doctor clinical context
 */
function buildMinimalPatientContext(contextData = {}, userMessage = '', userRole = 'patient') {
  const lower = (userMessage || '').toLowerCase();
  let contextText = '';

  // --- DOCTOR CONTEXT BUILDER ---
  if (userRole === 'doctor' || contextData.role === 'doctor') {
    contextText += `=== CLINICAL DOCTOR CONTEXT ===\nDoctor: Dr. ${contextData.doctorName || 'Doctor'}\n`;

    // Appointments Today
    if (Array.isArray(contextData.appointmentsToday) && contextData.appointmentsToday.length > 0) {
      contextText += `\n=== TODAY'S APPOINTMENTS (${contextData.appointmentsToday.length}) ===\n`;
      contextData.appointmentsToday.forEach(a => {
        contextText += `- Time: ${a.time || 'Scheduled'} | Patient: ${a.patientName} (${a.patientCode || 'ID: ' + a.patientId}) | Type: ${a.type || 'Consultation'} | Reason: ${a.reason || 'General Follow-up'} | Status: ${a.status}\n`;
      });
    } else {
      contextText += `\n=== TODAY'S APPOINTMENTS ===\nNo consultations or appointments scheduled for today.\n`;
    }

    // Searched Patient Details (e.g., patient P000001)
    if (contextData.searchedPatient) {
      const sp = contextData.searchedPatient;
      contextText += `\n=== SEARCHED PATIENT RECORD: ${sp.profile.name} (${sp.profile.patientCode || 'ID: ' + sp.profile.id}) ===\n`;
      contextText += `Age: ${sp.profile.age || 'N/A'} | Gender: ${sp.profile.gender || 'N/A'} | Blood Group: ${sp.profile.bloodGroup || 'N/A'}\n`;

      if (Array.isArray(sp.reports) && sp.reports.length > 0) {
        contextText += `Recent Reports:\n`;
        sp.reports.forEach(r => {
          contextText += `  * Report Date: ${r.reportDate || 'N/A'} | Type: ${r.type} | Summary: ${r.summary}\n`;
        });
      }

      if (Array.isArray(sp.vitals) && sp.vitals.length > 0) {
        contextText += `Recent Vitals:\n`;
        sp.vitals.forEach(v => {
          contextText += `  * ${v.label}: ${v.value} ${v.unit || ''} (Status: ${v.status}, Range: ${v.referenceRange || 'N/A'})\n`;
        });
      }

      if (Array.isArray(sp.diseaseRisks) && sp.diseaseRisks.length > 0) {
        contextText += `ML Disease Risks:\n`;
        sp.diseaseRisks.forEach(dr => {
          contextText += `  * ${dr.name}: ${dr.percentage}% (${dr.status})\n`;
        });
      }
    }

    // High Risk Patients in Roster
    if (Array.isArray(contextData.highRiskPatients) && contextData.highRiskPatients.length > 0) {
      contextText += `\n=== HIGH RISK PATIENTS IN ROSTER ===\n`;
      contextData.highRiskPatients.forEach(hr => {
        contextText += `- ${hr.name} (${hr.patientCode}): ${hr.riskCondition} ${hr.percentage}% (${hr.status})\n`;
      });
    }

    return contextText.trim();
  }

  // --- PATIENT CONTEXT BUILDER ---
  const patientContext = contextData;
  // 1. Basic Demographics
  if (patientContext.profile) {
    const p = patientContext.profile;
    contextText += `=== PATIENT DEMOGRAPHICS ===\n`;
    if (p.age) contextText += `Age: ${p.age} years | `;
    if (p.gender) contextText += `Gender: ${p.gender} | `;
    if (p.bloodGroup) contextText += `Blood Group: ${p.bloodGroup} | `;
    if (p.heightCm && p.weightKg) contextText += `Height: ${p.heightCm}cm, Weight: ${p.weightKg}kg\n`;
    else contextText += `\n`;
    if (p.dietaryPreference) contextText += `Diet Preference: ${p.dietaryPreference}\n`;
  }

  // 2. Vitals Filtering based on query intent
  const isAskingSpecificVital = /hemoglobin|glucose|sugar|creatinine|blood pressure|bp|cholesterol|platelet|wbc|rbc|alt|ast|bilirubin|hba1c/i.test(lower);
  const isAskingAboutTrends = /trend|history|change|previous|past|improving|worsening/i.test(lower);
  const isAskingAboutReport = /report|test|result|summary|finding|lab/i.test(lower);
  const isAskingAboutRisk = /risk|disease|diabetes|heart|kidney|liver|anemia/i.test(lower);
  const isAskingAboutDiet = /diet|food|meal|eat|nutrition|calorie|protein/i.test(lower);

  if (Array.isArray(patientContext.vitals) && patientContext.vitals.length > 0) {
    let filteredVitals = patientContext.vitals;

    if (isAskingSpecificVital) {
      filteredVitals = patientContext.vitals.filter(v => {
        const lbl = (v.label || '').toLowerCase();
        if (/hemoglobin|hb\b|hgb\b/i.test(lower) && /hemoglobin|hb|hgb/i.test(lbl)) return true;
        if (/sugar|glucose|fbs/i.test(lower) && /sugar|glucose|fbs/i.test(lbl)) return true;
        if (/creatinine/i.test(lower) && /creatinine/i.test(lbl)) return true;
        if (/pressure|bp/i.test(lower) && /pressure|bp|systolic|diastolic/i.test(lbl)) return true;
        if (/cholesterol|lipid/i.test(lower) && /cholesterol|lipid|ldl|hdl/i.test(lbl)) return true;
        if (/platelet/i.test(lower) && /platelet/i.test(lbl)) return true;
        if (/wbc|white blood/i.test(lower) && /wbc|white blood/i.test(lbl)) return true;
        if (/rbc|red blood/i.test(lower) && /rbc|red blood/i.test(lbl)) return true;
        if (/alt|sgpt/i.test(lower) && /alt|sgpt/i.test(lbl)) return true;
        if (/ast|sgot/i.test(lower) && /ast|sgot/i.test(lbl)) return true;
        if (/bilirubin/i.test(lower) && /bilirubin/i.test(lbl)) return true;
        if (/hba1c|glycated/i.test(lower) && /hba1c|glycated/i.test(lbl)) return true;
        return false;
      });
      if (filteredVitals.length === 0) filteredVitals = patientContext.vitals.slice(0, 5);
    } else if (!isAskingAboutTrends && !isAskingAboutReport) {
      filteredVitals = patientContext.vitals.slice(0, 4);
    }

    if (filteredVitals.length > 0) {
      contextText += `\n=== RELEVANT VITAL MEASUREMENTS ===\n`;
      filteredVitals.forEach(v => {
        contextText += `- ${v.label}: ${v.value} ${v.unit || ''} (Status: ${v.status || 'normal'}, Ref: ${v.referenceRange || 'N/A'})\n`;
      });
    }
  }

  // 3. Pre-computed ML Disease Risk (only if risk query)
  if (isAskingAboutRisk && Array.isArray(patientContext.diseaseRisks) && patientContext.diseaseRisks.length > 0) {
    contextText += `\n=== DISEASE RISK ASSESSMENTS (Pre-calculated by Random Forest ML) ===\n`;
    patientContext.diseaseRisks.forEach(r => {
      contextText += `- ${r.name}: ${r.status || 'Low'} (${r.percentage || 0}% risk score)\n`;
    });
  }

  // 4. Diet Plan (only if diet query)
  if (isAskingAboutDiet && patientContext.dietPlan) {
    const dp = patientContext.dietPlan;
    contextText += `\n=== DIET PLAN SUMMARY ===\n`;
    if (dp.targetCalories) contextText += `Target Calories: ${dp.targetCalories} kcal/day\n`;
    if (dp.healthGoal) contextText += `Goal: ${dp.healthGoal}\n`;
  }

  // 5. Latest Report summary (only if report query)
  if (isAskingAboutReport && patientContext.latestReport) {
    const rep = patientContext.latestReport;
    contextText += `\n=== LATEST MEDICAL REPORT ===\n`;
    contextText += `Type: ${rep.type || 'Lab Report'} | Date: ${rep.reportDate || 'Recent'}\n`;
    if (rep.summary) contextText += `Summary: ${rep.summary}\n`;
  }

  // 6. Patient Appointments
  if (Array.isArray(patientContext.appointments)) {
    if (patientContext.appointments.length > 0) {
      contextText += `\n=== UPCOMING APPOINTMENTS ===\n`;
      patientContext.appointments.forEach(a => {
        contextText += `- Date: ${a.date} at ${a.time || 'Scheduled'} with Dr. ${a.doctorName} (${a.specialization || 'Doctor'}) | Type: ${a.type} | Status: ${a.status}\n`;
      });
    } else if (/appointment|consultation|booking|schedule/i.test(lower)) {
      contextText += `\n=== UPCOMING APPOINTMENTS ===\nNo upcoming appointments scheduled.\n`;
    }
  }

  return contextText.trim();
}

/**
 * Format message contents for Gemini API (combining context, history, and user message)
 */
function buildGeminiContents(contextData = {}, conversationHistory = [], userMessage = '', userRole = 'patient') {
  const minimalContext = buildMinimalPatientContext(contextData, userMessage, userRole);
  const contents = [];

  // Add conversation history turns (user / model)
  if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    for (const msg of conversationHistory) {
      const role = msg.role === 'assistant' ? 'model' : 'user';
      contents.push({
        role: role,
        parts: [{ text: msg.content || '' }]
      });
    }
  }

  // Current user turn with context header
  let currentUserText = '';
  if (minimalContext) {
    const contextHeader = userRole === 'doctor' ? '[CLINICAL DATABASE CONTEXT]' : '[PATIENT MEDICAL RECORD CONTEXT]';
    currentUserText += `${contextHeader}\n${minimalContext}\n\n[USER QUESTION]\n${userMessage}`;
  } else {
    currentUserText = userMessage;
  }

  contents.push({
    role: 'user',
    parts: [{ text: currentUserText }]
  });

  return contents;
}

/**
 * Generate context-aware chat response from Gemini (Non-streaming fallback)
 */
async function generateAssistantChatResponse(contextData = {}, conversationHistory = [], userMessage = '', userRole = 'patient') {
  const isSelfHarmCrisis = /\b(suicide|suicidal|kill myself|want to die|end my life|self-harm|hurting myself|take my own life)\b/i.test(userMessage);
  if (isSelfHarmCrisis) {
    return {
      message: '🆘 **CRISIS SUPPORT & HELPLINE**: If you are feeling overwhelmed, hopeless, or having thoughts of self-harm, please know that you are not alone and compassionate support is available right now:\n\n- **India**: Call **Tele-MANAS** at **14416** / **1800-891-4416**, **Vandrevala Foundation** at **+91 9999 666 555**, or **AASRA** at **+91 98204 66726** (24/7).\n- **US / Canada**: Call or text **988** (Suicide & Crisis Lifeline) available 24/7.\n- **UK**: Call **111** or text **SHOUT** to **85258**.\n- **International**: Free, confidential support is available at [findahelpline.com](https://findahelpline.com).\n\nPlease speak with someone who can support you through this.',
      model: GEMINI_MODEL,
      isEmergency: true,
      timingMs: 0
    };
  }

  const isMedicalEmergency = /\b(chest pain|cannot breathe|difficulty breathing|shortness of breath|heart attack|stroke|severe bleeding|unconscious|choking|anaphylaxis)\b/i.test(userMessage);
  if (isMedicalEmergency) {
    return {
      message: '🚨 **MEDICAL EMERGENCY ALERT**: If you or someone with you is experiencing severe symptoms such as sudden crushing chest pain, difficulty breathing, sudden weakness/numbness, or severe bleeding, please call emergency medical services immediately (e.g., **112 / 108** in India, **911** in US, **999** in UK) or go to the nearest emergency department.',
      model: GEMINI_MODEL,
      isEmergency: true,
      timingMs: 0
    };
  }

  const startTime = Date.now();
  const activeModel = GEMINI_MODEL;
  const ai = getGeminiClient();

  const contents = buildGeminiContents(contextData, conversationHistory, userMessage, userRole);

  console.log(`[Gemini Start] Assistant Chat | Model: ${activeModel} | Turns: ${contents.length}`);

  const response = await ai.models.generateContent({
    model: activeModel,
    contents: contents,
    config: {
      systemInstruction: ASSISTANT_SYSTEM_INSTRUCTION,
      temperature: 0.3
    }
  });

  const elapsed = Date.now() - startTime;
  logGeminiTelemetry('AssistantChat', activeModel, elapsed);

  const replyText = response.text || 'Information is currently unavailable.';

  return {
    message: replyText,
    model: activeModel,
    isEmergency: false,
    timingMs: elapsed
  };
}

/**
 * Stream context-aware chat response from Gemini API (SSE / Chunk stream)
 */
async function streamAssistantChatResponse(contextData = {}, conversationHistory = [], userMessage = '', { onToken, onComplete, onError }, userRole = 'patient') {
  const isSelfHarmCrisis = /\b(suicide|suicidal|kill myself|want to die|end my life|self-harm|hurting myself|take my own life)\b/i.test(userMessage);
  if (isSelfHarmCrisis) {
    const crisisText = '🆘 **CRISIS SUPPORT & HELPLINE**: If you are feeling overwhelmed, hopeless, or having thoughts of self-harm, please know that you are not alone and compassionate support is available right now:\n\n- **India**: Call **Tele-MANAS** at **14416** / **1800-891-4416**, **Vandrevala Foundation** at **+91 9999 666 555**, or **AASRA** at **+91 98204 66726** (24/7).\n- **US / Canada**: Call or text **988** (Suicide & Crisis Lifeline) available 24/7.\n- **UK**: Call **111** or text **SHOUT** to **85258**.\n- **International**: Free, confidential support is available at [findahelpline.com](https://findahelpline.com).\n\nPlease speak with someone who can support you through this.';
    onToken(crisisText);
    onComplete({ fullText: crisisText, model: GEMINI_MODEL, isEmergency: true, timingMs: 0 });
    return;
  }

  const isMedicalEmergency = /\b(chest pain|cannot breathe|difficulty breathing|shortness of breath|heart attack|stroke|severe bleeding|unconscious|choking|anaphylaxis)\b/i.test(userMessage);
  if (isMedicalEmergency) {
    const emergencyText = '🚨 **MEDICAL EMERGENCY ALERT**: If you or someone with you is experiencing severe symptoms such as sudden crushing chest pain, difficulty breathing, sudden weakness/numbness, or severe bleeding, please call emergency medical services immediately (e.g., **112 / 108** in India, **911** in US, **999** in UK) or go to the nearest emergency department.';
    onToken(emergencyText);
    onComplete({ fullText: emergencyText, model: GEMINI_MODEL, isEmergency: true, timingMs: 0 });
    return;
  }

  const startTime = Date.now();
  const activeModel = GEMINI_MODEL;

  try {
    const ai = getGeminiClient();
    const contents = buildGeminiContents(contextData, conversationHistory, userMessage, userRole);

    console.log(`[Gemini Start] Chat Stream | Model: ${activeModel} | Turns: ${contents.length}`);

    const responseStream = await ai.models.generateContentStream({
      model: activeModel,
      contents: contents,
      config: {
        systemInstruction: ASSISTANT_SYSTEM_INSTRUCTION,
        temperature: 0.3
      }
    });

    let fullText = '';
    let firstTokenTime = null;

    for await (const chunk of responseStream) {
      const chunkText = chunk.text || '';
      if (chunkText) {
        if (!firstTokenTime) {
          firstTokenTime = Date.now() - startTime;
          console.log(`[Gemini TTFT] First token received in ${formatMs(firstTokenTime)}`);
        }
        fullText += chunkText;
        onToken(chunkText);
      }
    }

    const elapsed = Date.now() - startTime;
    logGeminiTelemetry('ChatStream', activeModel, elapsed, `TTFT: ${firstTokenTime || 0}ms`);

    onComplete({
      fullText: fullText || 'Information is currently unavailable.',
      model: activeModel,
      isEmergency: false,
      timingMs: elapsed
    });
  } catch (err) {
    console.error('[Gemini Stream Error]', err.message);
    onError(err);
  }
}

module.exports = {
  GEMINI_MODEL,
  checkGeminiHealth,
  generateReportExplanation,
  generateAssistantChatResponse,
  streamAssistantChatResponse,
  buildMinimalPatientContext
};
