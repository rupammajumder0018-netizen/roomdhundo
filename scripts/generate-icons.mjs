/**
 * generate-icons.mjs
 *
 * Generates all required PWA icon sizes from public/icon.png
 * Uses Node.js built-in modules + sharp (installed temporarily if needed).
 *
 * Run: node scripts/generate-icons.mjs
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourceIcon = path.join(root, "public", "icon.png");
const iconsDir = path.join(root, "public", "icons");

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// Install sharp temporarily if not present
let sharp;
try {
  const require = createRequire(import.meta.url);
  sharp = require("sharp");
} catch {
  console.log("Installing sharp for icon generation...");
  execSync("npm install --no-save sharp@0.33.5", { cwd: root, stdio: "inherit" });
  const require = createRequire(import.meta.url);
  sharp = require("sharp");
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  console.log(`\nGenerating PWA icons from ${sourceIcon}\n`);

  if (!fs.existsSync(sourceIcon)) {
    console.error(`ERROR: Source icon not found at ${sourceIcon}`);
    process.exit(1);
  }

  const src = sharp(sourceIcon);
  const meta = await src.metadata();
  console.log(`Source: ${meta.width}x${meta.height} ${meta.format}\n`);

  for (const size of sizes) {
    const outPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(sourceIcon)
      .resize(size, size, { fit: "contain", background: { r: 238, g: 250, b: 244, alpha: 1 } })
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    console.log(`  ✓ icon-${size}x${size}.png`);
  }

  // Maskable icon (512x512 with 10% safe zone padding)
  const maskableOut = path.join(iconsDir, "icon-512x512-maskable.png");
  const paddedSize = Math.round(512 * 0.8); // 80% content, 10% padding each side
  const padding = Math.round((512 - paddedSize) / 2);
  await sharp(sourceIcon)
    .resize(paddedSize, paddedSize, { fit: "contain", background: { r: 34, g: 87, b: 122, alpha: 1 } })
    .extend({
      top: padding, bottom: padding, left: padding, right: padding,
      background: { r: 34, g: 87, b: 122, alpha: 1 },
    })
    .png({ compressionLevel: 9 })
    .toFile(maskableOut);
  console.log("  ✓ icon-512x512-maskable.png (maskable)");

  // Apple touch icon (180x180, square, no transparency)
  const appleOut = path.join(iconsDir, "apple-touch-icon.png");
  await sharp(sourceIcon)
    .resize(180, 180, { fit: "contain", background: { r: 238, g: 250, b: 244, alpha: 1 } })
    .png({ compressionLevel: 9 })
    .toFile(appleOut);
  console.log("  ✓ apple-touch-icon.png (180x180)");

  // Generate splash screens (simple branded colored backgrounds)
  const splashes = [
    { name: "splash-430x932.png", w: 430, h: 932 },
    { name: "splash-390x844.png", w: 390, h: 844 },
    { name: "splash-375x667.png", w: 375, h: 667 },
    { name: "splash-768x1024.png", w: 768, h: 1024 },
  ];

  for (const { name, w, h } of splashes) {
    const outPath = path.join(iconsDir, name);
    const iconSize = Math.min(w, h) * 0.3;
    const iconPadding = Math.round((w - iconSize) / 2);
    const iconPaddingTop = Math.round((h - iconSize) / 2);

    const resizedIcon = await sharp(sourceIcon)
      .resize(Math.round(iconSize), Math.round(iconSize), {
        fit: "contain",
        background: { r: 238, g: 250, b: 244, alpha: 0 },
      })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: w,
        height: h,
        channels: 3,
        background: { r: 238, g: 250, b: 244 },
      },
    })
      .composite([{
        input: resizedIcon,
        left: iconPadding,
        top: iconPaddingTop,
      }])
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    console.log(`  ✓ ${name} (${w}x${h} splash)`);
  }

  console.log("\n✅ All PWA icons generated successfully!\n");
}

generateIcons().catch((err) => {
  console.error("Icon generation failed:", err);
  process.exit(1);
});
