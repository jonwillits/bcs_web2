const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestStudent() {
  try {
    // Check if student already exists
    const existing = await prisma.users.findUnique({
      where: { email: 'student@test.edu' }
    });

    if (existing) {
      console.log('✓ Test student already exists:', existing.email);
      console.log('  ID:', existing.id);
      console.log('  Role:', existing.role);
      console.log('  Email verified:', existing.email_verified);
      return existing;
    }

    // Create new student user
    const passwordHash = await bcrypt.hash('TestStudent123!', 12);

    const student = await prisma.users.create({
      data: {
        id: `student-test-${Date.now()}`,
        email: 'student@test.edu',
        password_hash: passwordHash,
        name: 'Test Student',
        role: 'student', // This is the key - not 'faculty'
        email_verified: true, // Pre-verify for easier testing
        email_verified_at: new Date(),
      }
    });

    console.log('✓ Created test student user:');
    console.log('  Email: student@test.edu');
    console.log('  Password: TestStudent123!');
    console.log('  Role:', student.role);
    console.log('  ID:', student.id);

    return student;
  } catch (error) {
    console.error('Error creating test student:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestStudent();
