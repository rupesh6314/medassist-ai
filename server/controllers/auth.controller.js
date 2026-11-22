const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { sendMail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_12345';
const TOKEN_EXPIRY = '7d';

/**
 * Helper to generate sequential Patient ID (P000001) or Doctor ID (D000001)
 */
const generateUniqueUserCode = async (role) => {
  const prefix = role === 'doctor' ? 'D' : 'P';
  const column = role === 'doctor' ? 'doctor_id' : 'patient_id';

  const result = await query(
    `SELECT ${column} FROM users WHERE ${column} ~ $1`,
    [`^${prefix}[0-9]+$`]
  );

  let maxNum = 0;
  for (const row of result.rows) {
    const val = row[column];
    if (val) {
      const num = parseInt(val.slice(1), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  let nextNum = maxNum + 1;
  let code = `${prefix}${String(nextNum).padStart(6, '0')}`;

  let exists = await query(`SELECT 1 FROM users WHERE ${column} = $1`, [code]);
  while (exists.rows.length > 0) {
    nextNum++;
    code = `${prefix}${String(nextNum).padStart(6, '0')}`;
    exists = await query(`SELECT 1 FROM users WHERE ${column} = $1`, [code]);
  }

  return code;
};

/**
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      bloodGroup
    } = req.body;

    const rawAge = req.body.age;
    const rawGender = req.body.gender;
    const rawHeight = req.body.heightCm ?? req.body.height_cm;
    const rawWeight = req.body.weightKg ?? req.body.weight_kg;
    const rawSmoking = req.body.smokingHabit ?? req.body.smoking_habit;
    const rawActivity = req.body.activityLevel ?? req.body.activity_level;
    const rawDietary = req.body.dietaryPreference ?? req.body.dietary_preference;
    const rawAllergies = req.body.allergies;
    const rawConditions = req.body.existingConditions ?? req.body.existing_conditions;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: { message: 'Name, email, and password are required fields.' }
      });
    }

    // Age validation
    let parsedAge = null;
    if (rawAge !== undefined && rawAge !== null && rawAge !== '') {
      const numAge = Number(rawAge);
      if (isNaN(numAge) || numAge < 1 || numAge > 120) {
        return res.status(400).json({
          error: { message: 'Please enter a realistic age between 1 and 120 years.' }
        });
      }
      parsedAge = Math.round(numAge);
    }

    // Height validation
    let parsedHeight = null;
    if (rawHeight !== undefined && rawHeight !== null && rawHeight !== '') {
      const numHeight = Number(rawHeight);
      if (isNaN(numHeight) || numHeight < 30 || numHeight > 300) {
        return res.status(400).json({
          error: { message: 'Please enter a valid height in cm (between 30 and 300 cm).' }
        });
      }
      parsedHeight = Number(numHeight.toFixed(2));
    }

    // Weight validation
    let parsedWeight = null;
    if (rawWeight !== undefined && rawWeight !== null && rawWeight !== '') {
      const numWeight = Number(rawWeight);
      if (isNaN(numWeight) || numWeight < 1 || numWeight > 500) {
        return res.status(400).json({
          error: { message: 'Please enter a valid weight in kg (between 1 and 500 kg).' }
        });
      }
      parsedWeight = Number(numWeight.toFixed(2));
    }

    // Gender validation & normalization
    let parsedGender = null;
    if (rawGender) {
      const gStr = String(rawGender).trim();
      const validGenders = ['Male', 'Female', 'Other', 'Prefer not to say'];
      const matched = validGenders.find(g => g.toLowerCase() === gStr.toLowerCase());
      parsedGender = matched || gStr;
    }

    // Smoking habit validation & normalization
    let parsedSmoking = null;
    if (rawSmoking) {
      const sStr = String(rawSmoking).trim();
      const validSmoking = ['Never', 'Former smoker', 'Current smoker', 'Prefer not to say'];
      const matched = validSmoking.find(s => s.toLowerCase() === sStr.toLowerCase());
      parsedSmoking = matched || sStr;
    }

    // Activity level validation & normalization
    let parsedActivity = null;
    if (rawActivity) {
      const aStr = String(rawActivity).trim();
      const validActivities = ['Sedentary', 'Lightly active', 'Moderately active', 'Very active'];
      const matched = validActivities.find(a => a.toLowerCase() === aStr.toLowerCase());
      parsedActivity = matched || aStr;
    }

    // Dietary preference normalization
    let parsedDietary = null;
    if (rawDietary) {
      const dStr = String(rawDietary).trim();
      const validDiets = ['Vegetarian', 'Eggetarian', 'Non-Vegetarian', 'Other'];
      const matched = validDiets.find(d => d.toLowerCase() === dStr.toLowerCase());
      parsedDietary = matched || dStr;
    }

    // Allergies & conditions formatting
    const parsedAllergies = Array.isArray(rawAllergies)
      ? rawAllergies.map(a => String(a).trim()).filter(Boolean)
      : rawAllergies ? [String(rawAllergies).trim()] : [];

    const parsedConditions = Array.isArray(rawConditions)
      ? rawConditions.map(c => String(c).trim()).filter(Boolean)
      : rawConditions ? [String(rawConditions).trim()] : [];

    const cleanRole = (role || 'patient').toString().toLowerCase().trim() === 'doctor' ? 'doctor' : 'patient';

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: { message: 'A user with this email address already exists.' }
      });
    }

    // Generate unique Patient or Doctor ID
    const generatedIdCode = await generateUniqueUserCode(cleanRole);
    const patientId = cleanRole === 'patient' ? generatedIdCode : null;
    const doctorId = cleanRole === 'doctor' ? generatedIdCode : null;

    // Determine assigned_doctor_id for patient
    let assignedDoctorId = null;
    if (cleanRole === 'patient') {
      if (req.body.assignedDoctorId) {
        assignedDoctorId = req.body.assignedDoctorId.toString().trim();
      } else {
        const firstDoc = await query(`SELECT doctor_id FROM users WHERE role = 'doctor' AND doctor_id IS NOT NULL ORDER BY created_at ASC LIMIT 1`);
        assignedDoctorId = firstDoc.rows.length > 0 ? firstDoc.rows[0].doctor_id : 'D000001';
      }
    }

    // Doctor-specific fields
    const hospitalName = req.body.hospitalName ?? req.body.hospital_name ?? (cleanRole === 'doctor' ? 'Medical Center' : null);
    const specialization = req.body.specialization ?? (cleanRole === 'doctor' ? 'General Physician' : null);
    const rawExperience = req.body.experienceYears ?? req.body.experience_years;
    const experienceYears = rawExperience !== undefined && rawExperience !== null && rawExperience !== '' ? Number(rawExperience) : (cleanRole === 'doctor' ? 0 : null);
    const qualification = req.body.qualification ?? (cleanRole === 'doctor' ? 'MBBS' : null);
    const medicalLicense = req.body.medicalLicense ?? req.body.medical_license ?? null;
    const rawFee = req.body.consultationFee ?? req.body.consultation_fee;
    const consultationFee = rawFee !== undefined && rawFee !== null && rawFee !== '' ? Number(rawFee) : (cleanRole === 'doctor' ? 500 : null);
    const clinicAddress = req.body.clinicAddress ?? req.body.clinic_address ?? (cleanRole === 'doctor' ? 'Healthcare Center' : null);
    const bio = req.body.bio ?? (cleanRole === 'doctor' ? 'Medical practitioner.' : null);
    const consultationType = req.body.consultationType ?? req.body.consultation_type ?? (cleanRole === 'doctor' ? 'Both' : null);
    const availability = req.body.availability ? JSON.stringify(req.body.availability) : (cleanRole === 'doctor' ? JSON.stringify(["09:00 AM", "10:30 AM", "11:45 AM", "02:00 PM", "03:30 PM", "05:00 PM"]) : null);

    // Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into database
    const newUserResult = await query(
      `INSERT INTO users 
       (name, email, password_hash, role, patient_id, doctor_id, assigned_doctor_id, phone, age, gender, blood_group, height_cm, weight_kg, smoking_habit, activity_level, dietary_preference, allergies, existing_conditions, hospital_name, specialization, experience_years, qualification, medical_license, consultation_fee, clinic_address, bio, consultation_type, availability)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28::jsonb)
       RETURNING id, name, email, role, patient_id as "patientId", doctor_id as "doctorId", assigned_doctor_id as "assignedDoctorId", 
                 phone, age, gender, blood_group as "bloodGroup", height_cm as "heightCm", weight_kg as "weightKg", 
                 smoking_habit as "smokingHabit", activity_level as "activityLevel", dietary_preference as "dietaryPreference", 
                 allergies, existing_conditions as "existingConditions", photo_url as "photoUrl",
                 hospital_name as "hospitalName", specialization, experience_years as "experienceYears",
                 qualification, medical_license as "medicalLicense", consultation_fee as "consultationFee",
                 clinic_address as "clinicAddress", bio, consultation_type as "consultationType", availability,
                 created_at as "createdAt"`,
      [
        name,
        email.toLowerCase().trim(),
        passwordHash,
        cleanRole,
        patientId,
        doctorId,
        assignedDoctorId,
        phone || null,
        parsedAge,
        parsedGender,
        bloodGroup || null,
        parsedHeight,
        parsedWeight,
        parsedSmoking,
        parsedActivity,
        parsedDietary,
        JSON.stringify(parsedAllergies),
        JSON.stringify(parsedConditions),
        hospitalName,
        specialization,
        experienceYears,
        qualification,
        medicalLicense,
        consultationFee,
        clinicAddress,
        bio,
        consultationType,
        availability
      ]
    );

    const user = newUserResult.rows[0];

    // Create default user settings
    await query(
      `INSERT INTO user_settings (user_id, theme, notifications_enabled, email_alerts, language)
       VALUES ($1, 'light', true, true, 'en')
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id]
    );

    // If patient entered dietary preferences or allergies, synchronize with diet_preferences table
    if (cleanRole === 'patient' && (parsedDietary || parsedActivity || parsedAllergies.length > 0)) {
      try {
        await query(
          `INSERT INTO diet_preferences (user_id, diet_type, activity_level, allergies)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id) DO UPDATE
           SET diet_type = COALESCE($2, diet_preferences.diet_type),
               activity_level = COALESCE($3, diet_preferences.activity_level),
               allergies = COALESCE($4, diet_preferences.allergies),
               updated_at = CURRENT_TIMESTAMP`,
          [
            user.id,
            parsedDietary || 'Vegetarian',
            parsedActivity || 'Moderately Active',
            JSON.stringify(parsedAllergies)
          ]
        );
      } catch (dietSyncErr) {
        console.warn('[Auth Register] Diet preferences sync warning:', dietSyncErr.message);
      }
    }

    // Sign JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, patientId: user.patientId, doctorId: user.doctorId },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    return res.status(201).json({
      message: 'Registration successful',
      user,
      token
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Login existing user
 */
const login = async (req, res, next) => {
  try {
    const rawIdentifier = (req.body.identifier || req.body.email || req.body.phone || req.body.mobile || '').toString().trim();
    const password = req.body.password;

    if (!rawIdentifier || !password) {
      return res.status(400).json({
        error: { message: 'Please enter your email or mobile number, and password.' }
      });
    }

    const cleanIdentifier = rawIdentifier.toLowerCase();
    const digitsOnly = rawIdentifier.replace(/[^0-9]/g, '');
    const last10Digits = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : (digitsOnly || 'NO_DIGITS');

    // Find user by email or mobile number only
    const userResult = await query(
      `SELECT id, name, email, password_hash, role, patient_id as "patientId", doctor_id as "doctorId", assigned_doctor_id as "assignedDoctorId", 
              phone, age, gender, blood_group as "bloodGroup", height_cm as "heightCm", weight_kg as "weightKg", 
              smoking_habit as "smokingHabit", activity_level as "activityLevel", dietary_preference as "dietaryPreference", 
              allergies, existing_conditions as "existingConditions", photo_url as "photoUrl",
              hospital_name as "hospitalName", specialization, experience_years as "experienceYears",
              qualification, medical_license as "medicalLicense", consultation_fee as "consultationFee",
              clinic_address as "clinicAddress", bio, consultation_type as "consultationType", availability
       FROM users 
       WHERE LOWER(email) = $1 
          OR (phone IS NOT NULL AND phone != '' AND (
                LOWER(phone) = $1 
                OR regexp_replace(phone, '[^0-9]', '', 'g') = $2
                OR RIGHT(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = $3
             ))
       LIMIT 1`,
      [cleanIdentifier, digitsOnly || 'NO_DIGITS', last10Digits]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: { message: 'Invalid credentials. No user found with this email or mobile number.' }
      });
    }

    const user = userResult.rows[0];

    // Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: { message: 'Invalid password. Please check your password and try again.' }
      });
    }

    // Remove password_hash from response object
    delete user.password_hash;

    // Ensure user has role and ID if created prior to role migration
    if (!user.role) user.role = 'patient';

    // Sign JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, patientId: user.patientId, doctorId: user.doctorId },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    return res.status(200).json({
      message: 'Login successful',
      user,
      token
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get profile of currently logged-in user
 */
const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userResult = await query(
      `SELECT id, name, email, role, patient_id as "patientId", doctor_id as "doctorId", assigned_doctor_id as "assignedDoctorId", 
              phone, age, gender, blood_group as "bloodGroup", height_cm as "heightCm", weight_kg as "weightKg", 
              smoking_habit as "smokingHabit", activity_level as "activityLevel", dietary_preference as "dietaryPreference", 
              allergies, existing_conditions as "existingConditions", photo_url as "photoUrl",
              hospital_name as "hospitalName", specialization, experience_years as "experienceYears",
              qualification, medical_license as "medicalLicense", consultation_fee as "consultationFee",
              clinic_address as "clinicAddress", bio, consultation_type as "consultationType", availability,
              created_at as "createdAt"
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'User not found.' }
      });
    }

    return res.status(200).json({
      user: userResult.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/forgot-password
 * Generates password reset token, saves expiry in DB, and sends reset link via Gmail SMTP
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: { message: 'Email address is required.' } });
    }

    const cleanEmail = email.toString().trim().toLowerCase();
    const userRes = await query('SELECT id, name, email FROM users WHERE LOWER(email) = $1', [cleanEmail]);

    // Constant-time response if user does not exist (prevents email enumeration)
    if (userRes.rows.length === 0) {
      return res.status(200).json({
        message: 'If an account exists with that email address, a password reset link has been sent.'
      });
    }

    const user = userRes.rows[0];

    // Generate secure random reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query(
      `UPDATE users 
       SET reset_password_token = $1, reset_password_expires = $2 
       WHERE id = $3`,
      [tokenHash, expiresAt, user.id]
    );

    const appUrl = (process.env.APP_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173')).replace(/\/+$/, '');
    if (!appUrl && process.env.NODE_ENV === 'production') {
      throw new Error('FATAL CONFIGURATION: APP_URL environment variable is required in production.');
    }
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    // Send formatted HTML password reset email
    await sendMail({
      to: user.email,
      subject: 'MeddiAssist AI — Password Reset Request',
      text: `Hello ${user.name || 'User'},\n\nYou requested a password reset for your MeddiAssist AI account.\n\nPlease click the following link to choose a new password:\n${resetUrl}\n\nThis link is valid for 1 hour. If you did not request this, you can safely ignore this email.`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
    .container { max-width: 560px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #0f766e, #0d9488); padding: 24px 30px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; }
    .content { padding: 30px; font-size: 14px; line-height: 1.6; }
    .btn { display: inline-block; background: #0f766e; color: #ffffff !important; text-decoration: none; padding: 12px 26px; font-weight: 600; font-size: 14px; border-radius: 8px; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 16px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MeddiAssist AI</h1>
    </div>
    <div class="content">
      <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">Password Reset Request</h2>
      <p>Hello <strong>${user.name || 'User'}</strong>,</p>
      <p>We received a request to reset the password for your MeddiAssist AI account associated with <strong>${user.email}</strong>.</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </div>
      <p style="color: #64748b; font-size: 13px;">Or copy and paste this URL into your browser:<br><a href="${resetUrl}" style="color: #0f766e; word-break: break-all;">${resetUrl}</a></p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 25px;">This password reset link will expire in <strong>60 minutes</strong>. If you did not make this request, please disregard this email — your password will remain unchanged.</p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} MeddiAssist AI Healthcare Platform. Confidential Security Notice.
    </div>
  </div>
</body>
</html>
      `
    });

    return res.status(200).json({
      message: 'If an account exists with that email address, a password reset link has been sent.'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password
 * Verifies reset token, validates expiration, and updates password hash
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, email, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: { message: 'Reset token and new password are required.' } });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: { message: 'Password must be at least 6 characters long.' } });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Query active unexpired token
    const userRes = await query(
      `SELECT id, email, name FROM users 
       WHERE reset_password_token = $1 AND reset_password_expires > NOW()`,
      [tokenHash]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({
        error: { message: 'Password reset link is invalid or has expired. Please request a new one.' }
      });
    }

    const user = userRes.rows[0];

    // Hash new password
    const newPasswordHash = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await query(
      `UPDATE users 
       SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL, updated_at = NOW() 
       WHERE id = $2`,
      [newPasswordHash, user.id]
    );

    // Send security confirmation email
    sendMail({
      to: user.email,
      subject: 'MeddiAssist AI — Password Successfully Changed',
      text: `Hello ${user.name || 'User'},\n\nYour MeddiAssist AI account password was successfully updated.\n\nIf you did not perform this change, please contact support immediately.`,
      html: `
        <p>Hello <strong>${user.name || 'User'}</strong>,</p>
        <p>Your MeddiAssist AI account password was successfully updated.</p>
        <p style="color: #64748b; font-size: 13px;">If you performed this action, you can safely disregard this email. If you did not change your password, please contact support immediately.</p>
      `
    }).catch(e => console.warn('[Reset Confirmation Email Warning]', e.message));

    return res.status(200).json({
      message: 'Password has been successfully reset. You may now log in with your new password.'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword
};
