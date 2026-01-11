/**
 * Convert common Google Drive share URLs to a direct file URL usable in <img src="...">.
 *
 * Notes:
 * - The file must be shared publicly ("Anyone with the link") for the image to load.
 * - Folder URLs cannot be converted to an image URL.
 */
export function convertGoogleDriveImageUrl(input: string): string {
  const raw = String(input ?? '').trim();
  if (!raw) return raw;

  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(raw);
  const candidate = hasScheme ? raw : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return raw;
  }

  const protocol = url.protocol.toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') return raw;

  const host = url.hostname.toLowerCase();
  const isGoogleDrive =
    host === 'drive.google.com' ||
    host.endsWith('.drive.google.com') ||
    host === 'docs.google.com' ||
    host.endsWith('.docs.google.com');

  if (!isGoogleDrive) return raw;

  // Ignore folders (not directly embeddable as images)
  if (url.pathname.includes('/folders/') || url.pathname.includes('/drive/folders/')) {
    return raw;
  }

  let fileId: string | null = null;

  // https://drive.google.com/file/d/<id>/view
  const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
  if (fileMatch?.[1]) fileId = fileMatch[1];

  // https://drive.google.com/open?id=<id>
  if (!fileId) {
    const idParam = url.searchParams.get('id');
    if (idParam) fileId = idParam;
  }

  // Some docs.google.com links are /d/<id>/...
  if (!fileId) {
    const docMatch = url.pathname.match(/\/d\/([^/]+)/);
    if (docMatch?.[1]) fileId = docMatch[1];
  }

  if (!fileId) return raw;

  const normalizedId = fileId.trim();
  if (!/^[a-zA-Z0-9_-]{10,}$/.test(normalizedId)) return raw;

  const direct = new URL('https://drive.google.com/uc');
  direct.searchParams.set('export', 'view');
  direct.searchParams.set('id', normalizedId);

  return direct.toString();
}

