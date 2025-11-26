import { NextResponse } from "next/server";
import { getVisitWithImage } from "@/app/actions/visit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const visit = await getVisitWithImage(id);

  if (!visit?.image) {
    return new NextResponse(null, { status: 404 });
  }

  const buffer = Buffer.from(visit.image);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
