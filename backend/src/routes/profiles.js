import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        student: true,
        tutor: true
      }
    });

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.student || user.tutor || null
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update student profile
router.put('/student', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, contactNumber, preferredSubjects, budgetMin, budgetMax } = req.body;

    const updatedProfile = await prisma.studentProfile.update({
      where: { userId: req.user.id },
      data: {
        name,
        contactNumber,
        preferredSubjects: JSON.stringify(preferredSubjects || []),
        budgetMin,
        budgetMax
      }
    });

    res.json({ message: 'Profile updated successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Student profile update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update tutor profile
router.put('/tutor', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'TUTOR') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, contactNumber, subjectsTaught, experienceYears, defaultHourlyRate, availability } = req.body;

    const updatedProfile = await prisma.tutorProfile.update({
      where: { userId: req.user.id },
      data: {
        name,
        contactNumber,
        subjectsTaught: JSON.stringify(subjectsTaught || []),
        experienceYears,
        defaultHourlyRate,
        availability: JSON.stringify(availability || {})
      }
    });

    res.json({ message: 'Profile updated successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Tutor profile update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;