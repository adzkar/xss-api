import express from "express";
import dotenv from "dotenv";
import shelljs from "shelljs";
import cors from "cors";
import { splitter } from "./constants/words.mjs";
import { formatter } from "./utils/response.mjs";

dotenv.config();

const app = express();
const PORT = process.env.APP_PORT;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: "*",
  })
);

app.get("/", (req, res) => {
  res.json({
    message: "XSS Labs",
  });
});

app.post("/api/reflected", async (req, res) => {
  const { target_url, cookies, payloads = [] } = req.body;
  try {
    const parsedPayload = JSON.stringify(payloads)
      .replace(/"/g, "'")
      .replace(/</g, "\\<")
      .replace(/>/g, "\\>")
      .replace(/'/g, "\\'")
      .replace(/\\/g, "\\")
      .replace(/\//g, "/");
    const command = `yarn reflected-cli --target_url=${target_url} --cookies="${cookies}" --payloads="${parsedPayload}"`;
    // const reflected = shelljs.exec(command, { silent: true });
    // console.log(JSON.stringify(payloads), " payloads");
    // console.log(reflected.stdout, " a");
    console.log(command, " command");
    // const response = {
    //   message: "Reflected XSS",
    //   data: reflected.stdout,
    // };
    // res.json(response);
    res.json({
      data: [],
    });
  } catch {
    res.json({
      message: "failed",
    });
  }
});

app.post("/api/dom", async (req, res) => {
  const { target_url, cookies, payloads = [] } = req.body;

  try {
    const ans = [];
    payloads.forEach((payload) => {
      const command = `yarn dom-cli --target_url=${target_url} --cookies="${cookies}" --payload="${payload}"`;
      const reflected = shelljs.exec(command, { silent: false });
      console.log(reflected.stdout, " stdout");
      const formattedResponse = reflected.stdout
        .split(splitter)
        .slice(1)
        .join("\n");
      ans.push(
        formatter({
          payload,
          message: formattedResponse,
        })
      );
    });
    console.log({ ans });
    res.send({
      message: "Reflected XSS",
      data: ans,
    });
  } catch (e) {
    console.log(e, " e");
    res.json({
      message: "failed",
    });
  }
});

app.post("/api/stored", async (req, res) => {
  const { target_url, cookies, payloads } = req.body;
  try {
    const parsedPayload = payloads.replace(/\\n/g, "");
    console.log(parsedPayload);
    const command = `yarn stored-cli --target_url=${target_url} --cookies="${cookies}" --payloads="${parsedPayload}"`;
    const reflected = shelljs.exec(command, { silent: true });
    const response = {
      message: "Stored XSS",
      data: reflected.stdout,
    };
    res.json(response);
  } catch {
    res.json({
      message: "failed",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening at ${PORT}`);
});
