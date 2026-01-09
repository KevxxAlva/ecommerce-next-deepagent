import { getUserByEmail, updateUserRole } from '../lib/supabase/database';

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Por favor proporciona un email: npm run make-admin <email>');
    process.exit(1);
  }

  try {
    const user = await getUserByEmail(email);

    if (!user) {
      console.error(`❌ No se encontró ningún usuario con el email: ${email}`);
      console.log('\n💡 Asegúrate de registrarte primero en /signup');
      process.exit(1);
    }

    if (user.role === 'ADMIN') {
      console.log(`✅ El usuario ${email} ya es ADMIN`);
      process.exit(0);
    }

    await updateUserRole(user.id, 'ADMIN');

    console.log(`✅ Usuario ${email} promovido a ADMIN exitosamente`);
    console.log(`🔐 Ahora puedes acceder a /admin`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
