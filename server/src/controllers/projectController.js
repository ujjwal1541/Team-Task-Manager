const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

const memberSelect = { select: { id: true, name: true, email: true } };

exports.getProjects = async (req, res) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      include: {
        project: {
          include: {
            owner: memberSelect,
            members: { include: { user: memberSelect } },
            _count: { select: { tasks: true } },
          },
        },
      },
    });

    const projects = memberships.map((m) => ({ ...m.project, myRole: m.role }));
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

exports.createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description } = req.body;
  try {
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
        members: { create: { userId: req.user.id, role: 'ADMIN' } },
      },
      include: {
        owner: memberSelect,
        members: { include: { user: memberSelect } },
        _count: { select: { tasks: true } },
      },
    });

    res.status(201).json({ ...project, myRole: 'ADMIN' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

exports.getProject = async (req, res) => {
  const { id } = req.params;
  try {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: req.user.id } },
    });
    if (!membership) return res.status(404).json({ error: 'Project not found or access denied' });

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: memberSelect,
        members: { include: { user: memberSelect } },
        tasks: {
          include: {
            assignee: memberSelect,
            creator: memberSelect,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json({ ...project, myRole: membership.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

exports.updateProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  const { name, description, status } = req.body;
  try {
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
      },
      include: {
        owner: memberSelect,
        members: { include: { user: memberSelect } },
        _count: { select: { tasks: true } },
      },
    });

    res.json({ ...project, myRole: 'ADMIN' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

exports.deleteProject = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.project.delete({ where: { id } });
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

exports.addMember = async (req, res) => {
  const { id: projectId } = req.params;
  const { email, role = 'MEMBER' } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'No user found with that email' });

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });
    if (existing) return res.status(400).json({ error: 'User is already a member' });

    const member = await prisma.projectMember.create({
      data: { projectId, userId: user.id, role },
      include: { user: memberSelect },
    });

    res.status(201).json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add member' });
  }
};

exports.removeMember = async (req, res) => {
  const { id: projectId, userId } = req.params;

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project.ownerId === userId) {
      return res.status(400).json({ error: 'Cannot remove the project owner' });
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });

    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};
