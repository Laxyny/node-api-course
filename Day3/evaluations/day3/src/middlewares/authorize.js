function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Accès refusé. Rôles requis : ${roles.join(', ')}` });
    }
    next();
  };
}

module.exports = authorize;
