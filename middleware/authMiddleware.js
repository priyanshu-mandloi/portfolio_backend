export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not Authenticated!' });
  }
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};
