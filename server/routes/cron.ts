import { Router, Request, Response } from 'express';
import { checkAndSendDueActivityAlerts } from '../services/alertChecker';

const router = Router();

// GET ou POST /api/cron/check-alerts (Appelé automatiquement par Vercel Cron ou tâche de fond)
const handleCheckAlerts = async (_req: Request, res: Response) => {
  try {
    const result = await checkAndSendDueActivityAlerts();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: (err as Error).message
    });
  }
};

router.get('/check-alerts', handleCheckAlerts);
router.post('/check-alerts', handleCheckAlerts);

export default router;
