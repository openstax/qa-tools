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
        if (el.dataset.type === 'term' ||
            el.dataset.type === 'page' ||
            el.classList.contains('os-math-in-para')) {
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
      botLog.append(typingIndicator())
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
          const li = document.createElement("li");
          botLog.removeChild(botLog.lastChild)
          botLog.append(li);
          if (formatter) {
            li.append(formatter(respText));
          } else {
            li.innerHTML = respText;
          }
        })
        .catch((error) => {
          btn.disabled = false;
          botLog.removeChild(botLog.lastChild)
          console.error("Error:", error);
        });
    }

    btn.addEventListener("click", handler);
  }

  function formatMultipleChoice(response) {
    console.log(response);
    let json = JSON.parse(response);
    const result = document.createElement("div");
    for (let item of json) {
      const question = document.createElement("strong");
      const options = document.createElement("ul");
      question.textContent = item.question;
      result.append(question);
      result.append(options);
      item.options.forEach((option, idx) => {
        const li = document.createElement("li");
        const span = document.createElement("span");
        li.append(span);
        span.onclick = () => {
          if (idx === item.answer) {
            alert("Correct! You're breath taking!");
          } else {
            alert("Sorry, that's incorrect :(");
          }
        }
        span.textContent = option;
        span.style.color = "blue";
        span.style.textDecoration = "underline";
        span.style.cursor = "pointer";
        options.append(li);
      })
    }

    return result;
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

          #bot-log > li {
            overflow: initial;
            list-style-type: none;
            background-color: lightblue;
            list-style-type: none;
            border-width; 0.2em;
            border-radius: 2em;
            padding: 0.8em 1.4em;
            margin-bottom: 1em;
            margin-right: 1em; 
          }
          .typing-indicator {
            background-color: #E6E7ED;
            will-change: transform;
            width: 50px;
            border-radius: 10px;
            padding: 10px;
            display: table;
            margin: 0 auto;
            position: relative;
            -webkit-animation: 2s bulge infinite ease-out;
                    animation: 2s bulge infinite ease-out;
          }
          .typing-indicator::before, .typing-indicator::after {
            content: "";
            position: absolute;
            bottom: -2px;
            left: -2px;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background-color: #E6E7ED;
          }
          .typing-indicator::after {
            height: 10px;
            width: 10px;
            left: -10px;
            bottom: -10px;
          }
          .typing-indicator span {
            height: 5px;
            width: 5px;
            float: left;
            margin: 0 1px;
            background-color: #9E9EA1;
            display: block;
            border-radius: 50%;
            opacity: 0.4;
          }
          .typing-indicator span:nth-of-type(1) {
            -webkit-animation: 1s blink infinite 0.3333s;
                    animation: 1s blink infinite 0.3333s;
          }
          .typing-indicator span:nth-of-type(2) {
            -webkit-animation: 1s blink infinite 0.6666s;
                    animation: 1s blink infinite 0.6666s;
          }
          .typing-indicator span:nth-of-type(3) {
            -webkit-animation: 1s blink infinite 0.9999s;
                    animation: 1s blink infinite 0.9999s;
          }
          
          @-webkit-keyframes blink {
            50% {
              opacity: 1;
            }
          }
          
          @keyframes blink {
            50% { 
              opacity: 1;
            }
          }
          @-webkit-keyframes bulge {
            50% {
              transform: scale(1.05);
            }
          }
          @keyframes bulge {
            50% {
              transform: scale(1.05);
            }
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
      const format = `in the following format: [{"question": "What color is the sky?", "options": ["red", "blue", "yellow"], "answer": 1}, ...]`
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
          if (/[nN]one/.test(respText) || /no.*logic.*fallac/.test(respText)) {
            p.style = 'background-color: #cfc;'
          } else {
            p.style = 'background-color: red;'
            p.title = respText.trim()
            const bold = document.createElement('b')
            bold.innerText = `(⚠️: ${respText.trim()}) `
            p.prepend(bold)
          }
          p.title = respText.trim()
        } catch (e) {
          fallaciesBtn.disabled = false;
          console.error("Error:", e);
        }
      }
  });

  function typingIndicator(){
    const typingIndicator = document.createElement("div");
    typingIndicator.setAttribute("id", "typing-indicator");
    typingIndicator.classList.add("typing-indicator");
    typingIndicator.innerHTML = `<span></span><span></span><span></span>`;
    return typingIndicator;
  }


  setTimeout(
      () => highlightHandler.attach(),
      3000
  )

})();
