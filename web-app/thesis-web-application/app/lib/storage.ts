import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = process.env.STORAGE_BUCKET_QR!;

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export async function uploadQrImage(key: string, body: Buffer) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "image/png",
    }),
  );
}

export async function deleteQrImage(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export function getQrImageUrl(key: string, expiresInSeconds = 300) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: expiresInSeconds,
  });
}

// Pet profile photos live in the same private bucket under their own prefix.
export async function uploadPetPhoto(key: string, body: Buffer, contentType: string) {
  await s3.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
  );
}

export async function deletePetPhoto(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export function getPetPhotoUrl(key: string, expiresInSeconds = 300) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: expiresInSeconds,
  });
}

/* ------------------------------------------------------------------ */
/* Private `pet-files` bucket: documents/, vet-uploads/ and photos/.   */
/* Low-level object helpers only; the rules (types, sizes, who may     */
/* upload or read what) live in pet-files.ts.                          */
/* ------------------------------------------------------------------ */

function filesBucket() {
  const name = process.env.STORAGE_BUCKET_FILES;
  if (!name) throw new Error("STORAGE_BUCKET_FILES is not set");
  return name;
}

/** A short-lived URL the browser PUTs the file to. Type and size are part of the signature. */
export function presignFileUpload(
  key: string,
  contentType: string,
  sizeBytes: number,
  expiresInSeconds = 300,
) {
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: filesBucket(),
      Key: key,
      ContentType: contentType,
      ContentLength: sizeBytes,
    }),
    {
      expiresIn: expiresInSeconds,
      signableHeaders: new Set(["content-type", "content-length"]),
    },
  );
}

/** A short-lived URL to read one file. `fileName` makes browsers download it under that name. */
export function presignFileDownload(key: string, fileName?: string, expiresInSeconds = 120) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: filesBucket(),
      Key: key,
      ResponseContentDisposition: fileName
        ? `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`
        : undefined,
    }),
    { expiresIn: expiresInSeconds },
  );
}

/** Stores a file the server made itself (like a resized photo) in the private files bucket. */
export async function putFile(key: string, body: Buffer, contentType: string) {
  await s3.send(
    new PutObjectCommand({ Bucket: filesBucket(), Key: key, Body: body, ContentType: contentType }),
  );
}

/** What is really stored under a key, or null when nothing is. */
export async function headFile(key: string) {
  try {
    const res = await s3.send(new HeadObjectCommand({ Bucket: filesBucket(), Key: key }));
    return { sizeBytes: res.ContentLength ?? 0, contentType: res.ContentType ?? "" };
  } catch (e) {
    const status = (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404) return null;
    throw e;
  }
}

export async function deleteFile(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: filesBucket(), Key: key }));
}
