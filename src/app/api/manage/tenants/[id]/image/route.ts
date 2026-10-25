import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwnedTenant } from '@/lib/tenants';
import { createAdminClient } from '@/utils/supabase/admin';
import { AccessError } from '@/lib/auth/session';
import { assertSameOrigin, apiError } from '@/lib/api';
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const id = z.uuid().parse((await context.params).id);
    await requireOwnedTenant(id);
    if (Number(req.headers.get('content-length') || 0) > 4_200_000) throw new AccessError(413, 'Use uma imagem de até 4 MB.');
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size > 4_000_000 || file.size === 0) throw new AccessError(400, 'Use uma imagem de até 4 MB.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const png = bytes.slice(0,8).join(',') === '137,80,78,71,13,10,26,10';
    const webp = new TextDecoder().decode(bytes.slice(0,4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8,12)) === 'WEBP';
    if (!jpg && !png && !webp) throw new AccessError(400, 'Use uma imagem JPG, PNG ou WebP.');
    const extension = jpg ? 'jpg' : png ? 'png' : 'webp';
    const contentType = jpg ? 'image/jpeg' : png ? 'image/png' : 'image/webp';
    const admin = createAdminClient();
    const path = `${id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await admin.storage.from('tenant-assets').upload(path, bytes, { contentType, upsert: false });
    if (error) throw error;
    const { data } = admin.storage.from('tenant-assets').getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) { return apiError(error); }
}
