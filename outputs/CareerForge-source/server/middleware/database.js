export function requireDatabase(req, res, next) {
  if (req.app.locals.databaseReady) return next();
  return res.status(503).json({
    success: false,
    error: 'Database unavailable',
    message: 'The API is running, but MongoDB is not connected. Configure MONGODB_URI and restart the server.'
  });
}
