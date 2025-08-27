import dotenv from "dotenv"
import path from "path"

dotenv.config({
  path: [path.join(import.meta.dirname, ".env")]
})

const config = {
  mongodbName: process.env.MONGODB_DB,
  mongodbConnString: `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DB}`
}

export default config
