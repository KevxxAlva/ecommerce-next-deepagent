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
        console.log('AuthProvider: Session found', currentSession.user.id);
        setSession(currentSession);
        setUser(currentSession.user);
        
        // Fetch user role from DB
        try {
            console.log('AuthProvider: Fetching role for', currentSession.user.id);
            const { data: dbUser, error } = await supabase
                .from('User')
                .select('role')
                .eq('id', currentSession.user.id)
                .single();
                
            if (error) {
                console.error('AuthProvider: Error fetching role', error);
                // Try lowercase table name as fallback if 'User' fails (common issue)
                if (error.code === '42P01') { // undefined_table
                    console.log('AuthProvider: Retrying with lowercase "user" table');
                     const { data: dbUserRetry } = await supabase
                        .from('user')
                        .select('role')
                        .eq('id', currentSession.user.id)
                        .single();
                     setRole(dbUserRetry?.role || 'CUSTOMER');
                     console.log('AuthProvider: Role fetched (retry):', dbUserRetry?.role);
                } else {
                     setRole('CUSTOMER');
                }
            } else {
                console.log('AuthProvider: Role fetched:', dbUser?.role);
                setRole(dbUser?.role || 'CUSTOMER');
            }
        } catch (err) {
            console.error('AuthProvider: Exception fetching role', err);
            setRole('CUSTOMER');
        }

        setStatus('authenticated');
      } else {
        console.log('AuthProvider: No session');
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
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
export async function signOut(options?: { callbackUrl?: string }) {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = options?.callbackUrl || '/';
}
