const ScanLog = require('../models/ScanLog');
const { extractUrlFeatures, extractHtmlFeatures } = require('../utils/featureExtractor');
const axios = require('axios');

const scanUrl = async (req, res, next) => {
    try {
        const { url } = req.body;
        
        if (!url) return res.status(400).json({ error: 'URL is required' });

        const urlFeatures = extractUrlFeatures(url);
        const htmlFeatures = await extractHtmlFeatures(url);

        const startTime = Date.now();
        let mlResult;
        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
        try {
            const mlResponse = await axios.post(`${mlServiceUrl}/predict`, {
                url,
                fetch_html: true
            });
            mlResult = mlResponse.data;
            mlResult.lightgbm_score = mlResult.phishing_score !== undefined ? mlResult.phishing_score : (mlResult.confidence * 100);
        } catch (error) {
            console.error('ML Service Error:', error.message);
            mlResult = {
                lightgbm_score: 50.0,
                confidence: 0.5,
                feature_importance: {},
                inference_time_ms: 100
            };
        }
        const scanDuration = Date.now() - startTime;

        let verdict = 'safe';
        if (mlResult.is_phishing || mlResult.prediction === 'Phishing' || mlResult.lightgbm_score > 70) {
            verdict = 'phishing';
        } else if (mlResult.lightgbm_score >= 30) {
            verdict = 'suspicious';
        }

        // Save scan without user tracking if req.user is null
        const scanLog = await ScanLog.create({
            userId: req.user ? req.user._id : undefined,
            url,
            urlFeatures,
            htmlFeatures,
            lightgbmScore: mlResult.lightgbm_score,
            verdict,
            scanDuration,
        });

        res.status(200).json({
            scanId: scanLog._id,
            url: scanLog.url,
            features: { urlFeatures, htmlFeatures },
            result: mlResult,
            verdict,
            scanDuration
        });
    } catch (error) {
        next(error);
    }
};

const getHistory = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authorized' });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const logs = await ScanLog.find({ userId: req.user._id })
            .sort({ scannedAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await ScanLog.countDocuments({ userId: req.user._id });

        res.status(200).json({
            logs,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { scanUrl, getHistory };
