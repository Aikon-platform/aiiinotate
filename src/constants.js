import { inspect } from "node:util";

const STRICT_MODE = process.env.AIIINOTATE_STRICT_MODE?.toLowerCase() === "true";
const PAGE_SIZE = parseInt(process.env.AIIINOTATE_PAGE_SIZE);

// one of "file"|"stdout"|"stdout+file"|"off"
const LOG_TARGET = process.env.AIIINOTATE_LOG_TARGET;
const LOG_DIR = process.env.AIIINOTATE_LOG_DIR;

const PORT = process.env.AIIINOTATE_PORT;
const HOST = process.env.AIIINOTATE_HOST;
const SCHEME = process.env.AIIINOTATE_SCHEME;
const BASE_URL = process.env.AIIINOTATE_BASE_URL;
const PUBLIC_URL = process.env.AIIINOTATE_PUBLIC_URL

const MONGODB_DB = process.env.MONGODB_DB;
const MONGODB_DB_TEST = process.env.MONGODB_DB_TEST;
const MONGODB_CONNSTRING = process.env.MONGODB_CONNSTRING;
const MONGODB_CONNSTRING_TEST = process.env.MONGODB_CONNSTRING_TEST;

// ensure that all env variables are defined.
const env_mapper = {
  LOG_TARGET : LOG_TARGET,
  STRICT_MODE : STRICT_MODE,
  PAGE_SIZE : PAGE_SIZE,
  LOG_DIR : LOG_DIR,
  PORT : PORT,
  HOST : HOST,
  SCHEME : SCHEME,
  BASE_URL : BASE_URL,
  PUBLIC_URL : PUBLIC_URL,
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

// enforce value constraints on variables
const allowedLogTargets = ["file", "stdout", "stdout+file", "off"];
if ( !allowedLogTargets.includes(LOG_TARGET) ) {
  console.error(`SETUP ERROR: env variable AIIINOTATE_LOG_TARGET must be set to one of ${allowedLogTargets.map(x => "\"" + x + "\"").join(", ")}. Got "${LOG_TARGET}". Exiting...`)
  process.exit(1);
}

export {
  LOG_TARGET,
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
  PUBLIC_URL
}
