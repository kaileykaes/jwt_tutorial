import { MongoClient } from "https://deno.land/x/mongo@v0.30.0/mod.ts"

const client = new MongoClient();

const dbString = "mongodb://127.0.0.1:27017/"

await client.connect(dbString)

console.log("Database connected!");

const db = client.database("deno-auth");

export default db;
