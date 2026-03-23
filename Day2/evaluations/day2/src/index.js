require('dotenv').config();
const express = require('express');
const config = require('./config/env');
const authRoutes = require('./routes/auth');
const livresRoutes = require('./routes/livres');

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/livres', livresRoutes);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Erreur interne' });
});

app.listen(config.port, () => {
  console.log(`Serveur démarré sur http://localhost:${config.port}`);
});
