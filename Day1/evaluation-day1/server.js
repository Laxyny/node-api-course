const http = require('http');
const { router } = require('./modules/router');

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  let statusCode = 500;

  try {
    statusCode = await router(req, res);
  } catch {
    statusCode = 500;
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Erreur interne' }));
  }

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} → ${statusCode}`);
});

server.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
