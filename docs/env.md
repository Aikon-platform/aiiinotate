# Managing and using env variables

## In general

Env variables must be stored in a `.env` file that contains the same variables as the one in `config/.env.template`. 

All commands except testing are launched through the CLI. We leverage that to load env files at CLI level, making them accessible to the app and all processes initiated from the CLI:
- the CLI requires a global option `--env` with a path to your env file. 
- when defining the CLI, a lifecycle hook is used: `preAction`. After the CLI has been run, but before any action has been run, `cli.hook("preAction")` is used to load all env variables using `dotenvx`.
- within the subcommand's `action` hook, and the rest of app, the env variables will now be defined.
- this circumvents a limitation of `commander` (our CLI library) that does not allow passing global options to subcommands. It also allows to load directly all env variables at the root of the script, instead of having to redo it in each subcommand.

Testing is the only command that doesn't use the CLI. We use `dotenvx` to load the env variables and pass them to the tested functions:

```bash
dotenvx run -f ./config/.env -- node --test --test-isolation=none
```

## In dev

In dev, your `.env` file must be located at `$root/config/.env`.

## In prod

In prod, use the `--env` option to specify the path to your env variable.
