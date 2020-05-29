# QA Tools

A repository for QA tools and scripts

## Browser Extension

This makes it easier to see content on our pages and link to it.

Future iterations may include a way to do things like "show class names".

Steps to install:

1. Install [TamperMonkey](https://www.tampermonkey.net) or [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
1. Click this link to install the browser extension: https://openstax.github.io/qa-tools/browser-extension.user.js

Users will get updates whenever this file changes (Daily)


## Compare PDFs

[./compare_pdfs.bash](./compare_pdfs.bash) compares 2 PDFs page-by-page by converting each page to an image and then diffing the image.

An optional 3rd argument allows you to only compare the first N pages (to speed up the process).

It currently stops at the first page that differs but it could instead generate diff files of all the pages before completing.

It sets a non-zero exit status when the PDFs differ.