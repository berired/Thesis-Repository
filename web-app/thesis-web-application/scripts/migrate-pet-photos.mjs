// One-off: moves pet photos saved before Phase 8 (pet-photos/<id>.<ext> in the original bucket,
// full size, with metadata) into the private files bucket as a resized large copy plus a
// thumbnail, and updates the pet. Safe to run more than once: pets already moved are skipped.
//
//   node scripts/migrate-pet-photos.mjs            # uses DATABASE_URL from .env (the stage branch)
//   node scripts/migrate-pet-photos.mjs <petId>     # only that pet
//   DATABASE_URL=<production url> node scripts/migrate-pet-photos.mjs
//
// Needs the same storage settings as the app (.env). Prints what it did and never deletes an
// old photo until the new copies and the database row are saved.
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import sharp from "sharp";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const sql = neon(process.env.DATABASE_URL);
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});
const oldBucket = process.env.STORAGE_BUCKET_QR;
const newBucket = process.env.STORAGE_BUCKET_FILES;
if (!oldBucket || !newBucket) throw new Error("STORAGE_BUCKET_QR and STORAGE_BUCKET_FILES must be set");

const only = process.argv[2] ?? null;
const pets = await sql`
  select id, "photoKey" from pet
  where "photoKey" is not null and "photoKey" not like 'photos/%'
    and (${only}::text is null or id = ${only})`;
console.log(`${pets.length} photo(s) to move`);

for (const pet of pets) {
  try {
    const got = await s3.send(new GetObjectCommand({ Bucket: oldBucket, Key: pet.photoKey }));
    const input = Buffer.from(await got.Body.transformToByteArray());
    const base = () => sharp(input, { limitInputPixels: 50_000_000 }).rotate();
    const large = await base()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const thumb = await base().resize({ width: 256, height: 256, fit: "cover" }).webp({ quality: 80 }).toBuffer();

    const stem = `photos/${pet.id}/${randomUUID()}`;
    const photoKey = `${stem}-large.webp`;
    const photoThumbKey = `${stem}-thumb.webp`;
    for (const [Key, Body] of [[photoKey, large], [photoThumbKey, thumb]]) {
      await s3.send(new PutObjectCommand({ Bucket: newBucket, Key, Body, ContentType: "image/webp" }));
    }
    await sql`update pet set "photoKey" = ${photoKey}, "photoThumbKey" = ${photoThumbKey} where id = ${pet.id}`;
    await s3.send(new DeleteObjectCommand({ Bucket: oldBucket, Key: pet.photoKey }));
    console.log(`moved ${pet.id}: ${pet.photoKey} -> ${photoKey}`);
  } catch (e) {
    console.error(`FAILED ${pet.id} (${pet.photoKey}): ${e.message}. Left as it was.`);
  }
}
