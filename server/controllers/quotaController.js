import { logger } from 'firebase-functions';
import { getUserAnalysisCount } from '../services/firestoreService.js';
import { config } from '../config.js';

export const QuotaController = {
  async getQuota(req, res) {
    try {
      const used = await getUserAnalysisCount(req.userId);
      res.json({
        used,
        limit: config.analysisLimit,
        remaining: Math.max(0, config.analysisLimit - used),
      });
    } catch (error) {
      logger.error('Quota fetch failed', { error: error.message, userId: req.userId });
      res.status(500).json({ error: 'Failed to fetch quota' });
    }
  },
};
