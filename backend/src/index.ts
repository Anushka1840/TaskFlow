import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import { apiLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ──────────────────────────────────────────────────────

// Helmet sets secure HTTP headers (prevents clickjacking, sniffing, XSS, etc.)
app.use(helmet());

// CORS — only allow requests from the frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// ─── Logging ──────────────────────────────────────────────────────────────────

// Morgan logs every request: "GET /tasks 200 12ms"
app.use(morgan('dev'));

// ─── Body Parsing ─────────────────────────────────────────────────────────────

app.use(express.json());

// ─── Global Rate Limiting ─────────────────────────────────────────────────────

app.use(apiLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    data: { status: 'ok', timestamp: new Date().toISOString(), environment: process.env.NODE_ENV || 'development' },
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔒 Security: Helmet + Rate Limiting enabled`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
