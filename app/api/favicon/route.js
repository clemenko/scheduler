import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Setting from '@/lib/models/Setting';

export async function GET() {
  try {
    await dbConnect();
    const settings = await Setting.findOne();
    const logoUrl = settings?.logoUrl;

    if (!logoUrl) {
      return new NextResponse(null, { status: 404 });
    }

    // Parse base64 data URI: data:<mime>;base64,<data>
    const match = logoUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return new NextResponse(null, { status: 400 });
    }

    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];
    const mimeType = match[1];
    if (!allowedMimeTypes.includes(mimeType)) {
      return new NextResponse(null, { status: 400 });
    }
    const buffer = Buffer.from(match[2], 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
