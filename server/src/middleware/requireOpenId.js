function requireOpenId(req, res, next) {
  const openid = req.header('x-openid');
  if (!openid) {
    return res.status(401).json({
      success: false,
      message: 'Missing x-openid'
    });
  }

  req.openid = openid;
  next();
}

module.exports = {
  requireOpenId
};
