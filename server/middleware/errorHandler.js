/**
 * Global Error Handler Middleware for Express
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err.stack || err.message || err);

  // Handle Multer limits gracefully with 400 Bad Request
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: { message: 'File size limit exceeded. Uploaded file exceeds the maximum allowed limit (10MB for reports, 15MB for prescriptions).' }
    });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;
