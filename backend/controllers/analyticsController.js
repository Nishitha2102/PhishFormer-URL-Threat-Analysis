const ScanLog = require('../models/ScanLog');

const getSummary = async (req, res, next) => {
    try {
        const totalScans = await ScanLog.countDocuments();
        const phishingCount = await ScanLog.countDocuments({ verdict: 'phishing' });
        const safeCount = await ScanLog.countDocuments({ verdict: 'safe' });
        const suspiciousCount = await ScanLog.countDocuments({ verdict: 'suspicious' });

        res.status(200).json({
            totalScans,
            verdicts: {
                safe: safeCount,
                suspicious: suspiciousCount,
                phishing: phishingCount
            },
            detectionRate: totalScans ? ((phishingCount / totalScans) * 100).toFixed(2) : 0
        });
    } catch (error) {
        next(error);
    }
};

const getTrend = async (req, res, next) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const trend = await ScanLog.aggregate([
            { $match: { scannedAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$scannedAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json(trend);
    } catch (error) {
        next(error);
    }
};

module.exports = { getSummary, getTrend };
