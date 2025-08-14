import { Command, Option, Argument } from "commander";

const cli = new Command();

function makeImportCommand() {
  // argument and option name syntax:
  // --opt-name <requiredVal> => you mst provide a value after --opt-name
  // --opt-name [optionalVal] => if `optionalVal` is not provided, --opt-name will be treated as boolean
  const dataTypeArg = new Argument("<data-type>", "type of data to import")
    .choices([
      "annotation",  // import a single annotation
      "annotation-list",  // import a IIIF 2.x annotationList
      "annotation-page",  // import a IIIF 3.x annotationPage
      "annotation-array",  // import a JSON array of IIIF annotations
      "manifest",  // import a single manifest
      "manifest-array"  // import a json array of manifests
    ]);

  const versionOpt =
    new Option("-i, --iiif-version <version>", "IIIF version")
    .choices(["2", "3"])
    .makeOptionMandatory();

  const fileOpt =
    new Option("-f, --file <file...>", "files to process, either as: space-separated filepath(s) to the JSON(s) OR path to a file containing a list of paths to JSON files to process (1 line per path)")
    .makeOptionMandatory();

  const listFileOpt =
    new Option("-l, --list-file", "--file points to a file containing a list of JSON files to process (1 line per path)")

  return new Command("import")
    .description("import data into aiiinotate")
    .addArgument(dataTypeArg)
    .addOption(versionOpt)
    .addOption(fileOpt)
    .addOption(listFileOpt)
    .action((dataType, iiifVersion, file, listFile) => {
      console.log("dataType", dataType);
      console.log("iiifVersion", iiifVersion);
      console.log("file", file);
      console.log("listFile", listFile);
    })
}

cli
  .name("aiiinotate-cli")
  .description("utility command line interfaces for aiiinotate")
  .addCommand(makeImportCommand());


cli.parse(process.argv);