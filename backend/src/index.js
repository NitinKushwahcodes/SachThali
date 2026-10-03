// Server entry point executing environment validation and initializing Express listener.
// Validates presence of Gemini, Groq, database, and JWT secrets before binding port.
// Bootstraps application server on designated PORT environment variable.

import { validateEnv, env } from './config/env.js';
import app from './app.js';
import { logInfo } from './utils/logger.js';

// Validate environment variables on startup
validateEnv();

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  logInfo(`Sachthali backend server running on port ${PORT} in [${env.NODE_ENV}] mode`);
});
