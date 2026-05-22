const { execSync } = require('child_process');
try {
  console.log('Running prisma db push...');
  const output = execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: '/Users/franivan/Documents/ProyectosWeb/ParaisoDeAvedad/server' });
  console.log('Success!');
} catch (e) {
  console.error('Error running prisma:', e.message);
}
