import './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDatabase } from './config/db.js';
import { requireDatabase } from './middleware/database.js';
import { requireAuth } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import dashboardRoutes from './routes/dashboard.js';
import dsaRoutes from './routes/dsa.js';
import problemsRoutes from './routes/problems.js';
import revisionsRoutes from './routes/revisions.js';
import questsRoutes from './routes/quests.js';
import careerRoutes from './routes/career.js';
import learningRoutes from './routes/learning.js';
import aiRoutes from './routes/ai.js';
import adminRoutes from './routes/admin.js';
import productRoutes from './routes/product.js';

const app = express();
app.locals.databaseReady = false;
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 250, standardHeaders: true, legacyHeaders: false }));
app.get('/api/health', (_, res) => res.status(app.locals.databaseReady ? 200 : 503).json({
  success: app.locals.databaseReady,
  data: { status: app.locals.databaseReady ? 'ok' : 'degraded' },
  message: app.locals.databaseReady ? 'API and database are available.' : 'API is running, but MongoDB is unavailable.'
}));
app.use('/api/auth', requireDatabase, authRoutes);
app.use('/api/profile', requireDatabase, profileRoutes);
app.use('/api/dashboard', requireDatabase, dashboardRoutes);
app.use('/api/dsa', requireDatabase, requireAuth, dsaRoutes);
app.use('/api/problems', requireDatabase, requireAuth, problemsRoutes);
app.use('/api/revisions', requireDatabase, requireAuth, revisionsRoutes);
app.use('/api/quests', requireDatabase, requireAuth, questsRoutes);
app.use('/api/career', requireDatabase, requireAuth, careerRoutes);
app.use('/api/learning', requireDatabase, requireAuth, learningRoutes);
app.use('/api/ai', requireDatabase, requireAuth, aiRoutes);
app.use('/api/admin', requireDatabase, requireAuth, adminRoutes);
app.use('/api', requireDatabase, requireAuth, productRoutes);
app.use('/api', (_, res) => res.status(404).json({ success: false, error: 'Route not found', message: 'The requested API route does not exist.' }));
app.use((error, _, res, __) => {
  console.error(error);
  const malformedJson = error instanceof SyntaxError && 'body' in error;
  res.status(malformedJson ? 400 : 500).json({
    success: false,
    error: malformedJson ? 'Invalid JSON request body' : 'Internal server error',
    message: malformedJson ? 'The request body must contain valid JSON.' : 'Something went wrong while processing the request.'
  });
});

const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`CareerForge API listening on port ${port}`));
connectDatabase()
  .then(() => { app.locals.databaseReady = true; console.log('CareerForge database ready'); })
  .catch((error) => console.error(`MongoDB connection failed: ${error.message}`));
