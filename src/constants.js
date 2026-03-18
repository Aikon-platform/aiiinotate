import { inspect } from "node:util";

// one of: "dev"|"prod"|"cli"|"test"
const TARGET = process.env.AIIINOTATE_TARGET || "app";
const STRICT_MODE = process.env.AIIINOTATE_STRICT_MODE?.toLowerCase() === "true";
const PAGE_SIZE = parseInt(process.env.AIIINOTATE_PAGE_SIZE);
const LOG_DIR = process.env.AIIINOTATE_LOG_DIR;

const PORT = process.env.AIIINOTATE_PORT;
const HOST = process.env.AIIINOTATE_HOST;
const SCHEME = process.env.AIIINOTATE_SCHEME;
const BASE_URL = process.env.AIIINOTATE_BASE_URL;

const MONGODB_DB = process.env.MONGODB_DB;
const MONGODB_DB_TEST = process.env.MONGODB_DB_TEST;
const MONGODB_CONNSTRING = process.env.MONGODB_CONNSTRING;
const MONGODB_CONNSTRING_TEST = process.env.MONGODB_CONNSTRING_TEST;


// ensure that all env variables are defined.
const env_mapper = {
  TARGET : TARGET,
  STRICT_MODE : STRICT_MODE,
  PAGE_SIZE : PAGE_SIZE,
  LOG_DIR : LOG_DIR,
  PORT : PORT,
  HOST : HOST,
  SCHEME : SCHEME,
  BASE_URL : BASE_URL,
  MONGODB_DB : MONGODB_DB,
  MONGODB_DB_TEST : MONGODB_DB_TEST,
  MONGODB_CONNSTRING : MONGODB_CONNSTRING,
  MONGODB_CONNSTRING_TEST : MONGODB_CONNSTRING_TEST,
}
if ( Object.values(env_mapper).some(e => e==null) ) {
  console.error("SETUP ERROR: Some environment variables are undefined ! Exiting...");
  console.log(inspect(env_mapper));
  process.exit(1);
}

export {
  TARGET,
  STRICT_MODE,
  PAGE_SIZE,
  LOG_DIR,
  PORT,
  HOST,
  SCHEME,
  BASE_URL,
  MONGODB_DB,
  MONGODB_DB_TEST,
  MONGODB_CONNSTRING,
  MONGODB_CONNSTRING_TEST,
}
