const express = require("express");
const puppeteer = require("puppeteer");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Add middleware to parse JSON bodies
app.use(express.json());

app.post("/screenshot", async (req, res) => {
  const { url, timeout = 10000 } = req.body;
  console.log("req.body", req.body);
  let _url = "https://proxy-ov5tc.ondigitalocean.app/index.php?q=";
  if (!url) {
    console.log("url", url);
    return res.status(400).json({ error: "URL parameter is required" });
  }
  _url += btoa(url);
  try {
    const browser = await puppeteer.launch({
      args: [
        "--disable-session-crashed-bubble",
        "--single-process",
        "--noerrdialogs",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-features=site-per-process",
        "--ignore-certificate-errors",
        "--disable-blink-features=AutomationControlled",
        "--disable-infobars",
        "--window-position=0,0",
        "--ignore-certifcate-errors",
        "--ignore-certifcate-errors-spki-list",
      ],

      // executablePath: "/usr/bin/chromium-browser",
      defaultViewport: { width: 1920, height: 1080 },
      headless: true,
    });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);

    try {
      // Navigate to the URL
      let status = await page.goto(url, {
        timeout: 0,
        waitUntil: "domcontentloaded",
      });
      console.log("status", status.status());
      if (status.status() !== 200) {
        return res.status(400).json({ error: "Failed to load URL" });
      }
      // Wait for specified timeout (default 10 seconds)
      await new Promise((resolve) => setTimeout(resolve, timeout));
      console.log("page", page);
      // Take screenshot and convert to base64
      const screenshot = await page.screenshot({ encoding: "base64" });
      console.log("screenshot", screenshot);
      // Return the base64 image
      res.json({
        image: `data:image/png;base64,${screenshot}`,
        timestamp: new Date().toISOString(),
        timeout: timeout,
      });
    } catch (error) {
      console.error("Error taking screenshot:", error);
      res.status(500).json({ error: "Failed to take screenshot" });
      return;
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("Error taking screenshot:", error);
    res.status(500).json({ error: "Failed to take screenshot" });
  }
});

app.listen(port, () => {
  console.log(`Screenshot service running at http://localhost:${port}`);
});
