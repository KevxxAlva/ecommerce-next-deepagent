'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, ArrowLeft, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Category {
  id: string;
  name: string;
  description: string | null;
  _count?: {
    products: number;
  };
}

export default function AdminCategoriesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

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
      fetchCategories();
    }
  }, [status, session, router]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const categoryData = {
      name,
      description: description || null,
    };

    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      if (res.ok) {
        toast.success(
          editingCategory ? 'Categoría actualizada' : 'Categoría creada'
        );
        setShowModal(false);
        fetchCategories();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al guardar categoría');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar categoría');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Categoría eliminada');
        fetchCategories();
      } else {
        toast.error('Error al eliminar categoría');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar categoría');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/admin')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <h1 className="text-4xl font-bold text-gray-900">Gestionar Categorías</h1>
          </div>
          <Button
            onClick={openCreateModal}
            className="bg-[#60B5FF] hover:bg-[#4A9FE8] gap-2"
          >
            <Plus className="h-5 w-5" />
            Nueva Categoría
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories?.map?.((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-[#60B5FF]/10 p-3 rounded-lg">
                  <Tag className="h-8 w-8 text-[#60B5FF]" />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => openEditModal(category)}
                    variant="ghost"
                    size="sm"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(category.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {category.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {category.description || 'Sin descripción'}
              </p>
              <p className="text-sm text-[#60B5FF] font-medium">
                {category?._count?.products ?? 0} productos
              </p>
            </motion.div>
          )) || null}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Nombre de la categoría"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#60B5FF]"
                  placeholder="Descripción de la categoría (opcional)"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#60B5FF] hover:bg-[#4A9FE8]"
                >
                  {editingCategory ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
