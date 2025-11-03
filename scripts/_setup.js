#!usr/bin/env node
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { MongoClient } from "mongodb";

const
  // path to dirctory of curent file
  dirScripts = path.dirname(fileURLToPath(import.meta.url)),
  dirRoot = path.resolve(dirScripts, ".."),
  dirMigrations = path.resolve(dirRoot, "migrations");

const connString = process.env.MONGODB_CONNSTRING;

(async () => {
  let client;
  try {
    client = new MongoClient(connString);
    await client.connect();
    console.log("CONNECTED !")
    console.log(dirScripts);
    console.log(dirRoot);
    console.log(dirMigrations);
  } finally {
    if ( client != null ) {
      client.close()
    }
  }
}
)();