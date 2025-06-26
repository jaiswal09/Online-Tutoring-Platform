import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication and tutor role requirement to all routes
router.use(authenticateToken);
router.use(requireRole(['TUTOR']));

// Get tutor's assignment offers
router.get('/assignments/offers', async (req, res) => {
  try {
    const offers = await prisma.assignment.findMany({
      where: {
        tutorId: req.user.tutor.id,
        status: 'PENDING_OFFER'
      },
      include: {
        student: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(offers);
  } catch (error) {
    console.error('Tutor offers fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get tutor's assignments
router.get('/assignments', async (req, res) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: {
        tutorId: req.user.tutor.id,
        status: {
          not: 'PENDING_OFFER'
        }
      },
      include: {
        student: true,
        payment: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(assignments);
  } catch (error) {
    console.error('Tutor assignments fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Accept assignment offer
router.put('/assignments/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { student: true }
    });

    if (!assignment || assignment.tutorId !== req.user.tutor.id) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.status !== 'PENDING_OFFER') {
      return res.status(400).json({ message: 'Assignment is not available for acceptance' });
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: { status: 'TUTOR_ACCEPTED' },
      include: {
        student: true
      }
    });

    res.json({
      message: 'Assignment accepted successfully',
      assignment: updatedAssignment
    });
  } catch (error) {
    console.error('Assignment acceptance error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Decline assignment offer
router.put('/assignments/:id/decline', async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.assignment.findUnique({
      where: { id }
    });

    if (!assignment || assignment.tutorId !== req.user.tutor.id) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.status !== 'PENDING_OFFER') {
      return res.status(400).json({ message: 'Assignment is not available for declining' });
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: { status: 'TUTOR_DECLINED' },
      include: {
        student: true
      }
    });

    res.json({
      message: 'Assignment declined successfully',
      assignment: updatedAssignment
    });
  } catch (error) {
    console.error('Assignment decline error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get tutor's payouts
router.get('/payouts', async (req, res) => {
  try {
    const payouts = await prisma.payout.findMany({
      where: { tutorId: req.user.tutor.id },
      include: {
        assignment: {
          include: {
            student: true
          }
        }
      },
      orderBy: { payoutInitiatedAt: 'desc' }
    });

    res.json(payouts);
  } catch (error) {
    console.error('Tutor payouts fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;