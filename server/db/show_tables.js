require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { query } = require('../config/db');

async function showDatabaseSummary() {
  console.log('\n========================================================================');
  console.log('                  MEDASSIST AI — POSTGRESQL DATABASE SUMMARY');
  console.log('========================================================================\n');

  try {
    const dbInfo = await query("SELECT current_database() as db_name, version() as pg_version");
    console.log(`Database Name : ${dbInfo.rows[0].db_name}`);
    console.log(`PostgreSQL    : ${dbInfo.rows[0].pg_version.split(',')[0]}\n`);

    const tablesRes = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`Total Tables Found: ${tablesRes.rows.length}\n`);
    console.log(
      'No.'.padEnd(5) +
      'Table Name'.padEnd(32) +
      'Row Count'.padStart(12) +
      '   Description / Module'
    );
    console.log('-'.repeat(76));

    const descriptions = {
      users: 'User accounts (Patients & Doctors)',
      user_settings: 'Patient preferences & dark/light theme',
      medical_reports: 'Uploaded lab PDF reports & AI summaries',
      vital_readings: 'Extracted lab vitals with units & flags',
      disease_risks: 'Random Forest multi-organ risk scores',
      trend_metrics: 'Configured longitudinal health metrics',
      trend_points: 'Historical health trend data points',
      appointments: 'Doctor-patient appointment consultations',
      prescriptions: 'Digital prescriptions issued by doctors',
      doctor_patients: 'Doctor-patient clinical relationships',
      messages: 'Doctor-patient encrypted chat messages',
      chat_messages: 'AI Health Assistant chat history',
      patient_alerts: 'Abnormal vitals alerts sent to doctors',
      payments: 'Consultation fee transaction history',
      notifications: 'In-app notifications',
      patient_telegram_settings: 'Linked Telegram Chat ID & category preferences',
      telegram_link_tokens: 'Expiring single-use Telegram link tokens',
      telegram_notification_logs: 'Audit trail of delivered Telegram alerts',
      food_groups: 'IFCT Indian food group categories',
      foods: 'IFCT raw and cooked food dataset',
      nutrients: 'Macro and micronutrient definitions',
      food_nutrients: 'Nutritional values per 100g of food',
      food_names: 'Regional and common names of food items',
      diet_preferences: 'Patient dietary restrictions & goals',
      diet_plans: 'Personalized MILP optimized diet plans',
      meal_plans: 'Daily meal allocations (Breakfast, Lunch, etc.)',
      diet_targets: 'Calculated patient macro & calorie targets',
      food_items: 'Legacy food catalogue items'
    };

    let idx = 1;
    for (const r of tablesRes.rows) {
      const countRes = await query(`SELECT count(*) as c FROM "${r.table_name}"`);
      const count = countRes.rows[0].c;
      const desc = descriptions[r.table_name] || 'Application table';
      console.log(
        String(idx++).padEnd(5) +
        r.table_name.padEnd(32) +
        String(count).padStart(12) +
        `   ${desc}`
      );
    }

    console.log('\n========================================================================\n');
  } catch (err) {
    console.error('Error querying database:', err.message);
  } finally {
    process.exit(0);
  }
}

showDatabaseSummary();
