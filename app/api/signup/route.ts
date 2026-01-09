import { NextResponse } from "next/server";
import { getUserByEmail, createUser } from "@/lib/supabase/database";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, id } = body;

    if (!email || (!password && !id)) {
      return NextResponse.json(
        { error: "Email y contraseña (o ID) son requeridos" },
        { status: 400 }
      );
    }

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      );
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const user = await createUser({
      id: id || undefined,
      email,
      password: hashedPassword,
      name: name || undefined,
      role: "CUSTOMER",
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    );
  }
}
