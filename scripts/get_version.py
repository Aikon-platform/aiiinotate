import re
import sys
import json
import shutil
import pathlib

curdir = pathlib.Path(__file__).parent.resolve()
pkg_file = curdir.parent.joinpath("package.json").resolve()

with open(pkg_file, mode="r") as fh:
    data = json.load(fh)
    print(f"\naiiinotate current version: {data['version']}\n")
