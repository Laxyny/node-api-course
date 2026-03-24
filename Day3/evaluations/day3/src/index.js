require('dotenv').config();
const app = require('./app');
const config = require('./config/env');

app.listen(config.port, () => {
  console.log(`Serveur démarré sur http://localhost:${config.port} (${config.nodeEnv})`);
});
