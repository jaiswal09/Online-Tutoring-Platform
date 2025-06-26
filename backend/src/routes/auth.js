import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// ...existing code...
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
// ...existing code...

const router = express.Router();
const prisma = new PrismaClient();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, profileData } = req.body;

    // Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with profile
    const userData = {
      email,
      passwordHash,
      role: role.toUpperCase()
    };

    let user;
    if (role.toUpperCase() === 'STUDENT') {
      user = await prisma.user.create({
        data: {
          ...userData,
          student: {
            create: {
              name: profileData.name || '',
              contactNumber: profileData.contactNumber || '',
              preferredSubjects: JSON.stringify(profileData.preferredSubjects || []),
              budgetMin: profileData.budgetMin || null,
              budgetMax: profileData.budgetMax || null
            }
          }
        },
        include: { student: true }
      });
    } else if (role.toUpperCase() === 'TUTOR') {
      user = await prisma.user.create({
        data: {
          ...userData,
          tutor: {
            create: {
              name: profileData.name || '',
              contactNumber: profileData.contactNumber || '',
              subjectsTaught: JSON.stringify(profileData.subjectsTaught || []),
              experienceYears: profileData.experienceYears || 0,
              defaultHourlyRate: profileData.defaultHourlyRate || 0,
              availability: JSON.stringify(profileData.availability || {})
            }
          }
        },
        include: { tutor: true }
      });
    } else {
      user = await prisma.user.create({
        data: userData
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.student || user.tutor || null
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: true,
        tutor: true
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.student || user.tutor || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;