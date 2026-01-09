import { NextResponse } from "next/server";
import { getOrdersByUser, getDB } from "@/lib/supabase/database";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const orders = await getOrdersByUser(user.id);
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Error al obtener órdenes" },
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
    const { items, shippingDetails, total } = body;

    // 1. Create Order
    const { data: order, error: orderError } = await getDB()
      .from('Order')
      .insert({
        userId: user.id,
        status: 'PENDING',
        total,
        shippingName: shippingDetails.name,
        shippingEmail: shippingDetails.email,
        shippingAddress: shippingDetails.address,
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Create Order Items
    const orderItems = items.map((item: any) => ({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await getDB()
      .from('OrderItem')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // 3. Clear Cart (optional, but expected flow)
    await getDB().from('CartItem').delete().eq('userId', user.id);

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Error al crear orden" },
      { status: 500 }
    );
  }
}
