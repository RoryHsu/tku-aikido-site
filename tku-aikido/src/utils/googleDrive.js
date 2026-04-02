export function extractGoogleDriveFileId(url = "") {
  if (!url) return "";

  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return "";
}

export function isGoogleDriveUrl(url = "") {
  return url.includes("drive.google.com");
}

export function getGoogleDriveThumbnailUrl(url = "") {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return "";
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
}

export function getGoogleDrivePreviewUrl(url = "") {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return "";
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function getGoogleDriveViewUrl(url = "") {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;
  return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
}

export function resolveMediaThumbnail(item = {}) {
  if (item?.thumbnailUrl) return item.thumbnailUrl;

  if (item?.driveUrl && isGoogleDriveUrl(item.driveUrl)) {
    return getGoogleDriveThumbnailUrl(item.driveUrl);
  }

  return "";
}

export function resolveMediaTargetUrl(item = {}) {
  if (item?.driveUrl && isGoogleDriveUrl(item.driveUrl)) {
    return getGoogleDriveViewUrl(item.driveUrl);
  }

  return item?.driveUrl || "";
}

export function resolveMediaPreviewUrl(item = {}) {
  if (item?.driveUrl && isGoogleDriveUrl(item.driveUrl)) {
    return getGoogleDrivePreviewUrl(item.driveUrl);
  }

  return item?.driveUrl || "";
}