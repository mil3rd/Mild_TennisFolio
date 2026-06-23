import { eq } from "drizzle-orm";
import { getDb, images } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const db = getDb();
    const [row] = await db
      .select()
      .from(images)
      .where(eq(images.id, id))
      .limit(1);

    if (!row) {
      return new Response("Image not found", { status: 404 });
    }

    const buf = Buffer.from(row.data, "base64");

    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": row.content_type,
        "Content-Length": String(buf.length),
        // Each image has an immutable UUID URL, so it can be cached forever.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("GET /api/images/[id] error:", err);
    return new Response("Failed to load image", { status: 500 });
  }
}
