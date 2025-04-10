const express = require("express");
const puppeteer = require("puppeteer");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Add middleware to parse JSON bodies
app.use(express.json());

app.post("/screenshot", async (req, res) => {
  const { url, timeout = 10000 } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL parameter is required" });
  }

  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: "/usr/bin/chromium-browser",
      headless: true,
    });
    const page = await browser.newPage();

    // Set viewport size
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to the URL
    await page.goto(url, { waitUntil: "networkidle0" });

    // Wait for specified timeout (default 10 seconds)
    await new Promise((resolve) => setTimeout(resolve, timeout));

    // Take screenshot and convert to base64
    const screenshot = await page.screenshot({ encoding: "base64" });

    await browser.close();

    // Return the base64 image
    res.json({
      image: `data:image/png;base64,${screenshot}`,
      timestamp: new Date().toISOString(),
      timeout: timeout,
    });
  } catch (error) {
    console.error("Error taking screenshot:", error);
    res.status(500).json({ error: "Failed to take screenshot" });
  }
});

app.listen(port, () => {
  console.log(`Screenshot service running at http://localhost:${port}`);
});
