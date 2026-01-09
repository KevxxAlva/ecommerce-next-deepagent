-- ==============================================================================
-- SCHEMA COMPLETO DE SHOPHUB (POSTGRESQL + SUPABASE)
-- ==============================================================================
-- Este script reinicia/configura la base de datos completa con:
-- 1. Tablas limpias y relaciones
-- 2. Funciones de seguridad (Admin)
-- 3. Políticas RLS (Row Level Security) robustas
-- 4. Triggers automáticos para sincronizar usuarios

-- ⚠️ ADVERTENCIA: Este script está diseñado para ser idempotente (se puede correr varias veces),
-- pero revisa los comandos DROP si tienes datos críticos que no quieras perder.

-- ==============================================================================
-- 1. LIMPIEZA DE LEGADO (Prisma/NextAuth)
-- ==============================================================================
DROP TABLE IF EXISTS "VerificationToken";
DROP TABLE IF EXISTS "Account";
DROP TABLE IF EXISTS "Session";
-- No borramos las tablas principales (User, Product, etc) para no perder datos,
-- pero aseguramos su estructura más abajo.

-- ==============================================================================
-- 2. FUNCIÓN DE SEGURIDAD (ADMIN)
-- ==============================================================================
-- Esta función es el núcleo de la seguridad del panel de administración.
-- Usa SECURITY DEFINER para saltarse RLS y evitar bucles infinitos.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM "User"
    WHERE id = auth.uid()::text
    AND role = 'ADMIN'
  );
END;
$$;

-- ==============================================================================
-- 3. TABLAS Y ESTRUCTURA
-- ==============================================================================

-- Tabla: User (Perfil Público)
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY, -- Coincide con auth.users.id
    "name" TEXT,
    "email" TEXT UNIQUE,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER', -- 'ADMIN' o 'CUSTOMER'
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Eliminar columna password si existe (residuo de migraciones anteriores)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'password') THEN
        ALTER TABLE "User" DROP COLUMN "password";
    END IF;
END $$;

-- Tabla: Category
CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");

-- Tabla: Product
CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "images" TEXT[],
    "stock" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Tabla: Order
CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "total" DOUBLE PRECISION NOT NULL,
    "shippingName" TEXT NOT NULL,
    "shippingEmail" TEXT NOT NULL,
    "shippingAddress" TEXT NOT NULL,
    "stripePaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Tabla: OrderItem
CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "orderId" TEXT NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: CartItem
CREATE TABLE IF NOT EXISTS "CartItem" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) - POLÍTICAS DE ACCESO
-- ==============================================================================

-- 4.1. Habilitar RLS en todas las tablas
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CartItem" ENABLE ROW LEVEL SECURITY;

-- 4.2. Políticas: User
DROP POLICY IF EXISTS "Public profile read" ON "User"; -- Limpieza
DROP POLICY IF EXISTS "Enable read access for own user" ON "User";
DROP POLICY IF EXISTS "Enable read access for admins" ON "User";

-- Usuario ve su propio perfil
CREATE POLICY "Enable read access for own user" ON "User" FOR SELECT USING (auth.uid()::text = id);
-- Admin ve todo (usando is_admin seguro)
CREATE POLICY "Enable read access for admins" ON "User" FOR SELECT USING (is_admin());
-- Usuario actualiza su propio perfil
CREATE POLICY "Enable update access for own user" ON "User" FOR UPDATE USING (auth.uid()::text = id);
-- Insertar (Sync inicial)
CREATE POLICY "Enable insert access for own user" ON "User" FOR INSERT WITH CHECK (auth.uid()::text = id);

-- 4.3. Políticas: Category y Product (Catálogo Público)
DROP POLICY IF EXISTS "Public read access" ON "Category";
DROP POLICY IF EXISTS "Admin write access" ON "Category";
CREATE POLICY "Public read access" ON "Category" FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON "Category" FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Public read access" ON "Product";
DROP POLICY IF EXISTS "Admin write access" ON "Product";
CREATE POLICY "Public read access" ON "Product" FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON "Product" FOR ALL USING (is_admin());

-- 4.4. Políticas: CartItem (Privado del usuario)
DROP POLICY IF EXISTS "Own cart access" ON "CartItem";
CREATE POLICY "Own cart access" ON "CartItem" FOR ALL USING (auth.uid()::text = "userId");

-- 4.5. Políticas: Order (Usuario ve sus compras, Admin ve todo)
DROP POLICY IF EXISTS "Read orders" ON "Order";
CREATE POLICY "Read orders" ON "Order" FOR SELECT USING (auth.uid()::text = "userId" OR is_admin());
-- Crear orden (solo propia)
DROP POLICY IF EXISTS "Create orders" ON "Order";
CREATE POLICY "Create orders" ON "Order" FOR INSERT WITH CHECK (auth.uid()::text = "userId");
-- Actualizar orden (solo Admin, ej: cambiar status)
DROP POLICY IF EXISTS "Update orders" ON "Order";
CREATE POLICY "Update orders" ON "Order" FOR UPDATE USING (is_admin());

-- 4.6. Políticas: OrderItem (Hereda permisos de la Orden)
DROP POLICY IF EXISTS "Read order items" ON "OrderItem";
CREATE POLICY "Read order items" ON "OrderItem" FOR SELECT USING (
    EXISTS (SELECT 1 FROM "Order" WHERE id = "OrderItem"."orderId" AND "userId" = auth.uid()::text)
    OR is_admin()
);
DROP POLICY IF EXISTS "Create order items" ON "OrderItem";
CREATE POLICY "Create order items" ON "OrderItem" FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM "Order" WHERE id = "orderId" AND "userId" = auth.uid()::text)
);

-- ==============================================================================
-- 5. TRIGGER DE SINCRONIZACIÓN AUTOMÁTICA (Opcional pero recomendado)
-- ==============================================================================
-- Esto asegura que cada vez que se cree un usuario en Auth, se cree en public.User
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."User" (id, email, name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'CUSTOMER')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger (si no existe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- 6. REPARACIÓN DE DATOS EXISTENTES (Fix ID Mismatch)
-- ==============================================================================
-- Intenta arreglar tu usuario 'kevinja1406@gmail.com' si está desincronizado
DO $$
DECLARE
  v_auth_id uuid;
  v_old_id text;
BEGIN
  SELECT id INTO v_auth_id FROM auth.users WHERE email = 'kevinja1406@gmail.com';
  SELECT id INTO v_old_id FROM "User" WHERE email = 'kevinja1406@gmail.com';
  
  IF v_auth_id IS NOT NULL AND v_old_id IS NOT NULL AND v_auth_id::text <> v_old_id THEN
      UPDATE "CartItem" SET "userId" = v_auth_id::text WHERE "userId" = v_old_id;
      UPDATE "Order" SET "userId" = v_auth_id::text WHERE "userId" = v_old_id;
      UPDATE "User" SET id = v_auth_id::text, role = 'ADMIN' WHERE email = 'kevinja1406@gmail.com';
  ELSIF v_auth_id IS NOT NULL THEN
      -- Asegurar rol ADMIN para este usuario específico
      UPDATE "User" SET role = 'ADMIN' WHERE email = 'kevinja1406@gmail.com';
  END IF;
END $$;
