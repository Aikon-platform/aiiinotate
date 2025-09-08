# DATABASE AND MIGRATIONS

---

## Collections

---

## Validation rules

---

## Migrations

Migrations are used to specify changes to the database's structure (creation and deletion of collections and indexes, changes to collection options such as validation rules etc.). Migration is done using [`migrate-mongo`](https://github.com/seppevs/migrate-mongo), a command-line interface for npm. 

*Note that here, migrations only concern changes to the structure, not changes to the data.*

Where things get a bit complicated is that, while in use, our app uses a single database, in **dev mode, our app uses 2 databses**:
- a `main` database (default database that will be put in production)
- a `test` database (empty database to run tests, add dummy data to and so on).

For consistency, `test` must mirror the structure of `main`: same collections, indexes, validation rules etc. So, we must manage our migrations so that **all changes to the structure of `main` are reflected in the structure of `test`**. This is not possible natively through `migrate-mongo`. Managing both databases in parrallel manually would risk a lot of inconsistencies.


Our solution is to automate the management of both databases in parrallel:
- there are **2 migration config files**, one for each database
- both migration config files point to **the same migration scripts folder**, so that both database can apply the same migrations
- execute all migrations by **wrapping `migrate-mongo` in a homemade script**: [`scripts/migrations.sh`](../scripts/migrations.sh).

```
root/
  |__migrations/
       |__migrationScripts              // folder containing all migration scripts. consumed by both migration config files.
       |__baseConfig.js                 // base config file that both config files are derived from
       |__migrate-mongo-config-main.js  // config file for the main db
       |__migrate-mongo-config-test.js  // config file for the test db
```
