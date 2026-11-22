const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

/**
 * Authentication Middleware for protected routes
 * Verifies JWT token provided in Authorization header (Bearer <token>)
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      error: {
        message: 'Access denied. No authentication token provided.'
      }
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_12345';
    const decoded = jwt.verify(token, secret);

    // Verify user actually exists in the active database
    const userRes = await query(
      `SELECT id, role, patient_id as "patientId", doctor_id as "doctorId", email FROM users WHERE id = $1`,
      [decoded.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        error: {
          message: 'User session invalid. Account not found in active database. Please log in again.'
        }
      });
    }

    req.user = {
      ...decoded,
      id: userRes.rows[0].id,
      email: userRes.rows[0].email,
      role: (userRes.rows[0].role || decoded.role || 'patient').toString().toLowerCase(),
      patientId: userRes.rows[0].patientId || decoded.patientId,
      doctorId: userRes.rows[0].doctorId || decoded.doctorId
    };

    next();
  } catch (err) {
    return res.status(401).json({
      error: {
        message: 'Invalid or expired authentication token.'
      }
    });
  }
};

module.exports = authenticateToken;
