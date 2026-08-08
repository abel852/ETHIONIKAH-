const prisma = require('./src/config/database');
async function check() {
  try {
    const result = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_married'`;
    console.log('is_married column:', JSON.stringify(result));
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}
check();
