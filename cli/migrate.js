/**
 * run and apply migrations.
 *
 * the commands here are wrappers for migrate-mongo.
 * the big particularity is that we handle 2 databases in parrallel:
 * a dev/prod database and a test database (that will be populated
 * by running tests, emptied after running the tests)
 * in turn, we need to apply migrations in parrallel to both databases.
 *
 */
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process"

import { Command, Option, Argument } from "commander";

import loadMongoClient from "#cli/utils/mongoClient.js";


/** @typedef {"make"|"apply"|"revert"|"revert-all"} MigrateOpType */
const allowedMigrateOp = ["make", "apply", "revert", "revert-all"];

const
  // path to current dirctory
  dirCli = path.dirname(fileURLToPath(import.meta.url)),
  dirRoot = path.resolve(dirCli, ".."),
  dirMigrations = path.resolve(dirRoot, "migrations"),
  dirMigrationsScripts = path.resolve(dirMigrations, "migrationScripts"),
  migrationsConfigMain = path.resolve(dirMigrations, "migrate-mongo-config-main.js"),
  migrationsConfigTest = path.resolve(dirMigrations, "migrate-mongo-config-test.js"),
  migrationConfigs = [migrationsConfigMain, migrationsConfigTest];

/** return a date in YYYYMMDDhhmmss format */
function formatDate(date) {
  function pad2(n) {  // always returns a string
    return (n < 10 ? "0" : "") + n;
  }

  return date.getFullYear() +
    pad2(date.getMonth() + 1) +
    pad2(date.getDate()) +
    pad2(date.getHours()) +
    pad2(date.getMinutes()) +
    pad2(date.getSeconds());
}

/**
 * create a single migration file
 * @param {string} migrationName
 */
function migrateMake(migrationName) {
  if ( migrationName == null ) {
    throw new Error(`migration name must be a string. got ${migrationName}`);
  }
  fs.copyFileSync(
    path.resolve(dirMigrations, "migrationTemplate.js"),
    path.resolve(dirMigrationsScripts, `${formatDate(new Date())}-${migrationName}.js`)
  );
}

/** apply all pending migrations */
function migrateApply() {
  migrationConfigs.map((mc) => execSync(`npx migrate-mongo up -f ${mc}`));
}

/** revert the last migration */
function migrateRevert() {
  migrationConfigs.map((mc) => execSync(`npx migrate-mongo down -f ${mc}`));
}

/** revert all migrations */
function migrateRevertAll() {
  // there are as many migrations as there are files in `dirMigrationsScripts`
  // => revert one migration per migration file
  // do this for each migration file (prod and test database).
  migrationConfigs.map((mc) =>
    fs.readdirSync(dirMigrationsScripts).map((_) =>
      execSync(`npx migrate-mongo down -f ${mc}`)
    )
  )
}

/**
 * run the cli
 * @param {import('commander').Command} command
 * @param {MigrateOpType} mongoClient
 * @param {object} options
 */
async function action(command, migrationOp, options) {
  const { migrationName } = options;

  switch (migrationOp) {
    case ("make"):
      migrateMake(migrationName);
      break;
    case ("apply"):
      migrateApply();
      break;
    case ("revert"):
      migrateRevert();
      break;
    case ("revert-all"):
      migrateRevertAll();
      break;
  }
}

function makeMigrateCommand() {
  const migrationOpArg =
    new Argument("<migration-op>", "name of migration operation").choices(allowedMigrateOp);

  const migrationNameOpt =
    new Option("-n, --migration-name <name>", "name of migration (for 'make' argument)");

  return new Command("migrate")
    .description("run database migrations")
    .addArgument(migrationOpArg)
    .addOption(migrationNameOpt)
    .action((migrationOp, options, command) => action(command, migrationOp, options))
}

export default makeMigrateCommand;