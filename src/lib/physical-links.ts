export function physicalLinks(baseUrl: string, tenantId: string) {
  try {
    const url = new URL(baseUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash || !/^[0-9a-f-]{36}$/i.test(tenantId)) return null;
    return { nfc: `${url.origin}/t/${tenantId}?src=nfc`, qr: `${url.origin}/t/${tenantId}?src=qr` };
  } catch { return null; }
}
