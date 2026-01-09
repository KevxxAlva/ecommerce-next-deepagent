'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/auth-provider';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, ArrowLeft, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  stock: number;
  category: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

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
      fetchProducts();
      fetchCategories();
    }
  }, [status, session, router]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Create FormData
        const formData = new FormData();
        formData.append('file', file);

        // Upload to Cloudinary
        const uploadRes = await fetch('/api/upload/cloudinary', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          toast.error('Error al subir imagen');
          continue;
        }

        const { url } = await uploadRes.json();
        newImages.push(url);
      }

      setUploadedImages([...uploadedImages, ...newImages]);
      toast.success('Imágenes subidas exitosamente');
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Error al subir imágenes');
    } finally {
      setUploading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setStock('');
    setCategoryId('');
    setUploadedImages([]);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setCategoryId(product.category.id);
    setUploadedImages(product.images || []);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      categoryId,
      images: uploadedImages,
    };

    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (res.ok) {
        toast.success(
          editingProduct ? 'Producto actualizado' : 'Producto creado'
        );
        setShowModal(false);
        fetchProducts();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al guardar producto');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar producto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Producto eliminado');
        fetchProducts();
      } else {
        toast.error('Error al eliminar producto');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar producto');
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
            <h1 className="text-4xl font-bold text-gray-900">Gestionar Productos</h1>
          </div>
          <Button
            onClick={openCreateModal}
            className="bg-[#60B5FF] hover:bg-[#4A9FE8] gap-2"
          >
            <Plus className="h-5 w-5" />
            Nuevo Producto
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products?.map?.((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="relative aspect-square w-full mb-4 rounded-md overflow-hidden bg-gray-100">
                {product?.images?.[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    Sin imagen
                  </div>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {product.description}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Categoría: {product?.category?.name}
              </p>
              <p className="text-xl font-bold text-[#60B5FF] mb-2">
                ${product.price?.toFixed?.(2) ?? '0.00'}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Stock: {product.stock}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => openEditModal(product)}
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  onClick={() => handleDelete(product.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
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
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
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
                  placeholder="Nombre del producto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#60B5FF]"
                  placeholder="Descripción del producto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock
                  </label>
                  <Input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#60B5FF]"
                >
                  <option value="">Selecciona una categoría</option>
                  {categories?.map?.((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  )) || null}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imágenes
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-4">
                    {uploading ? 'Subiendo...' : 'Sube imágenes del producto'}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      className="cursor-pointer"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      Seleccionar Imágenes
                    </Button>
                  </label>
                </div>
                {uploadedImages?.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-gray-100">
                        <Image src={img} alt={`Preview ${idx}`} fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => setUploadedImages(uploadedImages.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  {editingProduct ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
