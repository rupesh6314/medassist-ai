/**
 * Clinical Parameter Parsing & Normalization Utility
 * MedAssist AI — Deterministic Canonical Extraction, BP Parsing & Numerical Validation
 */

/**
 * Robust Canonical Parameter Normalization Map
 * Rules: Longer and more specific terms are evaluated first.
 */
const CANONICAL_PARAMETER_RULES = [
  // Fasting Blood Sugar vs Random vs Postprandial vs HbA1c
  { canonicalKey: 'glucose_fasting', standardName: 'Fasting Blood Sugar', regex: /\b(?:fasting\s*(?:blood\s*)?(?:sugar|glucose)|fbs|fpg|glucose\s*fasting|sugar\s*fasting)\b/i },
  { canonicalKey: 'glucose_postprandial', standardName: 'Postprandial Blood Sugar', regex: /\b(?:post\s*prandial\s*(?:blood\s*)?(?:sugar|glucose)|postprandial|ppbs|ppbg|2\s*hr\s*pp\s*glucose)\b/i },
  { canonicalKey: 'glucose_random', standardName: 'Random Blood Sugar', regex: /\b(?:random\s*(?:blood\s*)?(?:sugar|glucose)|rbs)\b/i },
  { canonicalKey: 'hba1c', standardName: 'HbA1c (Glycated Hemoglobin)', regex: /\b(?:hba1c|glycated\s*hemoglobin|glycosylated\s*hemoglobin|hemoglobin\s*a1c|a1c|glyco\s*hb)\b/i },
  
  // Blood Pressure & Vitals
  { canonicalKey: 'bp_systolic', standardName: 'Systolic Blood Pressure', regex: /\b(?:systolic(?:\s*(?:bp|blood\s*pressure))?|sys\s*bp|sbp)\b/i },
  { canonicalKey: 'bp_diastolic', standardName: 'Diastolic Blood Pressure', regex: /\b(?:diastolic(?:\s*(?:bp|blood\s*pressure))?|dia\s*bp|dbp)\b/i },
  { canonicalKey: 'blood_pressure', standardName: 'Blood Pressure', regex: /\b(?:blood\s*pressure|b\.?p\.?)\b/i },
  { canonicalKey: 'heart_rate', standardName: 'Heart Rate', regex: /\b(?:heart\s*rate|pulse(?:\s*rate)?|hr|pulse)\b/i },
  { canonicalKey: 'bmi', standardName: 'Body Mass Index (BMI)', regex: /\b(?:body\s*mass\s*index|bmi)\b/i },

  // Lipid Profile (Ensures HDL/LDL never match Total Cholesterol)
  { canonicalKey: 'cholesterol_hdl', standardName: 'HDL Cholesterol', regex: /\b(?:hdl(?:\s*cholesterol)?|high[\s-]density\s*lipoprotein)\b/i },
  { canonicalKey: 'cholesterol_ldl', standardName: 'LDL Cholesterol', regex: /\b(?:ldl(?:\s*cholesterol)?|low[\s-]density\s*lipoprotein)\b/i },
  { canonicalKey: 'cholesterol_vldl', standardName: 'VLDL Cholesterol', regex: /\b(?:vldl(?:\s*cholesterol)?|very\s*low[\s-]density\s*lipoprotein)\b/i },
  { canonicalKey: 'triglycerides', standardName: 'Triglycerides', regex: /\b(?:triglycerides|triglyceride|tg)\b/i },
  { canonicalKey: 'cholesterol_total', standardName: 'Total Cholesterol', regex: /\b(?:total\s*cholesterol|serum\s*cholesterol|cholesterol\s*total|cholesterol)\b/i },

  // Liver Function (LFT) - Ensures AST never matches Fasting, and Direct/Indirect Bilirubin are distinguished
  { canonicalKey: 'ast_sgot', standardName: 'AST (SGOT)', regex: /\b(?:aspartate\s*(?:amino)?transferase|aspartate\s*transaminase|ast\s*\/\s*sgot|sgot\s*\/\s*ast|sgot|ast)\b/i },
  { canonicalKey: 'alt_sgpt', standardName: 'ALT (SGPT)', regex: /\b(?:alanine\s*(?:amino)?transferase|alanine\s*transaminase|alt\s*\/\s*sgpt|sgpt\s*\/\s*alt|sgpt|alt)\b/i },
  { canonicalKey: 'bilirubin_direct', standardName: 'Direct Bilirubin', regex: /\b(?:direct\s*bilirubin|conjugated\s*bilirubin|bilirubin\s*direct)\b/i },
  { canonicalKey: 'bilirubin_indirect', standardName: 'Indirect Bilirubin', regex: /\b(?:indirect\s*bilirubin|unconjugated\s*bilirubin|bilirubin\s*indirect)\b/i },
  { canonicalKey: 'bilirubin_total', standardName: 'Total Bilirubin', regex: /\b(?:total\s*bilirubin|bilirubin\s*total|serum\s*bilirubin|bilirubin)\b/i },
  { canonicalKey: 'alp', standardName: 'Alkaline Phosphatase (ALP)', regex: /\b(?:alkaline\s*phosphatase|alk\s*phos|alp)\b/i },
  { canonicalKey: 'total_protein', standardName: 'Total Protein', regex: /\b(?:total\s*protein|serum\s*total\s*protein|protein\s*total)\b/i },
  { canonicalKey: 'albumin', standardName: 'Albumin', regex: /\b(?:serum\s*albumin|albumin)\b/i },
  { canonicalKey: 'ag_ratio', standardName: 'A/G Ratio', regex: /\b(?:a\s*\/\s*g\s*ratio|ag\s*ratio|albumin\s*globulin\s*ratio)\b/i },

  // Kidney Function (KFT / RFT) & Electrolytes
  { canonicalKey: 'serum_creatinine', standardName: 'Serum Creatinine', regex: /\b(?:serum\s*creatinine|creatinine|creat|s\.?\s*creatinine)\b/i },
  { canonicalKey: 'blood_urea', standardName: 'Blood Urea Nitrogen (BUN)', regex: /\b(?:blood\s*urea\s*nitrogen|blood\s*urea|urea|bun)\b/i },
  { canonicalKey: 'serum_sodium', standardName: 'Serum Sodium (Na+)', regex: /\b(?:serum\s*sodium|sodium|na\+)\b/i },
  { canonicalKey: 'serum_potassium', standardName: 'Serum Potassium (K+)', regex: /\b(?:serum\s*potassium|potassium|k\+)\b/i },
  { canonicalKey: 'serum_chloride', standardName: 'Serum Chloride (Cl-)', regex: /\b(?:serum\s*chloride|chloride|cl\-)\b/i },
  { canonicalKey: 'uric_acid', standardName: 'Uric Acid', regex: /\b(?:serum\s*uric\s*acid|uric\s*acid)\b/i },

  // Complete Blood Count (CBC) - Ensures HGB is distinct from HbA1c
  { canonicalKey: 'hemoglobin', standardName: 'Hemoglobin (HGB)', regex: /\b(?:hemoglobin|haemoglobin|hgb|hb)\b/i },
  { canonicalKey: 'rbc_count', standardName: 'Red Blood Cell Count (RBC)', regex: /\b(?:red\s*blood\s*(?:cell\s*)?count|total\s*rbc|rbc\s*count|rbc|erythrocytes)\b/i },
  { canonicalKey: 'wbc_count', standardName: 'White Blood Cell Count (WBC)', regex: /\b(?:white\s*blood\s*(?:cell\s*)?count|total\s*wbc|wbc\s*count|total\s*leucocyte\s*count|tlc|wbc)\b/i },
  { canonicalKey: 'platelet_count', standardName: 'Platelet Count (PLT)', regex: /\b(?:platelet\s*count|total\s*platelets|platelets|plt)\b/i },
  { canonicalKey: 'packed_cell_volume', standardName: 'Hematocrit / PCV', regex: /\b(?:packed\s*cell\s*volume|pcv|hematocrit|hct)\b/i },
  { canonicalKey: 'mcv', standardName: 'Mean Corpuscular Volume (MCV)', regex: /\b(?:mean\s*corpuscular\s*volume|mcv)\b/i },
  { canonicalKey: 'mch', standardName: 'Mean Corpuscular Hemoglobin (MCH)', regex: /\b(?:mean\s*corpuscular\s*hemoglobin|mch)\b/i },
  { canonicalKey: 'mchc', standardName: 'Mean Corpuscular Hemoglobin Conc. (MCHC)', regex: /\b(?:mean\s*corpuscular\s*hemoglobin\s*concentration|mchc)\b/i }
];

/**
 * Match a raw label to its canonical clinical identity.
 * Avoids any substring collisions (e.g., 'fasting' containing 'ast').
 */
function matchCanonicalParameter(rawLabel) {
  if (!rawLabel || typeof rawLabel !== 'string') return null;
  const cleaned = rawLabel.trim();
  if (cleaned.length < 2) return null;

  for (const rule of CANONICAL_PARAMETER_RULES) {
    if (rule.regex.test(cleaned)) {
      return {
        canonicalKey: rule.canonicalKey,
        standardName: rule.standardName
      };
    }
  }
  return null;
}

/**
 * Parse Blood Pressure string (e.g. "120/80", "120 / 80 mmHg", "BP: 120/80")
 */
function parseBloodPressure(valStr) {
  if (!valStr) return null;
  const str = String(valStr).trim();

  // Match "120/80" or "120 / 80" or "120-80"
  const match = str.match(/(?:bp\s*[:\.]?\s*)?(\d{2,3})\s*(?:[\/|\-])\s*(\d{2,3})(?:\s*mm\s*hg)?/i);
  if (match) {
    const systolic = parseInt(match[1], 10);
    const diastolic = parseInt(match[2], 10);

    // Physiological sanity check for BP
    if (systolic >= 50 && systolic <= 260 && diastolic >= 30 && diastolic <= 160) {
      return { systolic, diastolic };
    }
  }
  return null;
}

/**
 * Strict Clinical Value Parser
 * Parses numbers, operators (<150), blood pressure, and rejects invalid strings (producing null).
 */
function parseClinicalValue(val) {
  if (val === null || val === undefined) return { value: null, operator: null, rawValue: '' };

  const rawStr = String(val).trim();
  if (!rawStr || /^(?:--|n\/?a|nil|not\s*available|pending|null|undefined)$/i.test(rawStr)) {
    return { value: null, operator: null, rawValue: rawStr };
  }

  // Check Blood Pressure composite format first
  const bp = parseBloodPressure(rawStr);
  if (bp) {
    return {
      value: bp.systolic,
      systolic: bp.systolic,
      diastolic: bp.diastolic,
      isBloodPressure: true,
      operator: null,
      rawValue: rawStr
    };
  }

  // Check Comparison Operator (<150, <=5.0, >200, >=126)
  const opMatch = rawStr.match(/^(<=|>=|<|>|=)\s*([\d,]+(?:\.\d+)?)$/);
  if (opMatch) {
    const num = parseFloat(opMatch[2].replace(/,/g, ''));
    if (!isNaN(num)) {
      return {
        value: num,
        operator: opMatch[1],
        rawValue: rawStr
      };
    }
  }

  // Clean numeric string
  const cleanNumStr = rawStr.replace(/,/g, '');
  const numMatch = cleanNumStr.match(/^-?\d+(?:\.\d+)?$/);
  if (numMatch) {
    const num = parseFloat(numMatch[0]);
    if (!isNaN(num)) {
      return {
        value: num,
        operator: null,
        rawValue: rawStr
      };
    }
  }

  // If text or malformed string, do NOT return 0 - return null with rawValue preserved
  return {
    value: null,
    operator: null,
    rawValue: rawStr
  };
}

/**
 * Deterministic Report Date Parser
 * Handles DD/MM/YYYY, YYYY-MM-DD, and cleans trailing artifacts like "Ref By: ..."
 */
function parseReportDate(rawDateStr) {
  if (!rawDateStr) return new Date().toISOString().split('T')[0];

  let str = String(rawDateStr).trim();
  // Strip trailing noise like "Ref By: Dr..." or timestamps
  str = str.split(/(?:\s+(?:ref\s*by|dr\.|time|sample|reported)|[T\s]\d{1,2}:)/i)[0].trim();

  // Check DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    // Basic date validation
    if (parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12 && parseInt(day, 10) >= 1 && parseInt(day, 10) <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  // Check YYYY-MM-DD
  const yyyymmdd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (yyyymmdd) {
    const year = yyyymmdd[1];
    const month = yyyymmdd[2].padStart(2, '0');
    const day = yyyymmdd[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

module.exports = {
  CANONICAL_PARAMETER_RULES,
  matchCanonicalParameter,
  parseBloodPressure,
  parseClinicalValue,
  parseReportDate
};
