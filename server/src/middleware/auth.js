const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireProjectRole = (roles) => async (req, res, next) => {
  const pid = req.params.id || req.params.projectId;

  try {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: pid, userId: req.user.id } },
    });
    if (!member || !roles.includes(member.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    req.projectRole = member.role;
    next();
  } catch {
    res.status(500).json({ error: 'Permission check failed' });
  }
};

module.exports = { authenticate, requireProjectRole };
