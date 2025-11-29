/**
 * Google Apps Script Web App: Receive multipart/form-data and upload a single file to Google Drive.
 *
 * Features:
 *  - Accepts standard multipart/form-data uploads (e.files)
 *  - Sensible fallbacks when Apps Script doesn't parse files (uses e.postData)
 *  - Optional `fileName` and `folder` parameters
 *  - Auto-creates subfolders under a base Drive folder
 *  - Generates collision-resistant, readable file names
 *  - Returns clean JSON envelope with status + result
 *  - Robust error handling + basic logging
 *
 * How to use:
 *  1) Set `DEFAULT_FOLDER_ID` below to the ID of your target Google Drive folder
 *     (or set a script property DRIVE_FOLDER_ID instead).
 *  2) Deploy as Web App (Execute as: Me; Who has access: Anyone with the link).
 *  3) Send POST requests with multipart/form-data.
 *
 * Expected fields:
 *  - file     (binary, multipart/form-data) – preferred field name
 *  - fileName (optional: client-suggested name)
 *  - folder   (optional: logical folder label; will become a subfolder name)
 *
 * Example cURL:
 *  curl -X POST "YOUR_WEBAPP_URL" \
 *       -F "file=@/path/to/local/file.png" \
 *       -F "fileName=my_custom_name.png" \
 *       -F "folder=avatars"
 */

// ---------------------------- Configuration ---------------------------- //

/**
 * Hardcode your Drive folder ID here to avoid Script Properties lookups.
 * Example: const DEFAULT_FOLDER_ID = '1abcDEF...';
 */
const DEFAULT_FOLDER_ID = '1i-mWrEmXXChDdd3dXjr6b55HkFzVJ-Gf';

/**
 * Optional: preferred field names to look for in e.files.
 */
const FILE_FIELD_PREFERENCES = ['file', 'upload', 'data'];

// ---------------------------- Entry Point ------------------------------ //

function doPost(e) {
  try {
    if (!e) {
      return jsonResponse(400, { error: 'Empty request payload.' });
    }

    const params = e.parameter || {};

    // 1) Extract file as a Blob
    const fileBlob = extractFile(e, params);
    if (!fileBlob) {
      return jsonResponse(400, { error: 'Missing file payload.' });
    }

    // 2) Determine target folder
    const folderLabel = sanitizeFolder(params.folder);
    const targetFolder = resolveFolder(folderLabel);
    if (!targetFolder) {
      return jsonResponse(500, { error: 'Target folder could not be resolved or created.' });
    }

    // 3) Build final (safe, unique) file name
    const finalName = buildFileName(params.fileName, fileBlob, folderLabel);

    // 4) Create a copy blob with the new name and save it
    const blobToSave = fileBlob.copyBlob();
    blobToSave.setName(finalName);

    const savedFile = targetFolder.createFile(blobToSave);

    // Make file viewable by link (optional – comment out if not desired)
    try {
      savedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (sharingError) {
      // In some domains, public link sharing might be disabled – log but don't fail the request.
      console.warn('setSharing failed:', sharingError);
    }

    // 5) Build success response
    return jsonResponse(200, {
      id: savedFile.getId(),
      fileName: savedFile.getName(),
      url: savedFile.getUrl(),
      downloadUrl: savedFile.getDownloadUrl(),
      size: savedFile.getSize(),
      mimeType: savedFile.getMimeType(),
      folderId: targetFolder.getId(),
      folder: folderLabel || null
    });
  } catch (err) {
    console.error('doPost error:', err);
    return jsonResponse(500, {
      error: 'Unexpected server error.',
      detail: String(err)
    });
  }
}

// ---------------------------- Core Helpers ----------------------------- //

/**
 * Try to obtain a Blob from the incoming event. Prefer e.files (multipart/form-data),
 * but fall back to e.postData if needed.
 */
function extractFile(e, params) {
  // 1) Standard multipart/form-data: expect e.files
  if (e && e.files) {
    const keys = Object.keys(e.files);
    if (keys.length > 0) {
      // Prefer known field names (file, upload, data) when available
      const preferredKey = FILE_FIELD_PREFERENCES.find(name => keys.indexOf(name) !== -1);
      const fieldKey = preferredKey || keys[0];
      return e.files[fieldKey];
    }
  }

  // 2) Fallback: raw postData (e.g., when Apps Script didn't parse multipart)
  if (e && e.postData && e.postData.contents) {
    const suggestedName = (params && params.fileName) || 'upload.bin';
    const mimeType = e.postData.type || 'application/octet-stream';
    return Utilities.newBlob(e.postData.contents, mimeType, suggestedName);
  }

  return null; // No file found
}

/**
 * Build a safe, collision-resistant file name from requestedName, fileBlob, and folderLabel.
 */
function buildFileName(requestedName, fileBlob, folderLabel) {
  // 1) Base name from client or original blob name
  let baseName;
  if (requestedName && requestedName.length) {
    baseName = String(requestedName);
  } else if (fileBlob && fileBlob.getName && fileBlob.getName()) {
    baseName = fileBlob.getName();
  } else {
    baseName = 'upload.bin';
  }

  // Strip unsafe characters, keep letters, digits, dot, underscore, dash
  baseName = baseName.replace(/[^A-Za-z0-9._-]/g, '_');

  // 2) Split into name + extension
  let extension = '';
  const parts = baseName.split('.');
  if (parts.length > 1) {
    extension = '.' + parts.pop();
  }
  const safeBase = (parts.join('.') || 'upload').slice(0, 80); // guard against absurdly long names

  // 3) Add timestamp + random token for uniqueness
  const stamp = Utilities.formatDate(new Date(), 'UTC', 'yyyyMMdd_HHmmss');
  const token = Utilities.getUuid().replace(/-/g, '').substring(0, 8).toUpperCase();

  // 4) Optional folder prefix in name (purely cosmetic / organizational)
  const prefix = folderLabel ? folderLabel + '_' : '';

  return prefix + safeBase + '_CH-' + stamp + '-' + token + extension;
}

/**
 * Sanitize folder label for use as Drive folder name.
 * Returns null if no label was provided, so the base folder is used directly.
 */
function sanitizeFolder(folder) {
  if (!folder) return null;
  const cleaned = String(folder).trim();
  if (!cleaned) return null;
  return cleaned.replace(/[^A-Za-z0-9_-]/g, '-').toLowerCase();
}

/**
 * Resolve the target Drive folder given a folderLabel.
 * - If folderLabel is null/undefined/empty: return the base folder.
 * - Otherwise, ensure a subfolder under the base folder with that name exists (create if needed).
 */
function resolveFolder(folderLabel) {
  try {
    const baseId = DEFAULT_FOLDER_ID || PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID');
    if (!baseId) {
      console.error('No DEFAULT_FOLDER_ID or DRIVE_FOLDER_ID script property set.');
      return null;
    }

    const baseFolder = DriveApp.getFolderById(baseId);

    if (!folderLabel) {
      return baseFolder;
    }

    const existing = baseFolder.getFoldersByName(folderLabel);
    if (existing.hasNext()) {
      return existing.next();
    }

    // Auto-create subfolder
    return baseFolder.createFolder(folderLabel);
  } catch (err) {
    console.error('resolveFolder error:', err);
    return null;
  }
}

/**
 * Build a JSON response body. Note: Google Apps Script does not support
 * custom HTTP status codes from Web Apps, so `status` is part of the JSON
 * envelope, while the HTTP status itself will typically be 200.
 */
function jsonResponse(statusCode, payload) {
  const body = JSON.stringify({
    status: statusCode,
    result: payload
  });

  return ContentService.createTextOutput(body)
    .setMimeType(ContentService.MimeType.JSON);
}
