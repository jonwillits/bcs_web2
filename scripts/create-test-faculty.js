const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestFaculty() {
  try {
    // Check if faculty already exists
    const existing = await prisma.users.findUnique({
      where: { email: 'faculty@test.edu' }
    });

    if (existing) {
      console.log('✓ Test faculty already exists:', existing.email);
      console.log('  ID:', existing.id);
      console.log('  Role:', existing.role);
      console.log('  Email verified:', existing.email_verified);
      return existing;
    }

    // Create new faculty user
    const passwordHash = await bcrypt.hash('TestFaculty123!', 12);

    const faculty = await prisma.users.create({
      data: {
        id: `faculty-test-${Date.now()}`,
        email: 'faculty@test.edu',
        password_hash: passwordHash,
        name: 'Test Faculty',
        role: 'faculty',
        email_verified: true, // Pre-verify for easier testing
        email_verified_at: new Date(),
      }
    });

    console.log('✓ Created test faculty user:');
    console.log('  Email: faculty@test.edu');
    console.log('  Password: TestFaculty123!');
    console.log('  Role:', faculty.role);
    console.log('  ID:', faculty.id);

    return faculty;
  } catch (error) {
    console.error('Error creating test faculty:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestFaculty();
