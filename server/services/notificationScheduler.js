const cron = require('node-cron');
const { query } = require('../config/db');
const { dispatchTelegramNotification } = require('./telegram.service');

let cronJob = null;

/**
 * Get date string (YYYY-MM-DD) and current hour in patient's timezone
 */
function getTimeInTimezone(timezone = 'Asia/Kolkata') {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(now);
    const map = {};
    for (const p of parts) {
      map[p.type] = p.value;
    }

    const dateStr = `${map.year}-${map.month}-${map.day}`;
    const hour = parseInt(map.hour, 10);
    const minute = parseInt(map.minute, 10);

    return { dateStr, hour, minute };
  } catch (err) {
    // Fallback to UTC/local
    const d = new Date();
    return {
      dateStr: d.toISOString().split('T')[0],
      hour: d.getHours(),
      minute: d.getMinutes()
    };
  }
}

/**
 * Check and dispatch scheduled medicine reminders
 */
async function checkMedicineReminders() {
  try {
    // 1. Fetch connected patients who have medicine notifications enabled
    const patientsRes = await query(`
      SELECT pts.user_id as "userId", pts.timezone, u.name as "patientName"
      FROM patient_telegram_settings pts
      JOIN users u ON pts.user_id = u.id
      WHERE pts.is_connected = true AND pts.notify_medicines = true
    `);

    if (patientsRes.rows.length === 0) return;

    for (const patient of patientsRes.rows) {
      const { dateStr, hour } = getTimeInTimezone(patient.timezone || 'Asia/Kolkata');

      // Determine active time slot for medicine reminders:
      // Morning (08:00 - 10:00): hour 8 or 9
      // Afternoon (13:00 - 15:00): hour 13 or 14
      // Night (20:00 - 22:00): hour 20 or 21
      let currentSlot = null;
      if (hour >= 8 && hour <= 10) currentSlot = 'morning';
      else if (hour >= 13 && hour <= 15) currentSlot = 'afternoon';
      else if (hour >= 20 && hour <= 22) currentSlot = 'night';

      if (!currentSlot) continue;

      // Fetch active prescriptions for this patient
      const prescRes = await query(
        `SELECT id, prescription_number as "prescriptionNumber", medications, diagnosis, instructions
         FROM prescriptions
         WHERE patient_id = $1 AND uploaded_at >= NOW() - INTERVAL '90 days'
         ORDER BY uploaded_at DESC
         LIMIT 5`,
        [patient.userId]
      );

      for (const presc of prescRes.rows) {
        let meds = presc.medications;
        if (typeof meds === 'string') {
          try { meds = JSON.parse(meds); } catch { meds = []; }
        }
        if (!Array.isArray(meds) || meds.length === 0) continue;

        for (let i = 0; i < meds.length; i++) {
          const med = meds[i];
          if (!med || !med.name || !med.name.trim()) continue;

          const freq = (med.frequency || '').toLowerCase();

          // Check if this medicine matches current slot
          let shouldRemind = false;
          if (currentSlot === 'morning') {
            shouldRemind = freq.includes('daily') || freq.includes('morning') || freq.includes('breakfast') || freq.includes('once') || freq.includes('twice') || freq.includes('three');
          } else if (currentSlot === 'afternoon') {
            shouldRemind = freq.includes('three') || freq.includes('four') || freq.includes('afternoon') || freq.includes('lunch');
          } else if (currentSlot === 'night') {
            shouldRemind = freq.includes('twice') || freq.includes('three') || freq.includes('four') || freq.includes('night') || freq.includes('dinner') || freq.includes('evening') || freq.includes('bedtime');
          }

          if (!shouldRemind) continue;

          const refId = `med-${presc.id}-${i}-${dateStr}-${currentSlot}`;
          const medText = 
`Hello <b>${escapeHtml(patient.patientName)}</b>,

It is time to take your scheduled medication dose:
• 💊 <b>${escapeHtml(med.name)}</b> ${med.dosage ? `(${escapeHtml(med.dosage)})` : ''}
• <b>Schedule:</b> ${escapeHtml(med.frequency || 'As advised')}
• <b>Prescription:</b> #${escapeHtml(presc.prescriptionNumber)}

<i>Please take your medication as prescribed by your doctor.</i>`;

          await dispatchTelegramNotification({
            userId: patient.userId,
            category: 'medicine',
            title: `Medicine Reminder (${capitalize(currentSlot)})`,
            text: medText,
            link: '/prescriptions',
            buttonText: 'View Prescriptions',
            referenceId: refId,
            deduplicateHours: 12
          });
        }
      }
    }
  } catch (err) {
    console.error('[Notification Scheduler] Error in checkMedicineReminders:', err.message);
  }
}

/**
 * Check and dispatch upcoming appointment reminders
 */
async function checkAppointmentReminders() {
  try {
    // Find confirmed appointments scheduled for today
    const apptsRes = await query(`
      SELECT a.id, a.appointment_number as "appointmentNumber", a.appointment_date as "appointmentDate",
             a.appointment_time as "appointmentTime", a.appointment_type as "appointmentType",
             a.clinic_address as "clinicAddress",
             pat.id as "patientUserId", pat.name as "patientName", pts.timezone,
             doc.name as "doctorName", doc.specialization
      FROM appointments a
      JOIN users pat ON a.patient_id = pat.id
      JOIN users doc ON a.doctor_id = doc.id
      JOIN patient_telegram_settings pts ON pts.user_id = pat.id
      WHERE a.appointment_status = 'confirmed'
        AND pts.is_connected = true
        AND pts.notify_appointments = true
        AND a.appointment_date >= CURRENT_DATE
        AND a.appointment_date <= CURRENT_DATE + INTERVAL '1 day'
    `);

    if (apptsRes.rows.length === 0) return;

    for (const appt of apptsRes.rows) {
      const { dateStr, hour } = getTimeInTimezone(appt.timezone || 'Asia/Kolkata');

      // Send reminder on the day of the appointment
      const apptDateIso = typeof appt.appointmentDate === 'string'
        ? appt.appointmentDate.split('T')[0]
        : new Date(appt.appointmentDate).toISOString().split('T')[0];

      if (apptDateIso === dateStr) {
        const refId = `appt-remind-${appt.id}-${dateStr}`;

        const isOnline = (appt.appointmentType || '').toLowerCase() === 'online';
        const typeLabel = isOnline ? 'Online Video Consultation' : 'In-Person Hospital Visit';

        const apptText = 
`Hello <b>${escapeHtml(appt.patientName)}</b>,

You have a confirmed medical appointment scheduled for today:
• 🩺 <b>Dr. ${escapeHtml(appt.doctorName)}</b> (${escapeHtml(appt.specialization || 'Consultant')})
• <b>Time:</b> ${escapeHtml(appt.appointmentTime)}
• <b>Type:</b> ${typeLabel}
${isOnline ? '• <i>Join the consultation room directly via your MedAssist AI portal.</i>' : `• <b>Location:</b> ${escapeHtml(appt.clinicAddress || 'MedAssist Health Center')}`}

<i>Please ensure you are ready 5 to 10 minutes before your scheduled appointment time.</i>`;

        await dispatchTelegramNotification({
          userId: appt.patientUserId,
          category: 'appointment',
          title: 'Upcoming Appointment Reminder',
          text: apptText,
          link: '/appointments',
          buttonText: 'View Appointment Details',
          referenceId: refId,
          deduplicateHours: 24
        });
      }
    }
  } catch (err) {
    console.error('[Notification Scheduler] Error in checkAppointmentReminders:', err.message);
  }
}

/**
 * Check and dispatch daily diet and wellness reminders
 */
async function checkDietReminders() {
  try {
    const patientsRes = await query(`
      SELECT pts.user_id as "userId", pts.timezone, u.name as "patientName"
      FROM patient_telegram_settings pts
      JOIN users u ON pts.user_id = u.id
      WHERE pts.is_connected = true AND pts.notify_diet = true
    `);

    if (patientsRes.rows.length === 0) return;

    for (const patient of patientsRes.rows) {
      const { dateStr, hour } = getTimeInTimezone(patient.timezone || 'Asia/Kolkata');

      let mealSlot = null;
      let mealTitle = null;

      // Breakfast reminder window: 8:00 - 9:00
      if (hour === 8) {
        mealSlot = 'breakfast';
        mealTitle = 'Breakfast & Morning Hydration';
      }
      // Lunch reminder window: 13:00 - 14:00
      else if (hour === 13) {
        mealSlot = 'lunch';
        mealTitle = 'Nutritious Lunch';
      }
      // Dinner reminder window: 20:00 - 21:00
      else if (hour === 20) {
        mealSlot = 'dinner';
        mealTitle = 'Healthy Dinner & Evening Routine';
      }

      if (!mealSlot) continue;

      // Check if patient has an active diet plan
      const planRes = await query(
        `SELECT id, target_calories as "targetCalories" FROM diet_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [patient.userId]
      );

      if (planRes.rows.length === 0) continue;

      const refId = `diet-${patient.userId}-${dateStr}-${mealSlot}`;
      const dietText = 
`Hello <b>${escapeHtml(patient.patientName)}</b>,

It is time for your scheduled <b>${mealTitle}</b>!

🥗 Stay on track with your personalized clinical nutrition goals. Check your MedAssist AI Diet Plan for tailored recommendations, calorie targets, and hydration reminders.`;

      await dispatchTelegramNotification({
        userId: patient.userId,
        category: 'diet',
        title: `Diet & Wellness Reminder`,
        text: dietText,
        link: '/diet',
        buttonText: 'View Nutrition Plan',
        referenceId: refId,
        deduplicateHours: 12
      });
    }
  } catch (err) {
    console.error('[Notification Scheduler] Error in checkDietReminders:', err.message);
  }
}

/**
 * Master scheduler loop: runs every 5 minutes
 */
async function runSchedulerCycle() {
  // Only check doctor appointments (medicine & diet reminders removed per notification preferences)
  await checkAppointmentReminders();
}

/**
 * Start the scheduler
 */
function startNotificationScheduler() {
  if (cronJob) return;

  console.log('[Notification Scheduler] Initializing Telegram notification scheduler (every 5 minutes)...');

  // Run immediately once on startup after 5 seconds
  setTimeout(() => {
    runSchedulerCycle().catch((err) => {
      console.warn('[Notification Scheduler] Initial run note:', err.message);
    });
  }, 5000);

  // Run every 5 minutes: '*/5 * * * *'
  cronJob = cron.schedule('*/5 * * * *', async () => {
    try {
      await runSchedulerCycle();
    } catch (err) {
      console.error('[Notification Scheduler] Cycle error:', err.message);
    }
  });
}

/**
 * Stop scheduler gracefully
 */
function stopNotificationScheduler() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('[Notification Scheduler] Scheduler stopped.');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

module.exports = {
  startNotificationScheduler,
  stopNotificationScheduler,
  runSchedulerCycle
};
