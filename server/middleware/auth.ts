import { Request, Response, NextFunction } from 'express';
import { User } from '@shared/schema';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  next();
};

export const attachUser = async (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.userId) {
    try {
      const { authService } = await import('../utils/authService');
      const user = await authService.getUserById(req.session.userId);
      if (user) {
        req.user = user;
      }
    } catch (error) {
      console.error('Error attaching user:', error);
    }
  }
  
  next();
};

export const requireOnboarding = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.onboarding_completed) {
    return res.status(403).json({ 
      message: 'Onboarding required',
      requiresOnboarding: true 
    });
  }
  
  next();
};