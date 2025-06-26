import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import Stripe from 'stripe';

const router = express.Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Apply authentication and student role requirement to all routes
router.use(authenticateToken);
router.use(requireRole(['STUDENT']));

// Get student's assignments
router.get('/assignments', async (req, res) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { studentId: req.user.student.id },
      include: {
        tutor: true,
        payment: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(assignments);
  } catch (error) {
    console.error('Student assignments fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get student's payments
router.get('/payments', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        assignment: {
          studentId: req.user.student.id
        }
      },
      include: {
        assignment: {
          include: {
            tutor: true
          }
        }
      },
      orderBy: { paidAt: 'desc' }
    });

    res.json(payments);
  } catch (error) {
    console.error('Student payments fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create payment checkout session
router.post('/payments/create-checkout-session', async (req, res) => {
  try {
    const { assignmentId } = req.body;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        student: true,
        tutor: true
      }
    });

    if (!assignment || assignment.studentId !== req.user.student.id) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.status !== 'TUTOR_ACCEPTED') {
      return res.status(400).json({ message: 'Assignment is not ready for payment' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Tutoring Session - ${assignment.subject}`,
              description: `Tutoring session with ${assignment.tutor.name}`
            },
            unit_amount: Math.round(assignment.totalFeeToStudent * 100) // Convert to cents
          },
          quantity: 1
        }
      ],
      metadata: {
        assignmentId: assignment.id,
        platformCommission: assignment.platformCommission.toString()
      },
      success_url: `${req.headers.origin}/student/dashboard?payment=success`,
      cancel_url: `${req.headers.origin}/student/dashboard?payment=cancelled`
    });

    // Update assignment status
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: { status: 'PAYMENT_PENDING' }
    });

    res.json({ sessionUrl: session.url });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;