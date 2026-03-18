// one of: "dev"|"prod"|"cli"|"test"
const TARGET = process.env.AIIINOTATE_TARGET || "app";
const STRICT_MODE = process.env.AIIINOTATE_STRICT_MODE?.toLowerCase() === "true";
const PAGE_SIZE = parseInt(process.env.AIIINOTATE_PAGE_SIZE);

const PORT = process.env.AIIINOTATE_PORT;
const HOST = process.env.AIIINOTATE_HOST;
const SCHEME = process.env.AIIINOTATE_SCHEME;
const BASE_URL = process.env.AIIINOTATE_BASE_URL;

const MONGODB_DB = process.env.MONGODB_DB;
const MONGODB_DB_TEST = process.env.MONGODB_DB_TEST;
const MONGODB_CONNSTRING = process.env.MONGODB_CONNSTRING;
const MONGODB_CONNSTRING_TEST = process.env.MONGODB_CONNSTRING_TEST;

export {
  TARGET,
  STRICT_MODE,
  PAGE_SIZE,
  PORT,
  HOST,
  SCHEME,
  BASE_URL,
  MONGODB_DB,
  MONGODB_DB_TEST,
  MONGODB_CONNSTRING,
  MONGODB_CONNSTRING_TEST,
}
