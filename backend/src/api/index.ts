import { Router } from 'express';
import authRouter from './auth';
import habitsRouter from './habits';
import logsRouter from './logs';
import statsRouter from './stats';

const router = Router();

router.use('/auth', authRouter);
router.use('/habits', habitsRouter);
router.use('/logs', logsRouter);
router.use('/stats', statsRouter);

export default router;
