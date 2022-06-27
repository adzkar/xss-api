"use strict";
import puppeteer from "puppeteer-core";
import dotenv from "dotenv";
import Bluebird from "bluebird";
import yargs from "yargs";

import { getFormMethod } from "./utils/commonUtils.mjs";
import METHOD from "./constants/method.mjs";
import { commonMessage, splitter, skipper } from "./constants/words.mjs";

dotenv.config();

const args = yargs(process.argv.slice(2)).argv;

const TARGET_URL = args.target_url;
const COOKIES = args.cookies;
const PAYLOAD = args.payload;

const CANCELED_BUTTONS = ["clear", "reset", "cancel"];

(async () => {
  try {
    const payload = PAYLOAD;

    const browser = await puppeteer.launch({
      headless: false,
      executablePath: process.env.CHROME_EXECUTABLE_PATH,
    });
    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({ Cookie: COOKIES });

    // variable for checking if the xss is found
    var isFound = false;
    await page.on("dialog", async (dialog) => {
      try {
        console.log(skipper(dialog.message()), " dialog message");
        await dialog.accept();
        if (dialog.message()) {
          isFound = true;
          await browser.close();
        }
        console.log(
          `${splitter}${JSON.stringify({
            payload,
            value: isFound,
          })}`
        );
      } catch {
        console.log("no alert");
      }
    });
    const response = await page
      .goto(TARGET_URL, {
        waitUntil: "networkidle2",
      })
      .catch(() => {
        console.log(commonMessage.invalidUrl);
        process.exit(1);
      });

    if (page.url() !== TARGET_URL) {
      console.log(commonMessage.needCredential);
      process.exit(1);
    }

    const filteredInput = await page.evaluate(() => {
      const types = document.querySelectorAll("input");

      return Array.prototype.reduce.call(
        types,
        (obj, node) => {
          if (node.type !== "submit" && node?.name) {
            obj.push({
              name: node?.name,
              tag: node?.tagName.toLowerCase(),
            });
          }
          return obj;
        },
        []
      );
    });

    const filteredTextArea = await page.evaluate(() => {
      const types = document.querySelectorAll("textarea");

      return Array.prototype.reduce.call(
        types,
        (obj, node) => {
          obj.push({
            name: node?.name,
            tag: node?.tagName.toLowerCase(),
          });
          return obj;
        },
        []
      );
    });

    let filteredSubmit = await page.evaluate(() => {
      const types = document.querySelectorAll("form input", "form button");

      return Array.prototype.reduce.call(
        types,
        (obj, node) => {
          if (node.type === "submit" && node?.name) {
            obj.push({
              name: node?.name,
              tag: node?.tagName.toLowerCase(),
            });
          }
          return obj;
        },
        []
      );
    });
    filteredSubmit = filteredSubmit.filter((item) => {
      const name = item?.name?.toLowerCase();
      return !CANCELED_BUTTONS.some((x) => {
        return name.includes(x);
      });
    });

    const filteredSelect = await page.evaluate(() => {
      const types = document.querySelectorAll("select");

      return Array.prototype.reduce.call(
        types,
        (obj, node) => {
          if (node?.name) {
            obj.push({
              name: node?.name,
              tag: node?.tagName.toLowerCase(),
            });
          }

          return obj;
        },
        []
      );
    });
    const inputName = Array.from(
      new Set(
        filteredInput.concat(filteredInput, filteredSelect, filteredTextArea)
      )
    );

    console.log(skipper("Running Stored XSS Scanner"));
    // checking if the page is exist
    if (response.status() === 200) {
      try {
        // checking form
        console.log(skipper("Searching possibility Stored XSS"));
        const forms = await page.$$("form");

        if (forms.length > 0) {
          const method = await page.$eval("form", getFormMethod);
          if (method.toUpperCase() === METHOD.POST) {
            // generate cases
            const cases = [
              {
                url: TARGET_URL,
                payload,
                tags: inputName,
              },
            ];
            const results = await Bluebird.map(
              cases,
              async ({ tags, payload }) => {
                await tags.forEach(async (item) => {
                  const typedTag = `${item.tag}[name=${item.name}]`;
                  const buttonTag = filteredSubmit?.[0];
                  const submitButtonSelector = `${buttonTag.tag}[name=${buttonTag.name}]`;

                  await page
                    .evaluate(
                      ({ typedTag, payload }) => {
                        document.querySelector(typedTag).value = payload;
                      },
                      {
                        typedTag,
                        payload,
                      }
                    )
                    .catch((err) => {
                      // console.log(err, " err typing payload");
                      console.log(skipper("err typing payload"));
                    });
                  const waitSubmitBtn = await page
                    .waitForSelector(submitButtonSelector)
                    .catch(() => {
                      console.log(skipper(" err click button"));
                    });

                  try {
                    await page.click(submitButtonSelector);
                    await page.waitForNavigation();
                  } catch {
                    console.log(skipper("failed to click btn"));
                  }
                });

                return {
                  result: isFound,
                  payload,
                };
              }
            );

            console.log(`${splitter}${JSON.stringify(results)}`);
          }
        }
      } catch {
        console.log(commonMessage.noPossibility("Stored XSS"));
      }
    }

    await browser.close();
  } catch (err) {
    console.log(err);
  }
})();
