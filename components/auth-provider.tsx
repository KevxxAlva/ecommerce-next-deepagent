'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  role: string | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  update: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  status: 'loading',
  update: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const supabase = createClient();

  const fetchSession = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        
        // Optimistic update or check if role is already in metadata (if we put it there)
        // For now, fetch from DB but cleaner
        try {
            const { data: dbUser, error } = await supabase
                .from('User')
                .select('role')
                .eq('id', currentSession.user.id)
                .single();
                
            if (!error && dbUser) {
                 setRole(dbUser.role);
            } else {
                 setRole('CUSTOMER'); // Fallback safe
            }
        } catch (err) {
            setRole('CUSTOMER');
        }

        setStatus('authenticated');
      } else {
        setSession(null);
        setUser(null);
        setRole(null);
        setStatus('unauthenticated');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      setStatus('unauthenticated');
      setRole(null);
    }
  };

  useEffect(() => {
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
         // Only fetch role if we don't have it or if it's a new session
         // To be safe and reactive (e.g. user promoted), we fetch.
         // We can optimize by checking if session.user.id === user?.id
         const { data: dbUser } = await supabase
            .from('User')
            .select('role')
            .eq('id', session.user.id)
            .single();
         setRole(dbUser?.role || 'CUSTOMER');
         setStatus('authenticated');
      } else {
         setRole(null);
         setStatus('unauthenticated');
         if (event === 'SIGNED_OUT') {
            setUser(null);
            setSession(null);
         }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, role, status, update: fetchSession }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to mimic next-auth's useSession
export function useSession() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSession must be used within an AuthProvider');
  }
  // Return compatible shape for next-auth but with role injected
  return {
    data: context.session ? { user: { ...context.user, role: context.role } } : null,
    status: context.status,
    role: context.role,
    update: context.update,
  };
}

// Helper for NextAuth compatibility
// Helper for NextAuth compatibility
export async function signOut(options?: { callbackUrl?: string }) {
  const supabase = createClient();
  try {
      await supabase.auth.signOut();
  } catch (error) {
      console.error("Error signing out:", error);
  }
  
  // Clear any local storage if used manually
  // Force a hard navigation to clear Next.js client cache
  window.location.href = options?.callbackUrl || '/';
}
