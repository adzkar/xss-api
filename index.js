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
    const ans = [];
    payloads.forEach((payload) => {
      const parsedPayload = payload.replace(/"/g, '\\"');

      const command = `yarn reflected-cli --target_url=${target_url} --cookies="${cookies}" --payload="${parsedPayload}"`;
      console.log(command);
      const reflected = shelljs.exec(command, { silent: false });

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

    res.send({
      message: "Reflected  Xss",
      data: ans,
    });
  } catch {
    res.json({
      message: "failed",
      data: [],
    });
  }
});

app.post("/api/dom", async (req, res) => {
  const { target_url, cookies, payloads = [] } = req.body;

  try {
    const ans = [];
    payloads.forEach((payload) => {
      const parsedPayload = payload.replace(/"/g, '\\"');
      const command = `yarn dom-cli --target_url=${target_url} --cookies="${cookies}" --payload="${parsedPayload}"`;
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
      message: "DOM XSS",
      data: ans,
    });
  } catch (e) {
    console.log(e, " e");
    res.json({
      message: "failed",
      data: [],
    });
  }
});

app.post("/api/stored", async (req, res) => {
  const { target_url, cookies, payloads } = req.body;
  try {
    const ans = [];
    payloads.forEach((payload) => {
      const parsedPayload = payload.replace(/"/g, '\\"');
      const command = `yarn stored-cli --target_url=${target_url} --cookies="${cookies}" --payload="${parsedPayload}"`;
      const reflected = shelljs.exec(command, { silent: true });
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
    res.send({
      message: "Stored XSS",
      data: ans,
    });
  } catch (e) {
    console.log(e, " e");
    res.json({
      message: "failed",
      data: [],
    });
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening at ${PORT}`);
});
