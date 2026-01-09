'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';
import { useSession } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    category: {
      name: string;
    };
  };
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { data: session } = useSession() || {};
  const router = useRouter();

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });

      if (res.ok) {
        toast.success('Producto agregado al carrito');
        router.refresh();
      } else {
        toast.error('Error al agregar al carrito');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al agregar al carrito');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Link href={`/products/${product.id}`}>
        <div className="group cursor-pointer rounded-lg bg-white p-4 shadow-md hover:shadow-xl transition-all duration-300">
          <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100 mb-4">
            {product?.images?.[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sin imagen
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <p className="text-xs text-[#60B5FF] font-medium uppercase">
              {product?.category?.name}
            </p>
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {product.description}
            </p>
            
            <div className="flex items-center justify-between pt-2">
              <p className="text-2xl font-bold text-gray-900">
                ${product.price?.toFixed?.(2) ?? '0.00'}
              </p>
              <Button
                size="sm"
                className="bg-[#60B5FF] hover:bg-[#4A9FE8] gap-2"
                onClick={addToCart}
              >
                <ShoppingCart className="h-4 w-4" />
                Agregar
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
