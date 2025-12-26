'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { DollarSign, Package, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts';

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  topProducts: {
    id: string;
    name: string;
    totalSold: number;
  }[];
  ordersByStatus: {
    status: string;
    _count: { id: number };
  }[];
}

export default function AdminDashboard() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (userRole !== 'ADMIN') {
        router.push('/');
        return;
      }
      fetchStats();
    }
  }, [status, session, router]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Cargando dashboard...</p>
      </div>
    );
  }

  const statusData = stats?.ordersByStatus?.map?.(item => ({
    name: item.status,
    cantidad: item?._count?.id ?? 0,
  })) ?? [];

  const topProductsData = stats?.topProducts?.map?.(p => ({
    nombre: p?.name?.substring?.(0, 15) ?? 'Sin nombre',
    vendidos: p?.totalSold ?? 0,
  })) ?? [];

  const COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#80D8C3', '#A19AD3'];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
          <p className="text-gray-600">Bienvenido al dashboard administrativo</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ingresos Totales</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${stats?.totalRevenue?.toFixed?.(2) ?? '0.00'}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Órdenes</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalOrders ?? 0}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Productos</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalProducts ?? 0}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Usuarios</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalUsers ?? 0}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#60B5FF]" />
              Productos Más Vendidos
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsData}>
                <XAxis
                  dataKey="nombre"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  label={{ value: 'Producto', position: 'insideBottom', offset: -10, style: { fontSize: 11 } }}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  label={{ value: 'Cantidad', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                />
                <Tooltip
                  contentStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="vendidos" radius={[8, 8, 0, 0]}>
                  {topProductsData?.map?.((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-[#60B5FF]" />
              Órdenes por Estado
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  label={{ value: 'Estado', position: 'insideBottom', offset: -5, style: { fontSize: 11 } }}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  label={{ value: 'Cantidad', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                />
                <Tooltip
                  contentStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="cantidad" radius={[8, 8, 0, 0]}>
                  {statusData?.map?.((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/admin/products')}
              className="p-4 border-2 border-[#60B5FF] rounded-lg hover:bg-[#60B5FF] hover:text-white transition-all duration-300 text-center"
            >
              <Package className="h-8 w-8 mx-auto mb-2" />
              <p className="font-semibold">Gestionar Productos</p>
            </button>
            <button
              onClick={() => router.push('/admin/categories')}
              className="p-4 border-2 border-[#60B5FF] rounded-lg hover:bg-[#60B5FF] hover:text-white transition-all duration-300 text-center"
            >
              <Package className="h-8 w-8 mx-auto mb-2" />
              <p className="font-semibold">Gestionar Categorías</p>
            </button>
            <button
              onClick={() => router.push('/admin/users')}
              className="p-4 border-2 border-[#60B5FF] rounded-lg hover:bg-[#60B5FF] hover:text-white transition-all duration-300 text-center"
            >
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p className="font-semibold">Gestionar Usuarios</p>
            </button>
            <button
              onClick={() => router.push('/admin/orders')}
              className="p-4 border-2 border-[#60B5FF] rounded-lg hover:bg-[#60B5FF] hover:text-white transition-all duration-300 text-center"
            >
              <ShoppingCart className="h-8 w-8 mx-auto mb-2" />
              <p className="font-semibold">Gestionar Órdenes</p>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
