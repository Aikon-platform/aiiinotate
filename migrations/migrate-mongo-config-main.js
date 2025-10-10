import baseConfig from "#migrations/baseConfig.js";

const config = {
  connString: process.env.MONGODB_CONNSTRING,
  dbName: process.env.MONGODB_DB
}

export default baseConfig(config);
