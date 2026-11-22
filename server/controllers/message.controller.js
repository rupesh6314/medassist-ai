const { query } = require('../config/db');
const { createNotification, dispatchTelegramNotification } = require('../services/notification.service');

/**
 * Helper to resolve a user by UUID, patient_id code (e.g. P000001), or doctor_id code (e.g. D000001)
 */
const resolveUserRecord = async (userIdentifier) => {
  if (!userIdentifier) return null;
  const str = userIdentifier.toString().trim();
  const res = await query(
    `SELECT id, name, email, role, doctor_id as "doctorId", patient_id as "patientId", 
            assigned_doctor_id as "assignedDoctorId", specialization, hospital_name as "hospitalName", 
            phone, age, gender, photo_url as "photoUrl"
     FROM users 
     WHERE id::text = $1 OR LOWER(patient_id) = LOWER($1) OR LOWER(doctor_id) = LOWER($1)`,
    [str]
  );
  return res.rows[0] || null;
};

/**
 * Check if sender and receiver are authorized for communication.
 * Valid relationship must strictly be: REGISTERED PATIENT <-> REGISTERED DOCTOR
 * with an established authorized relationship (via doctor_patients active assignment,
 * appointment booking, or primary doctor assignment).
 */
const verifyDoctorPatientRelationship = async (userId1, userId2) => {
  const user1 = await resolveUserRecord(userId1);
  if (!user1) {
    return { authorized: false, reason: 'Sender or current user account not found.' };
  }

  const user2 = await resolveUserRecord(userId2);
  if (!user2) {
    return { authorized: false, reason: 'Recipient user is not registered with MediAssist AI.' };
  }

  // Prevent self-chat
  if (user1.id === user2.id) {
    return { authorized: false, reason: 'Cannot initiate a consultation conversation with yourself.' };
  }

  const role1 = (user1.role || '').toLowerCase();
  const role2 = (user2.role || '').toLowerCase();

  // Restriction 1: Patient-to-patient is blocked
  if (role1 !== 'doctor' && role2 !== 'doctor') {
    return {
      authorized: false,
      reason: 'Patient-to-patient messaging is restricted. Patients can only communicate with registered doctors.'
    };
  }

  // Restriction 2: Doctor-to-doctor is blocked
  if (role1 === 'doctor' && role2 === 'doctor') {
    return {
      authorized: false,
      reason: 'Doctor-to-doctor messaging is not supported. You can only communicate with registered patients.'
    };
  }

  const doctorUser = role1 === 'doctor' ? user1 : user2;
  const patientUser = role1 === 'doctor' ? user2 : user1;

  // Restriction 3: Verify Authorized Relationship exists:
  // - doctor_patients active record
  // - appointments between doctor and patient
  // - patient.assigned_doctor_id === doctor.doctorId or doctor.id
  // - previous messages exchanged
  const relCheck = await query(
    `SELECT 1 FROM users u
     LEFT JOIN doctor_patients dp ON dp.patient_id = $1 AND dp.doctor_id = $2
     LEFT JOIN appointments a ON a.patient_id = $1 AND a.doctor_id = $2
     WHERE u.id = $1 AND (
       (dp.id IS NOT NULL AND (dp.status IS NULL OR dp.status = 'active'))
       OR a.id IS NOT NULL 
       OR UPPER(COALESCE(u.assigned_doctor_id, '')) = UPPER(COALESCE($3, ''))
       OR u.assigned_doctor_id = $2::text
       OR EXISTS (SELECT 1 FROM messages m WHERE (m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $2 AND m.receiver_id = $1))
     )`,
    [patientUser.id, doctorUser.id, doctorUser.doctorId || 'D000001']
  );

  if (relCheck.rows.length === 0) {
    return {
      authorized: false,
      reason: 'You are not authorized to communicate with this user. An appointment booking or active doctor assignment is required.'
    };
  }

  const docCode = doctorUser.doctorId || doctorUser.id;
  const patCode = patientUser.patientId || patientUser.id;
  const conversationId = `conversation-${docCode}-${patCode}`;

  return {
    authorized: true,
    doctorUser,
    patientUser,
    currentUserId: user1.id,
    otherUserId: user2.id,
    conversationId
  };
};

/**
 * GET /api/messages/conversations
 * Get list of available conversation partners with latest message and unread counts.
 * For doctors: strictly authorized registered patients.
 * For patients: strictly authorized registered doctors.
 */
const getConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const isDoctor = (req.user.role || '').toLowerCase() === 'doctor';

    let partnersQuery;
    if (isDoctor) {
      partnersQuery = `
        SELECT DISTINCT u.id, u.name, u.email, u.role, u.patient_id as "patientId", 
                        u.gender, u.age, u.phone, u.photo_url as "photoUrl",
                        COALESCE(dp.status, 'active') as "relationshipStatus", 
                        COALESCE(dp.added_at, u.created_at) as "relationshipSince"
        FROM users u
        LEFT JOIN doctor_patients dp ON dp.patient_id = u.id AND dp.doctor_id = $1
        LEFT JOIN appointments a ON a.patient_id = u.id AND a.doctor_id = $1
        WHERE u.role = 'patient'
          AND (
            (dp.doctor_id = $1 AND (dp.status IS NULL OR dp.status = 'active'))
            OR a.doctor_id = $1
            OR UPPER(COALESCE(u.assigned_doctor_id, '')) = UPPER(COALESCE((SELECT doctor_id FROM users WHERE id = $1), ''))
            OR u.assigned_doctor_id = $1::text
            OR EXISTS (SELECT 1 FROM messages m WHERE (m.sender_id = $1 AND m.receiver_id = u.id) OR (m.sender_id = u.id AND m.receiver_id = $1))
          )
        ORDER BY u.name ASC
      `;
    } else {
      partnersQuery = `
        SELECT DISTINCT u.id, u.name, u.email, u.role, u.doctor_id as "doctorId", 
                        u.specialization, u.hospital_name as "hospitalName", u.phone, u.photo_url as "photoUrl",
                        COALESCE(dp.status, 'active') as "relationshipStatus", 
                        COALESCE(dp.added_at, u.created_at) as "relationshipSince"
        FROM users u
        LEFT JOIN doctor_patients dp ON dp.doctor_id = u.id AND dp.patient_id = $1
        LEFT JOIN appointments a ON a.doctor_id = u.id AND a.patient_id = $1
        WHERE u.role = 'doctor'
          AND (
            (dp.patient_id = $1 AND (dp.status IS NULL OR dp.status = 'active'))
            OR a.patient_id = $1
            OR UPPER(COALESCE((SELECT assigned_doctor_id FROM users WHERE id = $1), '')) = UPPER(COALESCE(u.doctor_id, ''))
            OR (SELECT assigned_doctor_id FROM users WHERE id = $1) = u.id::text
            OR EXISTS (SELECT 1 FROM messages m WHERE (m.sender_id = $1 AND m.receiver_id = u.id) OR (m.sender_id = u.id AND m.receiver_id = $1))
          )
        ORDER BY u.name ASC
      `;
    }

    const partnersRes = await query(partnersQuery, [currentUserId]);
    const conversations = [];

    for (const partner of partnersRes.rows) {
      const docCode = isDoctor ? (req.user.doctorId || currentUserId) : (partner.doctorId || partner.id);
      const patCode = isDoctor ? (partner.patientId || partner.id) : (req.user.patientId || currentUserId);
      const convId = `conversation-${docCode}-${patCode}`;

      // Get latest message between current user and partner
      const latestMsgRes = await query(
        `SELECT id, message, sender_id as "senderId", receiver_id as "receiverId", is_read as "isRead", created_at as "createdAt"
         FROM messages
         WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
         ORDER BY created_at DESC
         LIMIT 1`,
        [currentUserId, partner.id]
      );

      // Get unread count from this partner
      const unreadRes = await query(
        `SELECT COUNT(*)::int as count
         FROM messages
         WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
        [partner.id, currentUserId]
      );

      conversations.push({
        id: convId,
        conversationId: convId,
        partner,
        latestMessage: latestMsgRes.rows[0] || null,
        unreadCount: unreadRes.rows[0]?.count || 0,
        lastActivity: latestMsgRes.rows[0]?.createdAt || partner.relationshipSince || new Date().toISOString()
      });
    }

    // Sort: conversations with messages first by latest message time, then alphabetically
    conversations.sort((a, b) => {
      if (a.latestMessage && !b.latestMessage) return -1;
      if (!a.latestMessage && b.latestMessage) return 1;
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });

    return res.status(200).json({ conversations });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/messages/:otherUserId
 * Get message thread with a specific doctor/patient
 */
const getMessageThread = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { otherUserId } = req.params;

    if (!otherUserId) {
      return res.status(400).json({ error: { message: 'Recipient user ID is required.' } });
    }

    // Check relationship authorization
    const authCheck = await verifyDoctorPatientRelationship(currentUserId, otherUserId);
    if (!authCheck.authorized) {
      return res.status(403).json({
        error: { message: authCheck.reason || 'Access denied. You can only communicate with authorized registered users.' }
      });
    }

    const partner = authCheck.otherUserId === authCheck.doctorUser.id ? authCheck.doctorUser : authCheck.patientUser;

    // Mark received unread messages as read
    await query(
      `UPDATE messages
       SET is_read = true
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
      [authCheck.otherUserId, authCheck.currentUserId]
    );

    // Fetch message history
    const messagesRes = await query(
      `SELECT m.id, m.sender_id as "senderId", m.receiver_id as "receiverId", m.appointment_id as "appointmentId", 
              m.message, m.is_read as "isRead", m.created_at as "createdAt",
              (CASE WHEN m.sender_id = $1 THEN 'current' ELSE 'partner' END) as "origin",
              su.role as "senderRole", ru.role as "receiverRole"
       FROM messages m
       JOIN users su ON m.sender_id = su.id
       JOIN users ru ON m.receiver_id = ru.id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC`,
      [authCheck.currentUserId, authCheck.otherUserId]
    );

    const formattedMessages = messagesRes.rows.map(m => ({
      ...m,
      conversationId: authCheck.conversationId
    }));

    return res.status(200).json({
      conversationId: authCheck.conversationId,
      partner,
      messages: formattedMessages
    });
  } catch (err) {
    next(err);
  }
};



/**
 * POST /api/messages/:otherUserId
 * Send a message to authorized doctor or patient
 */
const sendMessage = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const { otherUserId } = req.params;
    const { message, appointmentId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: { message: 'Please enter a message.' } });
    }

    // Check relationship authorization
    const authCheck = await verifyDoctorPatientRelationship(senderId, otherUserId);
    if (!authCheck.authorized) {
      return res.status(403).json({
        error: { message: authCheck.reason || 'Access denied. Cannot send message to an unauthorized user.' }
      });
    }

    const partner = authCheck.patientUser.id === authCheck.currentUserId ? authCheck.doctorUser : authCheck.patientUser;

    // Insert message into database
    const insertRes = await query(
      `INSERT INTO messages (sender_id, receiver_id, appointment_id, message, is_read)
       VALUES ($1, $2, $3, $4, false)
       RETURNING id, sender_id as "senderId", receiver_id as "receiverId", appointment_id as "appointmentId", 
                 message, is_read as "isRead", created_at as "createdAt"`,
      [authCheck.currentUserId, authCheck.otherUserId, appointmentId || null, message.trim()]
    );

    const savedMessage = insertRes.rows[0];
    const senderRole = req.user.role || (authCheck.currentUserId === authCheck.doctorUser.id ? 'doctor' : 'patient');
    const receiverRole = partner.role || (senderRole === 'doctor' ? 'patient' : 'doctor');

    const formattedMessage = {
      ...savedMessage,
      conversationId: authCheck.conversationId,
      senderRole,
      receiverRole
    };

    // Send notification to recipient
    const senderName = req.user.name || (senderRole === 'doctor' ? `Dr. ${authCheck.doctorUser.name}` : authCheck.patientUser.name);
    await createNotification({
      userId: authCheck.otherUserId,
      title: `New message from ${senderName}`,
      message: message.trim().length > 60 ? `${message.trim().slice(0, 60)}...` : message.trim(),
      type: 'message',
      link: '/messages'
    });

    // Send generic Telegram notification to patient when doctor sends a message
    if (senderRole === 'doctor' && receiverRole === 'patient') {
      const doctorDisplayName = senderName.startsWith('Dr.') ? senderName : `Dr. ${senderName}`;
      dispatchTelegramNotification({
        userId: authCheck.otherUserId,
        category: 'message',
        title: 'New Consultation Message',
        text: `Hello,\n\n<b>${doctorDisplayName}</b> has sent you a new message regarding your consultation.\n\nPlease log in to MedAssist AI to view and reply.\n\n<i>(For patient confidentiality, message contents are protected and not transmitted over Telegram).</i>`,
        link: '/messages',
        buttonText: 'Open Messages',
        referenceId: `msg-${savedMessage.id}`,
        deduplicateHours: 1
      }).catch((tgErr) => console.warn('[Telegram Message Alert]', tgErr.message));
    }

    return res.status(201).json({
      message: 'Message sent successfully',
      data: formattedMessage
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/messages/read/:otherUserId
 * Explicitly mark all messages from other user as read
 */
const markThreadRead = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { otherUserId } = req.params;

    const partnerUser = await resolveUserRecord(otherUserId);
    if (!partnerUser) {
      return res.status(404).json({ error: { message: 'Recipient user not found.' } });
    }

    await query(
      `UPDATE messages
       SET is_read = true
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
      [partnerUser.id, currentUserId]
    );

    return res.status(200).json({ message: 'Messages marked as read' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getConversations,
  getMessageThread,
  sendMessage,
  markThreadRead,
  verifyDoctorPatientRelationship
};
