'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
  };
}

export default function CheckoutPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [shippingName, setShippingName] = useState('');
  const [shippingEmail, setShippingEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetchCart();
      setShippingEmail(session?.user?.email || '');
      setShippingName(session?.user?.user_metadata?.full_name || '');
    }
  }, [status, router, session]);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        setCartItems(data || []);
        if (data?.length === 0) {
          toast.error('Tu carrito está vacío');
          router.push('/cart');
        }
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Error al cargar el carrito');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const items = cartItems?.map?.(item => ({
        name: item?.product?.name ?? 'Producto',
        description: (item?.product as any)?.description ?? '',
        price: item?.product?.price ?? 0,
        quantity: item?.quantity ?? 1,
        images: (item?.product as any)?.images ?? [],
      })) ?? [];

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          shippingName,
          shippingEmail,
          shippingAddress,
        }),
      });

      if (res.ok) {
        const { url } = await res.json();
        if (url) {
          window.location.href = url;
        } else {
          toast.error('Error al crear sesión de pago');
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear sesión de pago');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al procesar el pago');
    } finally {
      setSubmitting(false);
    }
  };

  const total = cartItems?.reduce?.(
    (sum, item) => sum + (item?.product?.price ?? 0) * (item?.quantity ?? 0),
    0
  ) ?? 0;

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
        >
          <div>
            <h2 className="text-2xl font-semibold mb-6">Información de Envío</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <Input
                  type="text"
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  required
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={shippingEmail}
                  onChange={(e) => setShippingEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección de Envío
                </label>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  required
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#60B5FF]"
                  placeholder="Calle, ciudad, código postal, país"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-2xl font-semibold mb-4">Resumen del Pedido</h2>
            <div className="space-y-2">
              {cartItems?.map?.(item => (
                <div key={item.id} className="flex justify-between text-gray-700">
                  <span>
                    {item?.product?.name} x {item?.quantity}
                  </span>
                  <span>
                    ${((item?.product?.price ?? 0) * (item?.quantity ?? 0)).toFixed(2)}
                  </span>
                </div>
              )) || null}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-[#60B5FF]">
                    ${total?.toFixed?.(2) ?? '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#60B5FF] hover:bg-[#4A9FE8] py-6 text-lg"
          >
            {submitting ? 'Redirigiendo a Stripe...' : 'Proceder al Pago'}
          </Button>

          <p className="text-sm text-gray-500 text-center">
            Serás redirigido a Stripe para completar tu pago de forma segura.
          </p>
        </motion.form>
      </div>
    </div>
  );
}
