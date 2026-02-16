import { logger } from 'firebase-functions';
import { getUserAnalysisCount } from '../services/firestoreService.js';

const ANALYSIS_LIMIT = 5;

export const QuotaController = {
  async getQuota(req, res) {
    try {
      const used = await getUserAnalysisCount(req.userId);
      res.json({
        used,
        limit: ANALYSIS_LIMIT,
        remaining: Math.max(0, ANALYSIS_LIMIT - used),
      });
    } catch (error) {
      logger.error('Quota fetch failed', { error: error.message, userId: req.userId });
      res.status(500).json({ error: 'Failed to fetch quota' });
    }
  },
};
