
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config();

const url = process.env.TURSO_CONNECTION_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log("Checking database connection...");
console.log("URL:", url);
console.log("Token length:", authToken?.length);

if (!url) {
  console.error("Error: TURSO_CONNECTION_URL is missing");
  process.exit(1);
}

const client = createClient({
  url,
  authToken,
});

async function check() {
  try {
    const result = await client.execute("SELECT 1");
    console.log("Connection successful!");
    console.log("Result:", result);
  } catch (e) {
    console.error("Connection failed:", e);
  }
}

check();
