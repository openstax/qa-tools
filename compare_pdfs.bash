#!/bin/bash
# set -e

# https://stackoverflow.com/questions/5947742/how-to-change-the-output-color-of-echo-in-linux
if [[ $(tput colors) -ge 8 ]]; then
  declare -x c_red=$(tput setaf 1)
  declare -x c_green=$(tput setaf 2)
  declare -x c_blue=$(tput setaf 4)
  declare -x c_purple=$(tput setaf 5)
  declare -x c_dark=$(tput setaf 8)
  declare -x c_yellow=$(tput setaf 11)
  declare -x c_cyan=$(tput setaf 14)
  declare -x c_none=$(tput sgr0) # Keep this last so TRACE=true does not cause everything to be cyan
fi

_say() { echo -e "$1"; }
yell() { >&2 _say "$0: ${c_red}$*${c_none}"; }
die() {
  yell "$1"
  exit 111
}
try() { "$@" || die "${c_red}ERROR: could not run [$*]${c_none}"; }


function compare_page() {
    a=$1
    b=$2
    c=$3

    differences=$(compare -metric AE ${b} ${a} ${c} 2>&1)

    if [[ ${differences} != 0 ]]; then
        echo "Differences found! ${differences} between '${a}' and '${b}'. See them here: '${c}'"

        # https://stackoverflow.com/a/33673440
        try convert '(' ${a} -flatten -grayscale Rec709Luminance ')' \
                '(' ${b} -flatten -grayscale Rec709Luminance ')' \
                '(' -clone 0-1 -compose darken -composite ')' \
                -channel RGB -combine ${c}
    else
        echo -n "."
    fi
}


# Diff 2 pdfs:

base_pdf=$1
new_pdf=$2
max_pages=$3

if [[ $1 == '' ]]; then
    echo "Usage: /path/to/base.pdf /path/to/new.pdf 1000"
    echo "the last argument is optional and specifies the maximum number of pages to compare"
    exit 0
fi

# Make sure the prerequisite commands have been installed
function ensure_installed() {
    [[ $(command -v $1) != '' ]] || die "ERROR: Install '$1' before continuing"    
}
ensure_installed pdftoppm
ensure_installed convert



base_dir=$(mktemp -d 2>/dev/null || mktemp -d -t 'pdfcompare_base')
new_dir=$(mktemp -d 2>/dev/null || mktemp -d -t 'pdfcompare_new')

function split_pdf_to_images() {
    local the_pdf=$1
    local the_dir=$2

    local last_a=""
    local last_b=""
    if [[ ${max_pages} != '' ]]; then
        last_a="-l"
        last_b=${max_pages}
    fi

    echo "Splitting '${the_pdf}' into images"
    try pdftoppm -f 1 ${last_a} ${last_b} "${the_pdf}" "${the_dir}/page" -png -rx 150 -ry 150
}

function compare_images() {
    echo "Comparing images"
    for filename in $(ls "${base_dir}"); do
        compare_page "${base_dir}/${filename}" "${new_dir}/${filename}" /tmp/pdf-diff.png
    done
}

if [[ ${max_pages} == '' ]]; then
    echo "If this takes too long you can specify the max number of pages as an additional argument"
fi

split_pdf_to_images "${base_pdf}" "${base_dir}"
split_pdf_to_images  "${new_pdf}"  "${new_dir}"
compare_images

