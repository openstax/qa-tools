// ==UserScript==
// @name         OpenAI API Example
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Access OpenAI API using GM_xmlhttpRequest
// @author       You
// @include https://cnx.org/*
// @include https://*.cnx.org/*
// @include https://openstax.org/*
// @include https://*.openstax.org/*
// @include https://rex-web*.herokuapp.com/*
// @connect      api.openai.com
// @grant        GM_xmlhttpRequest
// @grant        GM_addElement
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at document-body
// ==/UserScript==

(function () {
  "use strict";

  class HighlightHandler {
    constructor() {
      this.elemMap = {}
    }

    handleEl(id, elem, attach) {
      const click = evt => {
        const isSelected = !this.elemMap[id].selected
        this.elemMap[id].selected = isSelected
        if (isSelected) {
          elem.style.border = '1px solid red'
        } else {
          elem.style.border = ''
        }
        evt.stopPropagation()
      }

      if (attach) {
        elem.addEventListener('click', click)
      } else {
        elem.removeEventListener('click', click)
      }
    }

    get selectedText() {
      return Object.values(this.elemMap)
        .filter(obj => obj.selected === true)
        .map(obj => obj.elem.textContent)
        .join("\n")
    }

    get contentEl() {
      return document.getElementById('main-content')
    }

    get highlightableElements() {
      function shouldSummarizeTag(el) {
        if (el.dataset.type === 'term' || el.dataset.type === 'page') {
          return false
        }
        switch (el.tagName.toLowerCase()) {
          case 'span':
          case 'div':
          case 'p':
          case 'ol':
            return true
          default:
            return false
        }
      }
      return Array.from(this.contentEl.querySelectorAll('*'))
        .filter(e => shouldSummarizeTag(e) && e.textContent.trim().length > 10)
    }

    attach() {
      this.highlightableElements.forEach((e, idx) => {
        this.elemMap[idx] = { selected: false, elem: e }
        this.handleEl(idx, e, true)
      })
    }

    detach() {
      this.highlightableElements.forEach((e, idx) => {
        this.handleEl(idx, e, false)
      })
      this.elemMap = {}
    }
  }

  // https://stackoverflow.com/a/15784734
  let apiKey = GM_getValue('openapi-key')
  if (!apiKey) {
    apiKey = prompt('Enter an OpenAPI key:')
    GM_setValue('openapi-key', apiKey)
  }
  const apiEndpoint =
    "https://api.openai.com/v1/engines/text-davinci-003/completions";

  async function generateText(prompt) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "POST",
        url: apiEndpoint,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        data: JSON.stringify({
          prompt: prompt,
          max_tokens: 1000,
          n: 1,
          stop: null,
          temperature: 0.7,
        }),
        onload: function (response) {
          try {
            const data = JSON.parse(response.responseText);
            resolve(data);
          } catch (error) {
            reject(error);
          }
        },
        onerror: function (error) {
          reject(error);
        },
      });
    });
  }

  function doThing(btn, promptFn, formatter) {
    function handler() {
      btn.disabled = true;
      // Example usage:
      const prompt = promptFn()
      if (!prompt) {
        btn.disabled = false
        return
      }
      generateText(prompt)
        .then((response) => {
          btn.disabled = false;
          console.log("Generated text:", response);
          let respText = response.choices[0].text;
          if (formatter) {
            respText = formatter(respText)
          }
          const li = document.createElement("li");
          li.innerHTML = respText;
          botLog.append(li);
        })
        .catch((error) => {
          btn.disabled = false;
          console.error("Error:", error);
        });
    }

    btn.addEventListener("click", handler);
  }

  function formatMultipleChoice(response) {
    console.log(response)
    let json = JSON.parse(response)
    let result = ''
    for (let item of json) {
      result += `\
      <div>
      <strong>${item.question}</strong>
      <ul>
        ${item.options.map(option => `<li>${option}</li>`).join(`\n`)}
      </ul>
      </div>
      `
    }

    return result
  }

  const style = window.document.createElement("style");
  style.textContent = `/* Greasemonkey-injected styling */

          #rex-spymode {
              position: fixed;
              bottom: 0;
              right: 0;
              background-color: rgba(255,255,255,.8);
              padding: 1rem;
              border: 1px dashed #000;
              z-index: 1000;
              width: 50rem;
          }
          /* Each REX spymode item should be on a separate line and have padding below */
          #rex-spymode > * {
              display: block;
              margin-bottom: 1rem;
          }
          #rex-spymode #error-message:before {
              content: 'Error Message: ';
              font-weight: bold;
          }
          #rex-spymode #error-message {
              color: red;
          }

          #bot-log {
            overflow-y: auto;
            max-height: 40rem;
          }

          #bot-log li {
            overflow: initial;
          }

  `;

  window.document.head.appendChild(style);

  const nameOptions = ["StaxGTP", "Staxly", "TutorBot", "StaxFormer"];

  function findOrMake(id, tagName = "div", appendTo) {
    let el = document.getElementById(id);
    if (el) return;
    el = document.createElement(tagName);
    el.setAttribute("id", id);
    if (appendTo) appendTo.append(el);
    return el;
  }

  let root = findOrMake("rex-spymode", "div", document.body);
  root.innerHTML = "";

  const highlightHandler = new HighlightHandler()
  const heading = document.createElement("h2");
//  const close = document.createElement("button");
//  close.addEventListener("click", () => {
//    keepClosed = true;
//    root.innerHTML = "";
//  });
//  close.append("X");
//  heading.append(close);
  heading.append(
    ` ${nameOptions[Math.round(Math.random(nameOptions.length))]}`
  );
  root.append(heading);

  const botLog = findOrMake("bot-log", "ul", root);
  root.append(botLog);

  const summaryBtn = findOrMake("bot-summary", "button", root);
  summaryBtn.textContent = "Summarize";
  doThing(
    summaryBtn,
    () => {
      const selectedText = highlightHandler.selectedText
      return selectedText.length
        ? `Summarize the following text in 100 words or less: ${selectedText}`
        : `Summarize the following URL in 100 words: ${document.location.href}`
    }
  );

  const explainBtn = findOrMake("bot-explain", "button", root);
  explainBtn.textContent = "Explain";
  doThing(
    explainBtn,
    () => {
      const selectedText = highlightHandler.selectedText

      if (selectedText.length) {
        return `Explain the concepts in the following text like I'm 5: ${selectedText}`
      } else {
        alert("Please select some content!")
        return
      }
    }
  );

  const multipleChoiceBtn = findOrMake("bot-multiplechoice", "button", root);
  multipleChoiceBtn.textContent = "Multiple Choice";
  doThing(
    multipleChoiceBtn,
    () => {
      const selectedText = highlightHandler.selectedText
      const format = `in the following format: [{"question": "What color is the sky?", "options": ["red", "blue", "yellow"], "answer": 2}, ...]`
      return selectedText.length
        ? `Generate 3 multiple choice questions in JSON format from the following text: ${selectedText}` + format
        : `Generate 3 multiple choice questions in JSON format from the following URL in HTML: ${document.location.href}` + format
    },
    formatMultipleChoice
  );

  const fillingBlankBtn = findOrMake("bot-fillingblank", "button", root);
  fillingBlankBtn.textContent = "Filling the Blank";
  doThing(
    fillingBlankBtn,
    () => {
      const selectedText = highlightHandler.selectedText
      if (selectedText.length) {
        return `Create 3 main concept sentences about the following content and display the most important keyword as a blank ______ : ${selectedText}`
      } else {
        alert("Please select some content!")
        return
      }
    }
  );

  // Pages to demo:
  // https://openstax.org/books/college-physics-2e/pages/3-4-projectile-motion
  // https://openstax.org/books/introduction-philosophy/pages/5-5-informal-fallacies
  const fallaciesBtn = findOrMake("bot-fallacies", "button", root);
  fallaciesBtn.textContent = "Fallacies?";
  fallaciesBtn.addEventListener("click", async () => {
      fallaciesBtn.disabled = true;

      let sel
      if (document.querySelector('#main-content blockquote p')) {
        sel = '#main-content blockquote p'
      } else {
        sel = '#main-content p'
      }
      const paras = Array.from(document.querySelectorAll(sel)).slice(0, 5)
      for (const p of paras) {
        try {
          const response = await generateText(`Please answer with the name of the logical fallacy if there is one or none if there is none: ${p.textContent}`)
          fallaciesBtn.disabled = false;
          console.log("Generated text:", response);
          const respText = response.choices[0].text;
          const li = document.createElement("li");
          li.innerHTML = respText;
          botLog.append(li);

          if (/[nN]one/.test(respText) || /no.*logic.*fallac/.test(respText)) {
            p.style = 'background-color: #cfc;'
          } else {
            p.style = 'background-color: red;'
          }
          p.title = respText
        } catch (e) {
          fallaciesBtn.disabled = false;
          console.error("Error:", e);
        }
      }
  });

  setTimeout(
      () => highlightHandler.attach(),
      3000
  )

})();