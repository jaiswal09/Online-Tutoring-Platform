import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication and admin role requirement to all routes
router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        student: true,
        tutor: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      profile: user.student || user.tutor || null
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all students with their profile IDs
router.get('/students', async (req, res) => {
  try {
    const students = await prisma.studentProfile.findMany({
      include: {
        user: true
      },
      orderBy: { user: { createdAt: 'desc' } }
    });

    const formattedStudents = students.map(student => ({
      id: student.id, // This is the profile ID needed for assignments
      userId: student.userId,
      name: student.name,
      email: student.user.email,
      contactNumber: student.contactNumber,
      preferredSubjects: JSON.parse(student.preferredSubjects || '[]'),
      budgetMin: student.budgetMin,
      budgetMax: student.budgetMax
    }));

    res.json(formattedStudents);
  } catch (error) {
    console.error('Students fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all tutors with their profile IDs
router.get('/tutors', async (req, res) => {
  try {
    const tutors = await prisma.tutorProfile.findMany({
      include: {
        user: true
      },
      orderBy: { user: { createdAt: 'desc' } }
    });

    const formattedTutors = tutors.map(tutor => ({
      id: tutor.id, // This is the profile ID needed for assignments
      userId: tutor.userId,
      name: tutor.name,
      email: tutor.user.email,
      contactNumber: tutor.contactNumber,
      subjectsTaught: JSON.parse(tutor.subjectsTaught || '[]'),
      experienceYears: tutor.experienceYears,
      defaultHourlyRate: tutor.defaultHourlyRate
    }));

    res.json(formattedTutors);
  } catch (error) {
    console.error('Tutors fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all assignments
router.get('/assignments', async (req, res) => {
  try {
    const assignments = await prisma.assignment.findMany({
      include: {
        student: true,
        tutor: true,
        payment: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(assignments);
  } catch (error) {
    console.error('Assignments fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new assignment
router.post('/assignments', async (req, res) => {
  try {
    const { studentId, tutorId, subject, totalFeeToStudent, adminSetTutorFee } = req.body;

    if (!studentId || !tutorId || !subject || !totalFeeToStudent || !adminSetTutorFee) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const platformCommission = totalFeeToStudent - adminSetTutorFee;

    if (platformCommission < 0) {
      return res.status(400).json({ message: 'Tutor fee cannot exceed total fee' });
    }

    const assignment = await prisma.assignment.create({
      data: {
        studentId,
        tutorId,
        subject,
        totalFeeToStudent,
        adminSetTutorFee,
        platformCommission,
        status: 'PENDING_OFFER'
      },
      include: {
        student: true,
        tutor: true
      }
    });

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    console.error('Assignment creation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update assignment status
router.put('/assignments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const assignment = await prisma.assignment.update({
      where: { id },
      data: { status },
      include: {
        student: true,
        tutor: true
      }
    });

    res.json({
      message: 'Assignment status updated successfully',
      assignment
    });
  } catch (error) {
    console.error('Assignment status update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all payments
router.get('/payments', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        assignment: {
          include: {
            student: true,
            tutor: true
          }
        }
      },
      orderBy: { paidAt: 'desc' }
    });

    res.json(payments);
  } catch (error) {
    console.error('Payments fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalTutors,
      totalAssignments,
      activeAssignments,
      totalRevenue,
      pendingPayments
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'TUTOR' } }),
      prisma.assignment.count(),
      prisma.assignment.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.payment.aggregate({
        _sum: { platformFeeCollected: true },
        where: { status: 'SUCCEEDED' }
      }),
      prisma.assignment.count({ where: { status: 'PAYMENT_PENDING' } })
    ]);

    res.json({
      totalUsers,
      totalStudents,
      totalTutors,
      totalAssignments,
      activeAssignments,
      totalRevenue: totalRevenue._sum.platformFeeCollected || 0,
      pendingPayments
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;