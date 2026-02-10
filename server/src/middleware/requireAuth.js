const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.header('authorization') || '';
  const parts = header.split(' ');
  const token = parts.length === 2 && /^bearer$/i.test(parts[0]) ? parts[1] : '';

  if (!token) {
    return res.status(401).json({ success: false, message: 'Missing Bearer token' });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, message: 'Missing JWT_SECRET' });
    }

    const payload = jwt.verify(token, secret);
    if (!payload || !payload.openid) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    req.openid = payload.openid;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

module.exports = {
  requireAuth
};
