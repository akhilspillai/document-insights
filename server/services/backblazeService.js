import B2 from 'backblaze-b2';
import { v4 as uuidv4 } from 'uuid';

let b2 = null;
let authData = null;

async function getB2Client() {
  if (!b2) {
    b2 = new B2({
      applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
      applicationKey: process.env.B2_APPLICATION_KEY,
    });
  }

  if (!authData) {
    authData = await b2.authorize();
  }

  return { b2, authData };
}

export async function uploadFile(fileBuffer, originalFilename, mimeType) {
  const { b2 } = await getB2Client();
  const bucketId = process.env.B2_BUCKET_ID;

  if (!bucketId) {
    throw new Error('B2_BUCKET_ID environment variable is not set');
  }

  // Get upload URL
  const uploadUrlResponse = await b2.getUploadUrl({
    bucketId,
  });

  // Generate unique filename to avoid collisions
  const fileExtension = originalFilename.split('.').pop();
  const uniqueFilename = `${uuidv4()}-${Date.now()}.${fileExtension}`;

  // Upload the file
  const uploadResponse = await b2.uploadFile({
    uploadUrl: uploadUrlResponse.data.uploadUrl,
    uploadAuthToken: uploadUrlResponse.data.authorizationToken,
    fileName: uniqueFilename,
    data: fileBuffer,
    mime: mimeType,
    info: {
      originalFilename: originalFilename,
      uploadedAt: new Date().toISOString(),
    },
  });

  return {
    fileId: uploadResponse.data.fileId,
    fileName: uploadResponse.data.fileName,
    originalFilename,
    contentLength: uploadResponse.data.contentLength,
    contentType: uploadResponse.data.contentType,
    uploadTimestamp: uploadResponse.data.uploadTimestamp,
  };
}

export async function getFileUrl(fileName) {
  const { authData } = await getB2Client();
  const bucketName = process.env.B2_BUCKET_NAME;

  if (!bucketName) {
    throw new Error('B2_BUCKET_NAME environment variable is not set');
  }

  return `${authData.data.downloadUrl}/file/${bucketName}/${fileName}`;
}
