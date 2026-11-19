import os
import shutil
from PIL import Image, ImageDraw, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_RAW = os.path.join(ROOT, "public", "icon-raw.png")
SRC_ICON = os.path.join(ROOT, "public", "icon.png")
ICONS_DIR = os.path.join(ROOT, "public", "icons")
SCREENSHOTS_DIR = os.path.join(ROOT, "public", "screenshots")

os.makedirs(ICONS_DIR, exist_ok=True)
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

# 1. Backup original raw icon if not already backed up
if not os.path.exists(SRC_RAW):
    shutil.copyfile(SRC_ICON, SRC_RAW)
    print("Backed up raw icon to public/icon-raw.png")

raw_img = Image.open(SRC_RAW).convert("RGBA")
w, h = raw_img.size

# Slightly enhance contrast and sharpness so the icon details are crisp
enhancer = ImageEnhance.Contrast(raw_img)
enhanced_img = enhancer.enhance(1.04)

# 2. Build the Styled Icon (with semi-rounded corners & stylish brand border)
# Corner radius: 20% of width (standard app icon squircle curve)
radius = int(w * 0.20)
mask = Image.new("L", (w, h), 0)
draw_mask = ImageDraw.Draw(mask)
draw_mask.rounded_rectangle([(0, 0), (w, h)], radius=radius, fill=255)

styled_icon = Image.new("RGBA", (w, h), (0, 0, 0, 0))
styled_icon.paste(enhanced_img, (0, 0), mask=mask)

# Add dual-tone stylish border
# Outer border: Brand deep blue #22577A (~2.5% of dimension)
border_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
draw_border = ImageDraw.Draw(border_layer)
bw_outer = max(2, int(w * 0.024))
draw_border.rounded_rectangle(
    [(bw_outer // 2, bw_outer // 2), (w - bw_outer // 2, h - bw_outer // 2)],
    radius=radius,
    outline=(34, 87, 122, 255),
    width=bw_outer,
)

# Inner border: Subtle white/cream highlight line (~0.8% of dimension)
bw_inner = max(1, int(w * 0.008))
offset = bw_outer
draw_border.rounded_rectangle(
    [(offset + bw_inner // 2, offset + bw_inner // 2), (w - offset - bw_inner // 2, h - offset - bw_inner // 2)],
    radius=radius - offset,
    outline=(255, 255, 255, 180),
    width=bw_inner,
)

styled_master = Image.alpha_composite(styled_icon, border_layer)

# Save styled master to public/icon.png
styled_master.save(SRC_ICON, "PNG", optimize=True)
print(f"Updated master icon with semi-rounded corners and border: {SRC_ICON}")

# 3. Generate all standard PWA icons (with rounded corners & border)
sizes = [72, 96, 128, 144, 152, 192, 384, 512]
for size in sizes:
    resized = styled_master.resize((size, size), Image.Resampling.LANCZOS)
    out_path = os.path.join(ICONS_DIR, f"icon-{size}x{size}.png")
    resized.save(out_path, "PNG", optimize=True)
    print(f"Generated standard icon: {out_path}")

# 4. Generate Apple Touch Icon (180x180, square solid background #eefaf4 with rounded icon)
apple_out = os.path.join(ICONS_DIR, "apple-touch-icon.png")
apple_base = Image.new("RGBA", (180, 180), (238, 250, 244, 255))
apple_resized = styled_master.resize((180, 180), Image.Resampling.LANCZOS)
apple_base.paste(apple_resized, (0, 0), apple_resized)
apple_base.convert("RGB").save(apple_out, "PNG", optimize=True)
print(f"Generated: {apple_out}")

# 5. Generate Maskable Icon (512x512 FULL BLEED - NO SIDE GAPS!)
# For Android Adaptive Icons: The background MUST fill 100% of the canvas edge-to-edge
# The central pin is already safely within the 80% safe zone.
# When Android launcher applies its squircle mask, the sides will be 100% complete!
maskable_out = os.path.join(ICONS_DIR, "icon-512x512-maskable.png")
maskable_img = enhanced_img.resize((512, 512), Image.Resampling.LANCZOS)
maskable_img.save(maskable_out, "PNG", optimize=True)
print(f"Generated maskable icon (full-bleed, complete sides): {maskable_out}")

# 6. Generate splash screens
splashes = [
    ("splash-430x932.png", 430, 932),
    ("splash-390x844.png", 390, 844),
    ("splash-375x667.png", 375, 667),
    ("splash-768x1024.png", 768, 1024),
]

for name, sw, sh in splashes:
    splash = Image.new("RGB", (sw, sh), (238, 250, 244))
    icon_w = int(min(sw, sh) * 0.35)
    resized_center = styled_master.resize((icon_w, icon_w), Image.Resampling.LANCZOS)
    sx = (sw - icon_w) // 2
    sy = (sh - icon_w) // 2
    splash.paste(resized_center, (sx, sy), resized_center)
    splash.save(os.path.join(ICONS_DIR, name), "PNG", optimize=True)
    print(f"Generated splash: {name}")

# 7. Update screenshot if needed
screenshot_path = os.path.join(SCREENSHOTS_DIR, "mobile-home.png")
screenshot = Image.new("RGB", (390, 844), (238, 250, 244))
center_logo = styled_master.resize((170, 170), Image.Resampling.LANCZOS)
screenshot.paste(center_logo, ((390 - 170) // 2, 220), center_logo)
screenshot.save(screenshot_path, "PNG", optimize=True)
print(f"Generated screenshot: {screenshot_path}")

# Clean up temp test files in public
for f in os.listdir(os.path.join(ROOT, "public")):
    if f.startswith("test_") and f.endswith(".png"):
        os.remove(os.path.join(ROOT, "public", f))

print("\nDone! All icons updated with semi-rounded corners, sleek borders, and complete edge-to-edge sides.")
