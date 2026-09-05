const rateLimit = require('express-rate-limit');

const scanLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 scan requests per `window` (here, per minute)
    message: { error: 'Too many scan requests from this IP, please try again after a minute', statusCode: 429 },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = { scanLimiter };
