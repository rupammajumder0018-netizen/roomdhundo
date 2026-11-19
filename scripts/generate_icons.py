import os
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_ICON = os.path.join(ROOT, "public", "icon.png")
ICONS_DIR = os.path.join(ROOT, "public", "icons")
SCREENSHOTS_DIR = os.path.join(ROOT, "public", "screenshots")

os.makedirs(ICONS_DIR, exist_ok=True)
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

print(f"Loading source icon: {SRC_ICON}")
src_img = Image.open(SRC_ICON).convert("RGBA")

# Generate standard icons
sizes = [72, 96, 128, 144, 152, 192, 384, 512]
for size in sizes:
    resized = src_img.resize((size, size), Image.Resampling.LANCZOS)
    out_path = os.path.join(ICONS_DIR, f"icon-{size}x{size}.png")
    resized.save(out_path, "PNG", optimize=True)
    print(f"Generated: {out_path}")

# Maskable icon (512x512 with safe padding on brand background #22577A)
maskable = Image.new("RGBA", (512, 512), (34, 87, 122, 255))
padded_size = int(512 * 0.8)
resized_padded = src_img.resize((padded_size, padded_size), Image.Resampling.LANCZOS)
offset = (512 - padded_size) // 2
maskable.paste(resized_padded, (offset, offset), resized_padded)
maskable.save(os.path.join(ICONS_DIR, "icon-512x512-maskable.png"), "PNG", optimize=True)
print("Generated: icon-512x512-maskable.png")

# Apple touch icon (180x180, solid background #eefaf4)
apple_icon = Image.new("RGBA", (180, 180), (238, 250, 244, 255))
resized_apple = src_img.resize((150, 150), Image.Resampling.LANCZOS)
apple_icon.paste(resized_apple, (15, 15), resized_apple)
apple_icon = apple_icon.convert("RGB")
apple_icon.save(os.path.join(ICONS_DIR, "apple-touch-icon.png"), "PNG", optimize=True)
print("Generated: apple-touch-icon.png")

# Splash screens
splashes = [
    ("splash-430x932.png", 430, 932),
    ("splash-390x844.png", 390, 844),
    ("splash-375x667.png", 375, 667),
    ("splash-768x1024.png", 768, 1024),
]

for name, w, h in splashes:
    splash = Image.new("RGB", (w, h), (238, 250, 244))
    icon_w = int(min(w, h) * 0.35)
    resized_center = src_img.resize((icon_w, icon_w), Image.Resampling.LANCZOS)
    x = (w - icon_w) // 2
    y = (h - icon_w) // 2
    splash.paste(resized_center, (x, y), resized_center)
    splash.save(os.path.join(ICONS_DIR, name), "PNG", optimize=True)
    print(f"Generated splash: {name}")

# Generate placeholder screenshot if not exists
screenshot_path = os.path.join(SCREENSHOTS_DIR, "mobile-home.png")
if not os.path.exists(screenshot_path):
    screenshot = Image.new("RGB", (390, 844), (238, 250, 244))
    center_logo = src_img.resize((160, 160), Image.Resampling.LANCZOS)
    screenshot.paste(center_logo, ((390 - 160) // 2, 200), center_logo)
    screenshot.save(screenshot_path, "PNG", optimize=True)
    print(f"Generated screenshot: {screenshot_path}")

print("All PWA assets generated successfully!")
