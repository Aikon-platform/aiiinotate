#!/bin/env bash

# directory of the current script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
# root of the app
ROOT_DIR=$( dirname "$SCRIPT_DIR" )
# src/ directory
SRC_DIR="$ROOT_DIR/src"

color_echo() {
    Color_Off="\033[0m"
    Red="\033[1;91m"        # Red
    Green="\033[1;92m"      # Green
    Yellow="\033[1;93m"     # Yellow
    Blue="\033[1;94m"       # Blue
    Purple="\033[1;95m"     # Purple
    Cyan="\033[1;96m"       # Cyan

    case "$1" in
        "green") echo -e "$Green$2$Color_Off";;
        "red") echo -e "$Red$2$Color_Off";;
        "blue") echo -e "$Blue$2$Color_Off";;
        "yellow") echo -e "$Yellow$2$Color_Off";;
        "purple") echo -e "$Purple$2$Color_Off";;
        "cyan") echo -e "$Cyan$2$Color_Off";;
        *) echo "$2";;
    esac
}

echo_title(){
    sep_line="========================================"
    len_title=${#1}

    if [ "$len_title" -gt 40 ]; then
        sep_line=$(printf "%0.s=" $(seq 1 $len_title))
        title="$1"
    else
        diff=$((38 - len_title))
        half_diff=$((diff / 2))
        sep=$(printf "%0.s=" $(seq 1 $half_diff))

        if [ $((diff % 2)) -ne 0 ]; then
            title="$sep $1 $sep="
        else
            title="$sep $1 $sep"
        fi
    fi

    color_echo purple "\n\n$sep_line\n$title\n$sep_line"
}

get_os() {
    unameOut="$(uname -s)"
    case "${unameOut}" in
        Linux*)     os=Linux;;
        Darwin*)    os=Mac;;
        CYGWIN*)    os=Cygwin;;
        MINGW*)     os=MinGw;;
        MSYS_NT*)   os=Git;;
        *)          os="UNKNOWN:${unameOut}"
    esac
    echo "${os}"
}

export OS
OS=$(get_os)

# gets a password and validates it by running a dummy cmd.
# parent process must call the function with `get_password || exit` to exit the script if `SUDO_PSW` is invalid
get_password() {
    if [ -z "$SUDO_PSW" ]; then
        read -s -p "Enter your sudo password: " SUDO_PSW
        echo
        echo "$SUDO_PSW" | sudo -S whoami > /dev/null 2>&1
        if [ $? -ne 0 ]; then
            echo "Invalid sudo password. Exiting..."
            return 1
        fi
        return 0
    fi
}

# the sed at the end removes trailing non-alphanumeric chars.
generate_random_string() {
    echo "$(openssl rand -base64 32 | tr -d '/\n' | sed -r -e "s/[^a-zA-Z0-9]+$//")"
}

get_env_value() {
    param=$1
    env_file=$2
    value=$(awk -F= -v param="$param" '/^[^#]/ && $1 == param {gsub(/"/, "", $2); print $2}' "$env_file")
    echo "$value"
}

get_env_desc() {
    current_line="$1"
    prev_line="$2"
    desc=""
    if [[ $prev_line =~ ^# ]]; then
        desc=$(echo "$prev_line" | sed 's/^#\s*//')
    fi
    echo "$desc"
}

ask() {
    options=("yes" "no")
    color_echo blue "$1"
    answer=$(printf "%s\n" "${options[@]}" | fzy)
    echo ""
    if [ "$answer" = "no" ]; then
        exit 1
    fi
}

# float arithmetic comparison is not supported by bash and we need to use `bc`
# usage: if float_comparison "a >= b"; then... ; fi
float_comparison () {
    expr="$1"
    (( $(echo "$expr" |bc -l) ));
}


run_script() {
    local script_name="$1"
    local description="$2"
    local SCRIPT_DIR=${3:-${SCRIPT_DIR}}
    options=("yes" "no")

    color_echo blue "Do you want to run $description?"
    answer=$(printf "%s\n" "${options[@]}" | fzy)
    echo ""
    if [ "$answer" = "yes" ]; then
        bash "$SCRIPT_DIR/$script_name" \
        && color_echo green "$description completed successfully" \
        || color_echo red "$description failed with exit code. Continuing..."
    else
        color_echo cyan "Skipping $description"
    fi
    echo ""
}