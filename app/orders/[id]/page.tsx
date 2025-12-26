'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface Order {
  id: string;
  status: string;
  total: number;
  shippingName: string;
  shippingEmail: string;
  shippingAddress: string;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      images: string[];
    };
  }[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession() || {};
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && params?.id) {
      fetchOrder();
    }
  }, [status, params?.id, router]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${params?.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        toast.error('Orden no encontrada');
        router.push('/orders');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Error al cargar la orden');
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
      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${styles[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Cargando orden...</p>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Orden #{order.id.slice(0, 8)}
                </h1>
                <p className="text-gray-600">
                  Realizada el {new Date(order.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {getStatusBadge(order.status)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
              <div>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#60B5FF]" />
                  Información de Envío
                </h2>
                <p className="text-gray-700">{order.shippingName}</p>
                <p className="text-gray-600">{order.shippingEmail}</p>
                <p className="text-gray-600 mt-2">{order.shippingAddress}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Resumen</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${order.total?.toFixed?.(2) ?? '0.00'}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-[#60B5FF]">${order.total?.toFixed?.(2) ?? '0.00'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Productos</h2>
            <div className="space-y-4">
              {order?.items?.map?.((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex gap-4 p-4 border rounded-lg"
                >
                  <div className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                    {item?.product?.images?.[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item?.product?.name ?? ''}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400 text-xs">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item?.product?.name}
                    </h3>
                    <p className="text-gray-600">
                      Cantidad: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      ${item.price?.toFixed?.(2) ?? '0.00'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Total: ${((item?.price ?? 0) * (item?.quantity ?? 0)).toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              )) || null}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
