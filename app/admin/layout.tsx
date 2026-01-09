import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/admin-sidebar';
import { getUserById } from '@/lib/supabase/database';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  // Check if user is authenticated
  if (!user) {
    redirect('/login');
  }

  // Get user role from database
  try {
    const dbUser = await getUserById(user.id);
    
    if (!dbUser || dbUser.role !== 'ADMIN') {
      redirect('/');
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    redirect('/');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 transition-all duration-300">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
