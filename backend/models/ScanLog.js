const mongoose = require('mongoose');

const ScanLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    url: { type: String, required: true },
    urlFeatures: { type: Object },
    htmlFeatures: { type: Object },
    lightgbmScore: { type: Number },
    verdict: { type: String, enum: ['safe', 'suspicious', 'phishing'] },
    scanDuration: { type: Number },
    scannedAt: { type: Date, default: Date.now }
});

ScanLogSchema.index({ userId: 1, scannedAt: -1 });
ScanLogSchema.index({ verdict: 1 });

module.exports = mongoose.model('ScanLog', ScanLogSchema);
