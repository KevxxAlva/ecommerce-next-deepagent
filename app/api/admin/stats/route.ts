import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Total revenue
    const orders = await prisma.order.findMany({
      where: {
        status: {
          not: "CANCELLED",
        },
      },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    // Total orders
    const totalOrders = await prisma.order.count();

    // Total products
    const totalProducts = await prisma.product.count();

    // Total users
    const totalUsers = await prisma.user.count();

    // Top selling products
    const topProducts = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    });

    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
          },
        });
        return {
          ...product,
          totalSold: item._sum?.quantity ?? 0,
        };
      })
    );

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Sales by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    const stats = {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalUsers,
      topProducts: topProductsWithDetails,
      recentOrders,
      ordersByStatus,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
