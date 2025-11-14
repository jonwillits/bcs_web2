const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetJaneSmithPassword() {
  try {
    // Find Jane Smith by email
    const user = await prisma.users.findUnique({
      where: { email: 'jsmith@university.edu' }
    });

    if (!user) {
      console.error('❌ User not found: jsmith@university.edu');
      console.log('Creating Jane Smith instead...');

      const passwordHash = await bcrypt.hash('JaneSmith123!', 12);

      const newUser = await prisma.users.create({
        data: {
          id: `faculty_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
          email: 'jsmith@university.edu',
          password_hash: passwordHash,
          name: 'Jane Smith',
          role: 'faculty',
          email_verified: true,
          email_verified_at: new Date(),
        }
      });

      console.log('✓ Created Jane Smith:');
      console.log('  Email: jsmith@university.edu');
      console.log('  Password: JaneSmith123!');
      console.log('  Role:', newUser.role);
      console.log('  ID:', newUser.id);
      return newUser;
    }

    // Reset password for existing user
    const newPasswordHash = await bcrypt.hash('JaneSmith123!', 12);

    const updated = await prisma.users.update({
      where: { email: 'jsmith@university.edu' },
      data: {
        password_hash: newPasswordHash,
        email_verified: true,
        email_verified_at: new Date(),
      }
    });

    console.log('✓ Reset password for Jane Smith:');
    console.log('  Email: jsmith@university.edu');
    console.log('  Password: JaneSmith123!');
    console.log('  Role:', updated.role);
    console.log('  ID:', updated.id);

    return updated;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetJaneSmithPassword();
