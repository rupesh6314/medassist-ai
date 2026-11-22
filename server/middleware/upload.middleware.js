const multer = require('multer');
const path = require('path');

// Memory storage: files are processed strictly in RAM and never saved to persistent disk
const storage = multer.memoryStorage();

// Validate magic bytes for PDF, PNG, JPEG
const validateMagicBytes = (buffer) => {
  if (!buffer || buffer.length < 4) return null;

  // PDF: %PDF- (0x25 0x50 0x44 0x46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'application/pdf';
  }

  // PNG: \x89PNG\r\n\x1a\n (0x89 0x50 0x4E 0x47)
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }

  // JPEG: \xFF\xD8\xFF (0xFF 0xD8 0xFF)
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }

  return null;
};

// Sanitize filename to prevent directory traversal or control characters
const sanitizeFilename = (filename) => {
  if (!filename) return 'report.pdf';
  const basename = path.basename(filename);
  return basename.replace(/[^a-zA-Z0-9._-]/g, '_');
};

const fileFilter = (req, file, cb) => {
  const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExts.includes(ext)) {
    return cb(new Error('Invalid file type. Only PDF documents and image files (.pdf, .png, .jpg, .jpeg) are accepted.'), false);
  }

  // Sanitize originalname directly on file object
  file.originalname = sanitizeFilename(file.originalname);
  cb(null, true);
};

// Multer Upload Instance for Reports (10MB max limit, in-memory)
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});

const prescriptionFileFilter = (req, file, cb) => {
  const allowedExts = ['.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExts.includes(ext)) {
    return cb(new Error('Invalid file type. Only PDF documents are accepted for prescriptions.'), false);
  }

  file.originalname = sanitizeFilename(file.originalname);
  cb(null, true);
};

// Multer Upload Instance for Prescriptions (15MB max limit, in-memory)
const uploadPrescription = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: prescriptionFileFilter
});

module.exports = upload;
module.exports.upload = upload;
module.exports.uploadPrescription = uploadPrescription;
module.exports.validateMagicBytes = validateMagicBytes;
module.exports.sanitizeFilename = sanitizeFilename;
