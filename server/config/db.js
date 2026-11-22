const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool, types } = require('pg');

// Prevent pg from converting DATE strings to JS Date objects with timezone offsets
types.setTypeParser(1082, (val) => val);

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let schemaInitialized = false;
let initPromise = null;

const initSchema = async () => {
  if (schemaInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'patient';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS patient_id VARCHAR(50) UNIQUE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS doctor_id VARCHAR(50) UNIQUE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_doctor_id VARCHAR(50);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS smoking_habit VARCHAR(50);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_level VARCHAR(50);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS dietary_preference VARCHAR(50);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS allergies JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS existing_conditions JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS hospital_name VARCHAR(255) DEFAULT 'Apex Super Specialty Hospital';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS specialization VARCHAR(255) DEFAULT 'General Physician';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS qualification VARCHAR(255) DEFAULT 'MBBS, MD';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS medical_license VARCHAR(100) DEFAULT 'MCI-84920';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS clinic_address TEXT DEFAULT 'MediAssist Health Center, Suite 302, Medical City';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC(10, 2) DEFAULT 500.00;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 8;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT 'Experienced healthcare specialist dedicated to evidence-based medical consulting and personalized patient care.';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS consultation_type VARCHAR(50) DEFAULT 'Both';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '["09:00 AM", "10:30 AM", "11:45 AM", "02:00 PM", "03:30 PM", "05:00 PM"]'::jsonb;
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_gender_check;

        -- Create new tables if not exists
        CREATE TABLE IF NOT EXISTS doctor_patients (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
            reason TEXT,
            added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_doctor_patient UNIQUE (doctor_id, patient_id)
        );

        CREATE TABLE IF NOT EXISTS appointments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            appointment_number VARCHAR(50) UNIQUE,
            doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            appointment_date DATE NOT NULL,
            appointment_time VARCHAR(50) NOT NULL,
            appointment_type VARCHAR(20) NOT NULL CHECK (appointment_type IN ('online', 'offline')),
            reason TEXT,
            fee NUMERIC(10, 2) DEFAULT 500.00,
            payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'successful', 'failed', 'refunded')),
            appointment_status VARCHAR(20) DEFAULT 'confirmed' CHECK (appointment_status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
            meeting_status VARCHAR(20) DEFAULT 'not_started' CHECK (meeting_status IN ('not_started', 'in_progress', 'ended')),
            meeting_started_at TIMESTAMP WITH TIME ZONE,
            meeting_ended_at TIMESTAMP WITH TIME ZONE,
            meeting_duration_seconds INT DEFAULT 0,
            started_by_doctor_id VARCHAR(100),
            consultation_notes JSONB DEFAULT '{}'::jsonb,
            meeting_link TEXT,
            clinic_address TEXT,
            doctor_notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Safe column migrations for existing appointments table
        ALTER TABLE appointments ADD COLUMN IF NOT EXISTS meeting_status VARCHAR(20) DEFAULT 'not_started';
        ALTER TABLE appointments ADD COLUMN IF NOT EXISTS meeting_started_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE appointments ADD COLUMN IF NOT EXISTS meeting_ended_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE appointments ADD COLUMN IF NOT EXISTS meeting_duration_seconds INT DEFAULT 0;
        ALTER TABLE appointments ADD COLUMN IF NOT EXISTS started_by_doctor_id VARCHAR(100);
        ALTER TABLE appointments ADD COLUMN IF NOT EXISTS consultation_notes JSONB DEFAULT '{}'::jsonb;
        ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_appointment_status_check;
        ALTER TABLE appointments ADD CONSTRAINT appointments_appointment_status_check CHECK (appointment_status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'));

        CREATE TABLE IF NOT EXISTS payments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
            patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            amount NUMERIC(10, 2) NOT NULL,
            payment_provider VARCHAR(50) DEFAULT 'razorpay',
            payment_reference VARCHAR(100) NOT NULL,
            payment_status VARCHAR(20) DEFAULT 'successful' CHECK (payment_status IN ('pending', 'successful', 'failed', 'refunded')),
            payment_method VARCHAR(50) DEFAULT 'card',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS messages (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS prescriptions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            prescription_number VARCHAR(50) UNIQUE,
            doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
            file_name VARCHAR(255) NOT NULL,
            file_path TEXT NOT NULL,
            file_size INT,
            diagnosis TEXT,
            instructions TEXT,
            medications JSONB DEFAULT '[]'::jsonb,
            uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info',
            link TEXT,
            is_read BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS patient_telegram_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            telegram_chat_id BIGINT UNIQUE,
            telegram_username VARCHAR(255),
            telegram_first_name VARCHAR(255),
            is_connected BOOLEAN DEFAULT false,
            connected_at TIMESTAMP WITH TIME ZONE,
            notify_medicines BOOLEAN DEFAULT true,
            notify_appointments BOOLEAN DEFAULT true,
            notify_reports BOOLEAN DEFAULT true,
            notify_messages BOOLEAN DEFAULT true,
            notify_diet BOOLEAN DEFAULT true,
            timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_user_telegram UNIQUE (user_id)
        );

        CREATE TABLE IF NOT EXISTS telegram_link_tokens (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token VARCHAR(64) UNIQUE NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            is_used BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS telegram_notification_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            chat_id BIGINT NOT NULL,
            category VARCHAR(50) NOT NULL,
            reference_id VARCHAR(100),
            title VARCHAR(255),
            message TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'sent',
            telegram_message_id BIGINT,
            error_message TEXT,
            sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_pts_chat_id ON patient_telegram_settings(telegram_chat_id);
        CREATE INDEX IF NOT EXISTS idx_pts_user_id ON patient_telegram_settings(user_id);
        CREATE INDEX IF NOT EXISTS idx_telegram_tokens_token ON telegram_link_tokens(token);
        CREATE INDEX IF NOT EXISTS idx_telegram_tokens_user ON telegram_link_tokens(user_id);
        CREATE INDEX IF NOT EXISTS idx_telegram_logs_user ON telegram_notification_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_telegram_logs_dedup ON telegram_notification_logs(user_id, category, reference_id);
      `);
      schemaInitialized = true;
      console.log('[PostgreSQL] Database migrations verified');
    } catch (err) {
      console.error('[PostgreSQL] Migration check note:', err.message);
    }
  })();
  return initPromise;
};

// Execute schema check once safely on startup
initSchema();

pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected error on idle client', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  initSchema
};

