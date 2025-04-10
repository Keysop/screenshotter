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

  if (!url) {
    console.log("url", url);
    return res.status(400).json({ error: "URL parameter is required" });
  }

  try {
    const browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-features=site-per-process",
        "--disable-infobars",
        "--window-size=1280,720",
        "--single-process",
        "--no-zygote",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--memory-pressure-off",
        '--js-flags="--max-old-space-size=128"',
        "--disable-software-rasterizer",
        "--disable-canvas-aa",
        "--disable-2d-canvas-clip-aa",
        "--disable-gl-drawing-for-tests",
        "--disable-accelerated-video-decode",
        "--disable-accelerated-video-encode",
        "--disable-webrtc-hw-encoding",
        "--disable-webrtc-hw-decoding",
        "--disable-web-security",
        "--disable-site-isolation-trials",
        "--disable-features=TranslateUI,BlinkGenPropertyTrees",
        "--disable-features=IsolateOrigins,site-per-process",
        "--aggressive-cache-discard",
        "--process-per-site",
        "--renderer-process-limit=1",
        "--disable-features=NetworkService,NetworkServiceInProcess",
        "--disable-features=AudioServiceOutOfProcess",
        "--disable-features=NetworkServiceInProcess2",
      ],
      defaultViewport: { width: 1280, height: 720 },
      headless: "new",
      ignoreDefaultArgs: ["--enable-automation"],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();

    // Sayfa yükleme optimizasyonları
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const resourceType = req.resourceType();
      if (
        resourceType === "image" ||
        resourceType === "stylesheet" ||
        resourceType === "font"
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    page.setDefaultNavigationTimeout(0);

    try {
      await page.goto(url, {
        waitUntil: "networkidle0",
        timeout: 0,
      });

      // Canvas'ın yüklenmesini bekle
      await page.evaluate(() => {
        return new Promise((resolve) => {
          const checkCanvas = () => {
            const canvas = document.querySelector("canvas");
            if (canvas && canvas.getContext) {
              resolve();
            } else {
              setTimeout(checkCanvas, 100);
            }
          };
          checkCanvas();
        });
      });

      // Ekstra bekleme süresi
      await new Promise((resolve) => setTimeout(resolve, timeout));

      // Canvas'ı bul ve screenshot al
      const screenshot = await page.evaluate(() => {
        const canvas = document.querySelector("canvas");
        if (!canvas) return null;
        return canvas.toDataURL("image/jpeg", 0.6).split(",")[1];
      });

      if (!screenshot) {
        throw new Error("Canvas not found");
      }

      res.json({
        image: `data:image/jpeg;base64,${screenshot}`,
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

app.post("/screenshot-playwright", async (req, res) => {
  const { url, timeout = 10000 } = req.body;

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
