require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const rawOrigins = process.env.ALLOWED_ORIGINS || '';

if (isProduction && (!rawOrigins || rawOrigins.includes('*'))) {
  console.error('[FATAL SECURITY CONFIGURATION] In production, ALLOWED_ORIGINS must be explicitly set without wildcards (*).');
  process.exit(1);
}

const allowedOriginsList = rawOrigins
  ? rawOrigins.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000', 'http://127.0.0.1:5000'];

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const reportRoutes = require('./routes/report.routes');
const doctorRoutes = require('./routes/doctor.routes');
const dietRoutes = require('./routes/diet.routes');
const assistantRoutes = require('./routes/assistant.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const messageRoutes = require('./routes/message.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const notificationRoutes = require('./routes/notification.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable 'trust proxy' so express-rate-limit correctly handles Render reverse proxy headers
app.set('trust proxy', 1);

// Security Headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOriginsList.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api/', generalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again after 15 minutes.' }
});
app.use('/api/auth/', authLimiter);

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 uploads per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many file uploads, please try again after 15 minutes.' }
});
app.use('/api/reports/upload', uploadLimiter);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Routes
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'MedAssist AI Backend API',
    status: 'online',
    health: '/api/health',
    timestamp: new Date().toISOString()
  });
});
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/ai', assistantRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/notifications', notificationRoutes);


// 404 JSON Handler for API routes
app.use((req, res, next) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use(errorHandler);

const { startNotificationScheduler, stopNotificationScheduler } = require('./services/notificationScheduler');
const { startTelegramPolling, stopTelegramPolling } = require('./services/telegramBotRunner');
const { verifyEmailService } = require('./services/emailService');

// Start Server
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`[Express Service] Server is running on port ${PORT}`);
    // Verify email service & start automated notification schedulers
    try {
      verifyEmailService();
      startNotificationScheduler();
      startTelegramPolling();
    } catch (schedErr) {
      console.error('[Services Startup Error]', schedErr.message);
    }
  });

  const shutdown = () => {
    console.log('[Express Service] Shutting down services gracefully...');
    stopNotificationScheduler();
    stopTelegramPolling();
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = app;
