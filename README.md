# QA Tools

A repository for QA tools and scripts

## Browser Extension

This extension currently provides a few features:

- makes it easier to link to a specific place in our content (REX, cnx, or archive)
- makes it easier to see the specific element that is being linked to
- provides data about the content on REX and links to view it

Future iterations may include a way to do things like "show class names".

#### REX Spymode

![image](https://user-images.githubusercontent.com/253202/89323538-77dbb480-d64b-11ea-8d6a-ebf6a67f5af3.png)

#### Creating deep links inside our content

![pilcrow links and footnotes](https://user-images.githubusercontent.com/253202/83660283-3f0b5a80-a58a-11ea-9d01-3c59feb1859b.gif)


### Install

1. Install [TamperMonkey](https://www.tampermonkey.net) or [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
1. Click this link to install the browser extension: https://openstax.github.io/qa-tools/browser-extension.user.js

Users will get updates whenever [this file](./browser-extension.user.js) changes (Daily)

[Source Code](./browser-extension.user.js)

## Compare PDFs

### Fast PDF compare

There is a faster, dockerized version of pdf comparison. The only catch is that the fast version assumes that pdf page md5 hashes only change when visual changes occur (seems true so far).

To run this version from the `qa-tools/fast-pdf-compare` directory, do...

```bash
./compare.bash <pdf-a> <pdf-b>
```

Both PDF files must be in the same directory. Example output:

    633 total pages
    0 pages have differences

If there are differences, images depicting those differences will be in a directory next to the pdf files you compared. For example, if I ran `./compare.bash ../../../something/calculus-volume-1--*.pdf`, the images showing the differences, if any, would be in `../../../something`

### Slow PDF compare

[./compare_pdfs.bash](./compare_pdfs.bash) compares 2 PDFs page-by-page by converting each page to an image and then diffing the image.

An optional 3rd argument allows you to only compare the first N pages (to speed up the process).

It currently stops at the first page that differs but it could instead generate diff files of all the pages before completing.

It sets a non-zero exit status when the PDFs differ.
