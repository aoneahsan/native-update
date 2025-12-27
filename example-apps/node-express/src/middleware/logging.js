import { logger } from '../utils/logger.js';

/**
 * Request logging middleware
 */
export function requestLogger(req, res, next) {
  const start = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    res.send = originalSend;
    res.send(data);

    // Log response
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  };

  next();
}