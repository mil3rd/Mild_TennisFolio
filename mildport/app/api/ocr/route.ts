/* OCR route — runs Tesseract.js server-side (Node.js) */

function extractDate(text: string): string | undefined {
  // DD/MM/YYYY or DD-MM-YYYY
  const slash = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
  if (slash) {
    const [, d, m, y] = slash;
    const dt = new Date(+y, +m - 1, +d);
    if (!isNaN(dt.getTime()))
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // "12 March 2023" / "March 12, 2023"
  const months: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04",
    may: "05", june: "06", july: "07", august: "08",
    september: "09", october: "10", november: "11", december: "12",
    jan: "01", feb: "02", mar: "03", apr: "04",
    jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  const wordDate = text.match(
    /\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})\b/i
  );
  if (wordDate) {
    const [, d, mon, y] = wordDate;
    const m = months[mon.toLowerCase()];
    return `${y}-${m}-${d.padStart(2, "0")}`;
  }

  // Month DD, YYYY
  const wordDate2 = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2}),?\s+(\d{4})\b/i
  );
  if (wordDate2) {
    const [, mon, d, y] = wordDate2;
    const m = months[mon.toLowerCase()];
    return `${y}-${m}-${d.padStart(2, "0")}`;
  }

  return undefined;
}

function extractAward(lines: string[]): string | undefined {
  const patterns =
    /\b(1st|first|champion|winner|gold|2nd|second|runner.?up|silver|3rd|third|bronze)\b/i;
  for (const line of lines) {
    if (patterns.test(line)) {
      return line.trim().replace(/\s+/g, " ");
    }
  }
  return undefined;
}

function extractTitle(lines: string[]): string | undefined {
  const patterns =
    /\b(open|championship|cup|tournament|invitational|masters|circuit|series|league)\b/i;
  for (const line of lines) {
    if (patterns.test(line)) {
      const t = line.trim().replace(/\s+/g, " ");
      if (t.length > 4 && t.length < 120) return t;
    }
  }
  return undefined;
}

function extractCategory(lines: string[]): string | undefined {
  const patterns =
    /\b(singles|doubles|u10|u12|u14|u16|u18|under\s*\d+|boys|girls|junior|men|women|mixed)\b/i;
  for (const line of lines) {
    if (patterns.test(line)) {
      return line.trim().replace(/\s+/g, " ");
    }
  }
  return undefined;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Dynamic import keeps tesseract.js out of the main bundle
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker(["eng", "tha"]);

    let rawText = "";
    try {
      const { data } = await worker.recognize(buffer);
      rawText = data.text ?? "";
    } finally {
      await worker.terminate();
    }

    const lines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const extracted: {
      title?: string;
      award?: string;
      eventDate?: string;
      category?: string;
    } = {
      eventDate: extractDate(rawText),
      award: extractAward(lines),
      title: extractTitle(lines),
      category: extractCategory(lines),
    };

    return Response.json({ text: rawText, extracted });
  } catch (err) {
    console.error("POST /api/ocr error:", err);
    return Response.json({ error: "OCR processing failed" }, { status: 500 });
  }
}
