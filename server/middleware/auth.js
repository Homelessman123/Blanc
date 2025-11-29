import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET;

export function authGuard(req, res, next) {
  if (!jwtSecret) {
    return res.status(500).json({ error: 'JWT is not configured on the server.' });
  }
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  };
}

export function issueToken(user) {
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }
  const payload = {
    id: user._id?.toString() || user.id,
    role: user.role || 'student',
    email: user.email,
  };

  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}
