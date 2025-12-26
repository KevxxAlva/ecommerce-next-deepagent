'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams?.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Wait a bit for webhook to process
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#60B5FF] mx-auto mb-4"></div>
          <p className="text-gray-600">Procesando tu pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center"
      >
        <div className="mb-6">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Pago Exitoso!
          </h1>
          <p className="text-gray-600">
            Tu orden ha sido procesada correctamente.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <Package className="h-12 w-12 text-[#60B5FF] mx-auto mb-3" />
          <p className="text-sm text-gray-700">
            Recibirás un correo de confirmación con los detalles de tu orden.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => router.push('/orders')}
            className="w-full bg-[#60B5FF] hover:bg-[#4A9FE8] py-6 text-lg"
          >
            Ver Mis Órdenes
          </Button>
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="w-full py-6 text-lg"
          >
            Continuar Comprando
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
