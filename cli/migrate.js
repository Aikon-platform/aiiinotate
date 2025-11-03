/**
 * run and apply migrations
 */
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process"

import { Command, Option, Argument } from "commander";

import { fileRead } from "#cli/io.js";


/** @typedef {"make"|"apply"|"revert"|"revert-all"} migrateOpType */
const allowedMigrateOp = ["make", "apply", "revert", "revert-all"];

const
  // path to current dirctory
  dirCli = path.dirname(fileURLToPath(import.meta.url)),
  dirRoot = path.resolve(dirCli, ".."),
  dirMigrations = path.resolve(dirRoot, "migrations"),
  fileMigrationsConfigMain = path.resolve(dirMigrations, "migrate-mongo-config-main.js"),
  fileMigrationsConfigTest = path.resolve(dirMigrations, "migrate-mongo-config-test.js"),
  fileMigrationConfigs = [fileMigrationsConfigMain, fileMigrationsConfigTest];

console.log(fileMigrationConfigs);

function formatDate(date) {
  function pad2(n) {  // always returns a string
    return (n < 10 ? '0' : '') + n;
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
  console.log("!!!!!!!!!! migrateMake", migrationName);

  if ( migrationName == null ) {
    throw new Error(`migration name must be a string. got ${migrationName}`);
  }
  fs.copyFileSync(
    path.resolve(dirMigrations, "migrationTemplate.js"),
    path.resolve(dirMigrations, "migrationScripts", `${formatDate(new Date())}-migrationName.js`)
  );
}

/** apply a migration */
function migrateApply() {
  console.log("!!!!!!!!!! migrateApply");

}

function migrateApplyAll() {
  console.log("!!!!!!!!!! migrateApplyAll");

}

function migrateRevert() {
  console.log("!!!!!!!!!! migrateRevert");

}

function migrateRevertAll() {
  console.log("!!!!!!!!!! migrateRevertAll");

}

/**
 * run the cli
 * @param {import('mongodb').MongoClient} mongoClient
 * @param {import('commander').Command} command
 * @param {migrateOpType} mongoClient
 * @param {object} options
 */
function action(mongoClient, command, migrationOp, options) {
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

function makeMigrateCommand(mongoClient) {
  const migrationOpArg =
    new Argument("<migration-op>", "name of migration operation").choices(allowedMigrateOp);

  const migrationNameOpt =
    new Option("-n", "--migration-name", "name of migration (for 'make' argument)");

  return new Command("migrate")
    .description("run database migrations")
    .addArgument(migrationOpArg)
    .addOption(migrationNameOpt)
    .action((migrationOp, options, command) => action(mongoClient, command, migrationOp, options))
}

export default makeMigrateCommand;