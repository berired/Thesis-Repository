import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run make-admin -- <email>");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const rows = await sql`
  UPDATE "user" SET role = 'admin' WHERE email = ${email} RETURNING email, role
`;

if (rows.length === 0) {
  console.error(`No user found with email ${email}. Sign up first.`);
  process.exit(1);
}
console.log(`Promoted ${rows[0].email} to ${rows[0].role}`);
