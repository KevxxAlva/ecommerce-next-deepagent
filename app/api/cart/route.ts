import { NextResponse } from "next/server";
import { getCartItems, getDB, getProductById } from "@/lib/supabase/database";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const cartItems = await getCartItems(user.id);
    return NextResponse.json(cartItems);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Error al obtener carrito" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, quantity } = body;

    if (!productId || !quantity) {
      return NextResponse.json(
        { error: "Producto y cantidad son requeridos" },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await getProductById(productId);
    if (!product) {
        return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    // Check if item already in cart
    const { data: existingItem, error: fetchError } = await getDB()
      .from('CartItem')
      .select('*')
      .eq('userId', user.id)
      .eq('productId', productId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
        throw fetchError;
    }

    let cartItem;

    if (existingItem) {
      // Update quantity
      const { data, error } = await getDB()
        .from('CartItem')
        .update({
            quantity: existingItem.quantity + quantity,
            updatedAt: new Date().toISOString()
        })
        .eq('id', existingItem.id)
        .select()
        .single();
      
      if (error) throw error;
      cartItem = data;
    } else {
      // Create new item
      const { data, error } = await getDB()
        .from('CartItem')
        .insert({
            userId: user.id,
            productId,
            quantity,
            updatedAt: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      cartItem = data;
    }

    return NextResponse.json(cartItem, { status: 201 });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Error al agregar al carrito" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
  
      if (!user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
  
      const body = await request.json();
      const { itemId, quantity } = body;
  
      if (!itemId || quantity === undefined) {
        return NextResponse.json(
          { error: "ID de item y cantidad son requeridos" },
          { status: 400 }
        );
      }

      if (quantity <= 0) {
           // Delete if quantity is 0 or less
           const { error } = await getDB()
            .from('CartItem')
            .delete()
            .eq('id', itemId)
            .eq('userId', user.id); // Security check
            
           if (error) throw error;
           return NextResponse.json({ message: "Item eliminado" });
      }
  
      const { data: cartItem, error } = await getDB()
        .from('CartItem')
        .update({
            quantity,
            updatedAt: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('userId', user.id)
        .select()
        .single();
  
      if (error) throw error;
  
      return NextResponse.json(cartItem);
    } catch (error) {
      console.error("Error updating cart:", error);
      return NextResponse.json(
        { error: "Error al actualizar carrito" },
        { status: 500 }
      );
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get('itemId');

        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (itemId) {
             const { error } = await getDB()
                .from('CartItem')
                .delete()
                .eq('id', itemId)
                .eq('userId', user.id);
            if (error) throw error;
        } else {
            // Clear entire cart
             const { error } = await getDB()
                .from('CartItem')
                .delete()
                .eq('userId', user.id);
            if (error) throw error;
        }

        return NextResponse.json({ message: "Carrito actualizado" });

    } catch (error) {
        console.error("Error deleting from cart:", error);
        return NextResponse.json({ error: "Error al eliminar del carrito" }, { status: 500 });
    }
}
