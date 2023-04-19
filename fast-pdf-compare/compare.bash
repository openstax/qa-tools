#!/bin/bash

set -eo pipefail

A="$(realpath "$1")"
B="$(realpath "$2")"


HERE="$(cd "$(dirname "$0")"; pwd)"
A_DIR="$(cd "$(dirname "$A")"; pwd)"
B_DIR="$(cd "$(dirname "$B")"; pwd)"
A_FILE="$(basename "$A")"
B_FILE="$(basename "$B")"
IMAGE_NAME="fast-pdf-compare"

if [[ "$A_DIR" != "$B_DIR" ]]; then
    echo "PDF files need to be in the same directory"
    exit 1
fi

echo "Using dir $A_DIR to compare $A_FILE and $B_FILE" >&2

docker build --tag $IMAGE_NAME --file "$HERE/Dockerfile" "$HERE/."
docker run --rm -it -v "$A_DIR:/compare" -w /compare $IMAGE_NAME "$A_FILE" "$B_FILE"
