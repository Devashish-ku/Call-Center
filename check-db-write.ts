
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config();

const url = process.env.TURSO_CONNECTION_URL!;
const authToken = process.env.TURSO_AUTH_TOKEN!;

const client = createClient({
  url,
  authToken,
});

async function check() {
  try {
    console.log("Trying to create a test table...");
    await client.execute("CREATE TABLE IF NOT EXISTS _test_table (id INTEGER PRIMARY KEY)");
    console.log("Table created!");
    
    console.log("Trying to insert...");
    await client.execute("INSERT INTO _test_table (id) VALUES (1)");
    console.log("Insert successful!");

    console.log("Trying to drop table...");
    await client.execute("DROP TABLE _test_table");
    console.log("Drop successful!");
    
  } catch (e) {
    console.error("Operation failed:", e);
  }
}

check();
