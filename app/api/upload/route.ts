import { v4 as uuidv4 } from "uuid";
import { getDb, images } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 10;

export async function POST(request: Request) {
  try {
    if (!(await isAdminRequest())) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: "Only JPEG, PNG, WebP, and GIF images are accepted" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return Response.json(
        { error: `File size must be under ${MAX_SIZE_MB} MB` },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const bytes = await file.arrayBuffer();
    const data = Buffer.from(bytes).toString("base64");

    const db = getDb();
    await db.insert(images).values({ id, content_type: file.type, data });

    return Response.json({ url: `/api/images/${id}` }, { status: 201 });
  } catch (err) {
    console.error("POST /api/upload error:", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
