import { Router } from 'express';
import { register, login, refresh, logout, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply strict rate limiting to all auth routes (#9)
router.use(authLimiter);

router.post('/register', register);    // Create account
router.post('/login', login);          // Login
router.post('/refresh', refresh);      // Refresh tokens
router.post('/logout', logout);        // Logout
router.get('/me', authenticate, getMe); // #1 — Get current user profile

export default router;
