// Database helper functions using Supabase client
import { createClient } from './server';

export type Role = 'CUSTOMER' | 'ADMIN';
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  password: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  stock: number;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  total: number;
  shippingName: string;
  shippingEmail: string;
  shippingAddress: string;
  stripePaymentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  createdAt: Date;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

// Helper to get database client (server-side only)
export function getDB() {
  return createClient();
}

// User operations
export async function getUserById(id: string) {
  const supabase = getDB();
  const { data, error } = await supabase
    .from('User')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as User;
}

export async function getUserByEmail(email: string) {
  const supabase = getDB();
  const { data, error } = await supabase
    .from('User')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data as User | null;
}

export async function createUser(userData: {
  id?: string;
  email: string;
  name?: string;
  password?: string;
  role?: Role;
}) {
  const supabase = getDB();
  const { data, error } = await supabase
    .from('User')
    .insert({
      ...userData,
      role: userData.role || 'CUSTOMER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as User;
}

export async function updateUserRole(id: string, role: Role) {
  const supabase = getDB();
  const { data, error } = await supabase
    .from('User')
    .update({ role, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as User;
}

// Product operations
export async function getProducts(categoryId?: string) {
  const supabase = getDB();
  let query = supabase.from('Product').select('*, category:Category(*)');
  
  if (categoryId) {
    query = query.eq('categoryId', categoryId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getProductById(id: string) {
  const supabase = getDB();
  const { data, error } = await supabase
    .from('Product')
    .select('*, category:Category(*)')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

// Category operations
export async function getCategories() {
  const supabase = getDB();
  const { data, error } = await supabase
    .from('Category')
    .select('*');
  
  if (error) throw error;
  return data as Category[];
}

// Order operations
export async function getOrdersByUser(userId: string) {
  const supabase = getDB();
  const { data, error } = await supabase
    .from('Order')
    .select('*, items:OrderItem(*, product:Product(*))')
    .eq('userId', userId)
    .order('createdAt', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getOrderById(id: string) {
  const supabase = getDB();
  const { data, error } = await supabase
    .from('Order')
    .select('*, items:OrderItem(*, product:Product(*)), user:User(*)')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

// Cart operations
export async function getCartItems(userId: string) {
  const supabase = getDB();
  const { data, error } = await supabase
    .from('CartItem')
    .select('*, product:Product(*)')
    .eq('userId', userId);
  
  if (error) throw error;
  return data;
}
