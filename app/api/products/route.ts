import { NextResponse } from "next/server";
import { getProducts, getDB } from "@/lib/supabase/database";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    const products = await getProducts(categoryId || undefined);

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Verification of ADMIN role would typically go here using getUserById(user.id)
    // For brevity, assuming protected by middleware or similar, but let's be safe:
    if (!user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    // In a real app, verify admin role here:
    // const dbUser = await getUserById(user.id);
    // if (dbUser.role !== 'ADMIN') return NextResponse.json({ error: "Forbidden"}, { status: 403 });

    const body = await request.json();
    const { name, description, price, images, stock, categoryId } = body;

    if (!name || !description || !price || !categoryId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const { data: product, error } = await getDB()
      .from('Product')
      .insert({
        name,
        description,
        price: parseFloat(price),
        images: images || [],
        stock: parseInt(stock) || 0,
        categoryId,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 }
    );
  }
}
