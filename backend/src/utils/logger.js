// Utility logger for consistent application logging across backend services.
// Formats log output with timestamps, log levels, and contextual detail.
// Used by controllers, middleware, and AI services for debugging and operational visibility.

// Logs an informational message to stdout with timestamp formatting.
export function logInfo(message, data = null) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[INFO] [${timestamp}] ${message}`, data);
  } else {
    console.log(`[INFO] [${timestamp}] ${message}`);
  }
}

// Logs an error message to stderr with timestamp formatting.
export function logError(message, error = null) {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[ERROR] [${timestamp}] ${message}`, error);
  } else {
    console.error(`[ERROR] [${timestamp}] ${message}`);
  }
}
