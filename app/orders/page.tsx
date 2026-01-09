'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Package, Eye } from 'lucide-react';

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    product: {
      name: string;
    };
  }[];
}

export default function OrdersPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status, router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      SHIPPED: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };

    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      PROCESSING: 'Procesando',
      SHIPPED: 'Enviado',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Cargando órdenes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Mis Órdenes</h1>
        </motion.div>

        {orders?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12 bg-white rounded-2xl shadow-lg"
          >
            <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-6">No tienes órdenes aún</p>
            <Button
              onClick={() => router.push('/')}
              className="bg-[#60B5FF] hover:bg-[#4A9FE8]"
            >
              Comenzar a comprar
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {orders?.map?.((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Orden #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {order?.items?.length ?? 0} producto(s)
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-[#60B5FF]">
                      ${order.total?.toFixed?.(2) ?? '0.00'}
                    </p>
                    <Button
                      onClick={() => router.push(`/orders/${order.id}`)}
                      variant="outline"
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              </motion.div>
            )) || null}
          </div>
        )}
      </div>
    </div>
  );
}
