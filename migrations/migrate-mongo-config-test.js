import baseConfig from "#migrations/baseConfig.js";

const config = {
  connString: process.env.MONGODB_CONNSTRING_TEST,
  dbName: process.env.MONGODB_DB_TEST
}

export default baseConfig(config);
