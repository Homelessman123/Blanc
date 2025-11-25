type UploadParams = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  courseId?: string;
};

type UploadResult = {
  fileId: string;
  fileName: string;
  mimeType: string;
  viewUrl: string;
  downloadUrl: string;
};

/**
 * Upload media to Google Apps Script Web App.
 */
export const uploadMediaViaAppsScript = async (params: UploadParams): Promise<UploadResult> => {
  const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!appsScriptUrl) {
    throw new Error('GOOGLE_APPS_SCRIPT_URL is not configured');
  }

  const base64 = params.buffer.toString('base64');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  let response;
  try {
    response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64,
        fileName: params.fileName,
        mimeType: params.mimeType,
        courseId: params.courseId || 'course',
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  let data: any;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error('Apps Script trả về phản hồi không phải JSON');
  }

  if (!response.ok || !data?.ok) {
    const errorMessage = data?.error || `Apps Script upload failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return {
    fileId: data.fileId,
    fileName: data.fileName,
    mimeType: data.mimeType,
    viewUrl: data.viewUrl || '',
    downloadUrl: data.downloadUrl || '',
  };
};
