import express from "express";
import dotenv from "dotenv";
import shelljs from "shelljs";

dotenv.config();

const app = express();
const PORT = process.env.APP_PORT;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "XSS Labs",
  });
});

app.post("/api/reflected", async (req, res) => {
  const { target_url, cookies, payloads } = req.body;
  try {
    const parsedPayload = payloads.replace(/\\n/g, "");
    console.log(parsedPayload);
    const command = `yarn reflected-cli --target_url=${target_url} --cookies="${cookies}" --payloads="${parsedPayload}"`;
    const reflected = shelljs.exec(command, { silent: true });
    const response = {
      message: "Reflected XSS",
      data: reflected.stdout,
    };
    res.json(response);
  } catch {
    res.json({
      message: "failed",
    });
  }
});

app.post("/api/dom", async (req, res) => {
  const { target_url, cookies, payloads } = req.body;
  try {
    const parsedPayload = payloads.replace(/\\n/g, "");
    console.log(parsedPayload);
    const command = `yarn dom-cli --target_url=${target_url} --cookies="${cookies}" --payloads="${parsedPayload}"`;
    const reflected = shelljs.exec(command, { silent: true });
    const response = {
      message: "DOM XSS",
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
