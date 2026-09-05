const express = require('express');
const router = express.Router();
const { scanUrl, getHistory } = require('../controllers/scanController');
const { protect } = require('../middleware/authMiddleware');
const { scanLimiter } = require('../middleware/rateLimiter');

// For scanning, we allow optional protect so user can scan without login but history is only for logged in users
const optionalProtect = (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        return protect(req, res, next);
    }
    next();
};

router.post('/', scanLimiter, optionalProtect, scanUrl);
router.get('/history', protect, getHistory);

module.exports = router;
