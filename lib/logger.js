export function logError(route, err, extra = {}) {
  console.error(JSON.stringify({
    level: 'error',
    route,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    ...extra,
  }));
}
