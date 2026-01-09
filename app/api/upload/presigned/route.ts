import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserById } from "@/lib/supabase/database";
import { generatePresignedUploadUrl } from "@/lib/s3";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const dbUser = await getUserById(user.id);
    if (!dbUser || dbUser.role !== 'ADMIN') {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { fileName, contentType } = body;

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "Faltan parámetros" },
        { status: 400 }
      );
    }

    const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(
      fileName,
      contentType,
      true // isPublic
    );

    return NextResponse.json({ uploadUrl, cloud_storage_path });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Error al generar URL" },
      { status: 500 }
    );
  }
}
