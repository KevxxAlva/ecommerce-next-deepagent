'use client';

import Link from 'next/link';
import { useSession, signOut } from '@/components/auth-provider';
import { ShoppingCart, User, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';

export function Header() {
  const { data: session, status } = useSession() || {};
  const [cartCount, setCartCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchCartCount();
      
      // Actualizar contador cada 3 segundos
      const interval = setInterval(() => {
        fetchCartCount();
      }, 3000);

      return () => clearInterval(interval);
    } else {
      setCartCount(0);
    }
  }, [session]);

  const fetchCartCount = async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        // Sumar las cantidades de todos los items
        const totalItems = data?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
        setCartCount(totalItems);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  if (!mounted) {
    return null;
  }

  const isAdmin = (session?.user as any)?.role === 'ADMIN' || (session?.user as any)?.role === 'admin';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[#60B5FF] hover:text-[#4A9FE8] transition-colors">
            ShopHub
          </Link>

          <nav className="flex items-center gap-4">
            {status === 'authenticated' && session ? (
              <>
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Link href="/orders">
                  <Button variant="ghost" size="sm">
                    Mis Órdenes
                  </Button>
                </Link>
                <Link href="/cart">
                  <Button variant="ghost" size="sm" className="gap-2 relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-600" />
                  <div className="flex flex-col">
                      <span className="text-sm text-gray-700 font-medium">
                        {session.user?.user_metadata?.full_name || session.user?.email}
                      </span>
                      <span className="text-[10px] text-gray-400 capitalize">
                         {(session.user as any)?.role || 'Cargando...'}
                      </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Salir
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-[#60B5FF] hover:bg-[#4A9FE8]">
                    Registrarse
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
