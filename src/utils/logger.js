import path from "path";
import fs from "fs";

import pino from "pino";

import { TARGET } from "#constants";

// Create logs directory if it doesn't exist
const LOG_DIR = path.join(process.cwd(), "logs");
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const stdoutLogTarget = {
  level: "debug",
  target: "pino-pretty",
  options: {
    colorize: true,
    singleLine: false,
    translateTime: "SYS:standard",
  },
}
const fileLogTargets = [
  {
    level: "debug",
    target: "pino/file",
    options: { destination: path.join(LOG_DIR, "aiiinotate_debug.log") },
  },
  // {
  //   level: "info",
  //   target: "pino/file",
  //   options: { destination: path.join(LOG_DIR, "info.log") },
  // },
  {
    level: "error",
    target: "pino/file",
    options: { destination: path.join(LOG_DIR, "aiiinotate_error.log") },
  },
]

const makePinoLogger = () => {
  // disable logging when running CLI commands
  // (otherwise, logging from the fastify instance is mixed with logging from the CLI).
  if ( TARGET==="cli" ) {
    return pino({ enabled: false });
  }

  // otherwise, generate a specific logger based on the value of "TARGET"
  const logTarget = {
    test: [stdoutLogTarget],
    dev: [stdoutLogTarget],
    prod: [fileLogTargets]
  }[TARGET];

  return pino({
    level: process.env.LOG_LEVEL || "debug",
    transport: {
      targets: logTarget,
    },
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    }
  })
}

// // Create Pino logger with JSON transports
// const pinoLogger = pino(
//   {
//     level: process.env.LOG_LEVEL || "debug",
//     transport: {
//       targets: envToLogger[TARGET],
//     },
//     serializers: {
//       req: (req) => ({
//         id: req.id,
//         method: req.method,
//         url: req.url,
//       }),
//       res: (res) => ({
//         statusCode: res.statusCode,
//       }),
//     },
//   }
// );

// NOTE : to have environment-specific logger behaviour, see: https://fastify.dev/docs/latest/Reference/Logging/#environment-specific-configuration

// Wrapper for caller information
class Logger {
  constructor() {
    this.pinoLogger = makePinoLogger();
    this.pinoLogger.info(">>>>>>>>>>>>>> HELLO !!");
  }

  _getCaller() {
    const stack = new Error().stack.split("\n");
    const callerLine = stack[3]; // Skip Error, _getCaller, and the actual method
    const match = callerLine.match(/at (.+) \((.+):(\d+):(\d+)\)/);

    if (match) {
      return {
        funcName: match[1],
        module: path.basename(match[2], path.extname(match[2])),
        lineno: parseInt(match[3]),
      };
    }

    return { funcName: "unknown", module: "unknown", lineno: null };
  }

  debug(message, meta = {}) {
    const caller = this._getCaller();
    this.pinoLogger.debug({ ...caller, ...meta }, message);
  }

  info(message, meta = {}) {
    const caller = this._getCaller();
    this.pinoLogger.info({ ...caller, ...meta }, message);
  }

  warn(message, meta = {}) {
    const caller = this._getCaller();
    this.pinoLogger.warn({ ...caller, ...meta }, message);
  }

  error(message, meta = {}) {
    const caller = this._getCaller();
    this.pinoLogger.error({ ...caller, ...meta }, message);
  }

  child(bindings) {
    return this.pinoLogger.child(bindings);
  }
}

const logger = new Logger()

export default logger;
