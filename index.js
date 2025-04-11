const express = require("express");
const puppeteer = require("puppeteer");
const { chromium } = require("playwright");
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
      headless: "new",
    });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    await page.emulateMediaType("screen");
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

app.post("/screenshot-playwright", async (req, res) => {
  const { url, timeout = 10000 } = req.body;
  console.log("req.body", req.body);
  if (!url) {
    return res.status(400).json({ error: "URL parameter is required" });
  }

  try {
    const browser = await chromium.launch({
      headless: true,
      args: [
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-site-isolation-trials",
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });

    const page = await context.newPage();

    try {
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 0,
      });

      if (!response.ok()) {
        return res.status(400).json({ error: "Failed to load URL" });
      }

      // Wait for specified timeout
      await new Promise((resolve) => setTimeout(resolve, timeout));

      // Take screenshot and convert to base64
      const screenshot = await page.screenshot({
        type: "jpeg",
      });
      const base64Image = screenshot.toString("base64");
      // Return the base64 image
      res.json({
        image: `data:image/jpeg;base64,${base64Image}`,
        timestamp: new Date().toISOString(),
        timeout: timeout,
      });
    } catch (error) {
      console.error("Error taking screenshot:", error);
      res.status(500).json({ error: "Failed to take screenshot" });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("Error launching browser:", error);
    res.status(500).json({ error: "Failed to launch browser" });
  }
});

app.listen(port, () => {
  console.log(`Screenshot service running at http://localhost:${port}`);
});
