const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    const [totalTasks, inProgress, inReview, done, overdue, activeProjects, recentTasks, myTasks] =
      await Promise.all([
        prisma.task.count({ where: { projectId: { in: projectIds } } }),
        prisma.task.count({ where: { projectId: { in: projectIds }, status: 'IN_PROGRESS' } }),
        prisma.task.count({ where: { projectId: { in: projectIds }, status: 'IN_REVIEW' } }),
        prisma.task.count({ where: { projectId: { in: projectIds }, status: 'DONE' } }),
        prisma.task.count({
          where: {
            projectId: { in: projectIds },
            dueDate: { lt: now },
            status: { notIn: ['DONE'] },
          },
        }),
        prisma.project.count({ where: { id: { in: projectIds }, status: 'ACTIVE' } }),
        prisma.task.findMany({
          where: { projectId: { in: projectIds } },
          include: {
            project: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true } },
          },
          orderBy: { updatedAt: 'desc' },
          take: 8,
        }),
        prisma.task.findMany({
          where: { assigneeId: userId, status: { notIn: ['DONE'] } },
          include: { project: { select: { id: true, name: true } } },
          orderBy: { dueDate: 'asc' },
          take: 5,
        }),
      ]);

    res.json({
      stats: { totalTasks, inProgress, inReview, done, overdue, activeProjects },
      recentTasks,
      myTasks,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};
