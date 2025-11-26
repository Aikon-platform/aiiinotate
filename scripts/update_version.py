import re
import sys
import json
import shutil
import pathlib

curdir = pathlib.Path(__file__).parent.resolve()
pkg_file = curdir.parent.joinpath("package.json").resolve()
pkg_lock_file = curdir.parent.joinpath("package-lock.json").resolve()

usage = "\nupdate_version.py: CLI to update NPM version.\nUSAGE: \n\tpython3 update_version.py [VERSION]\n"

if len(sys.argv) != 2:
    print(usage)
    exit()

version = sys.argv[1]
if not re.search(r"^\d+\.\d+\.[^\s]+$", version):
    print(r"argument VERSION must match '^\d+\.\d+\.[^\s]+$' (i.e. '0.2.1', '1.3.4fix'). exiting...")
    exit()

for fp in [pkg_file, pkg_lock_file]:
    shutil.copy2(fp, f"{fp}.bak")
    with open(fp, mode="r") as fh:
        data = json.load(fh)
    data["version"] = version
    with open(fp, mode="w") as fh:
        json.dump(data, fh, indent=2)

print(f"\nUpdated NPM package to version: {version}.")