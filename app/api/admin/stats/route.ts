import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase/database";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Parallelize queries for admin stats
    const db = getDB();
    
    const [
      { count: usersCount },
      { count: productsCount },
      { count: ordersCount },
      { data: recentOrders }
    ] = await Promise.all([
      db.from('User').select('*', { count: 'exact', head: true }),
      db.from('Product').select('*', { count: 'exact', head: true }),
      db.from('Order').select('*', { count: 'exact', head: true }),
      db.from('Order').select('*').order('createdAt', { ascending: false }).limit(5)
    ]);

    // Revenue calculation (doing in memory for now as sum() in REST is limited without Views/RPC)
    const { data: ordersWithTotal } = await db.from('Order').select('total');
    const totalRevenue = ordersWithTotal?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    return NextResponse.json({
      totalUsers: usersCount || 0,
      totalProducts: productsCount || 0,
      totalOrders: ordersCount || 0,
      totalRevenue,
      recentOrders: recentOrders || []
    });

  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
