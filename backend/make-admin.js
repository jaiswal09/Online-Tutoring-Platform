import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
  // Replace 'your-email@example.com' with the email you used to register
  const email = 'sahil.2024@iic.ac.in';
  
  try {
    const user = await prisma.user.update({
      where: { email: email },
      data: { role: 'ADMIN' }
    });
    
    console.log('User updated to admin:', user.email);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
