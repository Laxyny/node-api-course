require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
};

if (!config.jwtSecret) {
  throw new Error("Variable d'environnement manquante : JWT_SECRET");
}

module.exports = config;
