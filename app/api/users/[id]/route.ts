import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateUserRole } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // Verify authentication
    if (!currentUser) {
       return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Check if user is admin via database
    const { data: dbUser } = await supabase
        .from('User')
        .select('role')
        .eq('id', currentUser.id)
        .single();

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!role || (role !== "CUSTOMER" && role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Rol inválido" },
        { status: 400 }
      );
    }

    const updatedUser = await updateUserRole(params.id, role);

    return NextResponse.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}

// Keep PUT for backward compatibility if client uses it, but logic is same
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
    return PATCH(request, { params });
}
