// ==UserScript==
// @name     Openstax QA Helpers
// @version  2
// @grant    none
// @include https://cnx.org/*
// @include https://*.cnx.org/*
// @include https://openstax.org/*
// @include https://*.openstax.org/*
// ==/UserScript==

// This is a TamperMonkey and Greasemonkey script to make it easier to QA content
// 
// 1. Install TamperMonkey: https://www.tampermonkey.net
// 2. Install this script: https://openstax.github.io/qa-tools/tampermonkey.js
//            (assuming this repo is still named "qa-tools")
//
// Users will get updates whenever this file changes (Daily)

// Examples:
// https://openstax.org/books/astronomy/pages/3-2-newtons-great-synthesis#fs-id1163976559032
// https://archive-qa.cnx.org/contents/2e737be8-ea65-48c3-aa0a-9f35b4c6a966@23.2:jccCTwYm@15/3-2-Newton-s-Great-Synthesis#fs-id1163976529854

(function() {
    'use strict';

    const style = window.document.createElement('style')
    style.textContent = `/* Greasemonkey-injected styling */

        /* Linking to a specific element should highlight the element */
        :target {
            background-color: #ffffcc;
            border: 1px dotted #000000;

            animation-name: cssAnimation;
            animation-duration: 10s;
            animation-timing-function: ease-out;
            animation-delay: 0s;
            animation-fill-mode: forwards;
        }
        @keyframes cssAnimation {
            to {
                background-color: initial;
                border: initial;
            }
        }

        /* Style new-style footnotes so that they stand out */
        [role="doc-footnote"] { background-color: #ccffcc; border: 1px dashed #ff0000; }
        [role="doc-footnote"]:before { content: "FOOTNOTE (new) " ; }

        /* Style old-style footnotes so that they stand out */
        [data-type="footnote-refs-title"],
        [data-type="footnote-number"] { background-color: #ff0000; }
        [data-type="footnote-refs-title"]:after,
        [data-type="footnote-number"]:after { content: "(old)"; }

        /* Show a permalink when hovering over a heading or paragraph */
        *:not(:hover) > a.-permalinker { display: none; }
        * > a.-permalinker {
            margin-left: .1rem;
            font-weight: bold;
            text-decoration: none;
        }
`

    window.document.head.appendChild(style)


    const pilcrow = '¶'

    const headingsSelector = [
        '*[id] > h1:not([data-dev-has-permalink])',
        '*[id] > h2:not([data-dev-has-permalink])',
        '*[id] > h3:not([data-dev-has-permalink])',
        '*[id] > h4:not([data-dev-has-permalink])',
        '*[id] > h5:not([data-dev-has-permalink])',
        '*[id] > h6:not([data-dev-has-permalink])'
    ].join(', ')

    const grandHeadingsSelector = [
        '*[id] > * > .os-title:not([data-dev-has-permalink])',
        '*[id] > header > h1:not([data-dev-has-permalink])',
        '*[id] > header > h2:not([data-dev-has-permalink])',
        '*[id] > header > h3:not([data-dev-has-permalink])',
        '*[id] > header > h4:not([data-dev-has-permalink])',
        '*[id] > header > h5:not([data-dev-has-permalink])',
        '*[id] > header > h6:not([data-dev-has-permalink])',
    ].join(', ')

    function addPermalink(parent, id) {
        const link = window.document.createElement('a')
        link.classList.add('-permalinker')
        link.setAttribute('href', `#${id}`)
        link.textContent = pilcrow
        parent.setAttribute('data-dev-has-permalink', true)
        parent.appendChild(link)
    }

    function addLinks() {
        const paragraphs = Array.from(window.document.querySelectorAll('p[id]:not([data-dev-has-permalink])'))
        paragraphs.forEach(p => addPermalink(p, p.getAttribute('id')) )

        Array.from(window.document.querySelectorAll(headingsSelector)).forEach(h => addPermalink(h, h.parentElement.getAttribute('id')) )
        Array.from(window.document.querySelectorAll(grandHeadingsSelector)).forEach(h => addPermalink(h, h.parentElement.parentElement.getAttribute('id')) )
    }

    // Loop because SinglePageApps reload the content
    setInterval(addLinks, 5 * 1000)
    addLinks()

})();
