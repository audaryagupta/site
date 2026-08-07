import { NextResponse } from "next/server";
import { Readable } from "stream";
import { PDFDocument } from "pdf-lib";
import { guard } from "@/lib/adminApi";
import { logActivity } from "@/lib/activity";
import { ensureDriveFolder, getDrive, googleConfigured } from "@/lib/google";

export const dynamic = "force-dynamic";

const A4 = { width: 595.28, height: 841.89 }; // points

/**
 * Builds a flattened A4 PDF from a single rasterised page image. Because the
 * whole page (letter text + signature + seal + watermark) is baked into one
 * image, none of it — signature or seal included — is selectable or copyable.
 */
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;

  const { imageDataUrl, title, saveToDrive } = (await req.json()) as {
    imageDataUrl?: string;
    title?: string;
    saveToDrive?: boolean;
  };

  if (!imageDataUrl || !imageDataUrl.startsWith("data:image/png")) {
    return NextResponse.json(
      { error: "A PNG page image is required." },
      { status: 400 }
    );
  }

  const base64 = imageDataUrl.split(",")[1] || "";
  const pngBytes = Buffer.from(base64, "base64");

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([A4.width, A4.height]);
  const png = await pdf.embedPng(pngBytes);
  page.drawImage(png, { x: 0, y: 0, width: A4.width, height: A4.height });

  pdf.setTitle(title || "Letterhead");
  pdf.setProducer("byAudarya Studio");
  const bytes = await pdf.save();

  await logActivity("letterhead.created", title ? `“${title}”` : "Letterhead");

  // Optionally archive a copy to Google Drive.
  let driveFileId: string | null = null;
  if (saveToDrive && (await googleConfigured())) {
    try {
      const folderId = await ensureDriveFolder("byAudarya — Letterheads");
      const drive = await getDrive();
      const safe = (title || "letterhead").replace(/[^\w-]+/g, "-");
      const created = await drive.files.create({
        requestBody: {
          name: `${safe}-${Date.now()}.pdf`,
          parents: [folderId],
        },
        media: {
          mimeType: "application/pdf",
          body: Readable.from(Buffer.from(bytes)),
        },
        fields: "id",
      });
      driveFileId = created.data.id || null;
    } catch {
      // Non-fatal: still return the PDF for download.
    }
  }

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${(title || "letterhead").replace(/[^\w-]+/g, "-")}.pdf"`,
      "X-Drive-File-Id": driveFileId || "",
    },
  });
}
