function notFound(req, res) {
  res.status(404).json({ error: `Route introuvable : ${req.method} ${req.path}` });
}

function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    console.error('[ERROR]', {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status,
      message: err.message,
    });
  }

  if (process.env.NODE_ENV === 'production' && status >= 500) {
    return res.status(500).json({ error: 'Erreur interne' });
  }

  res.status(status).json({ error: err.message });
}

module.exports = { notFound, errorHandler };
