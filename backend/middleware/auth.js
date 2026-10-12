const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : '';

  if (!token) {
    return res.status(401).json({ message: 'Authentication is required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });

    if (!Number.isInteger(payload.user_id) || !['admin', 'student'].includes(payload.role)) {
      return res.status(401).json({ message: 'Authentication token is invalid.' });
    }

    req.user = {
      user_id: payload.user_id,
      role: payload.role
    };
    next();
  } catch {
    res.status(401).json({ message: 'Authentication token is invalid or expired.' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ message: 'You do not have permission to access this resource.' });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireAdmin: requireRole('admin'),
  requireStudent: requireRole('student')
};