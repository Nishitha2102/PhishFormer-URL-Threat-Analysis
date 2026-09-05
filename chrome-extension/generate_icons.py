import os
from PIL import Image, ImageDraw

def create_shield_icon(size, filename):
    # Create RGBA image with dark background and glowing cyan/blue shield
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Shield shape points
    margin = int(size * 0.1)
    w = size - 2 * margin
    h = size - 2 * margin
    
    # Coordinates relative to margin
    x0, y0 = margin, margin
    
    points = [
        (x0 + w / 2, y0),                # Top center
        (x0 + w, y0 + h * 0.25),         # Top right
        (x0 + w, y0 + h * 0.6),          # Mid right
        (x0 + w / 2, y0 + h),            # Bottom tip
        (x0, y0 + h * 0.6),              # Mid left
        (x0, y0 + h * 0.25)              # Top left
    ]
    
    # Draw dark fill shield
    draw.polygon(points, fill=(15, 23, 42, 255), outline=(0, 230, 118, 255), width=max(1, int(size * 0.08)))
    
    # Draw checkmark inside
    cx = size / 2
    cy = size / 2
    s = size * 0.18
    check_points = [
        (cx - s * 0.8, cy),
        (cx - s * 0.2, cy + s * 0.6),
        (cx + s * 0.9, cy - s * 0.5)
    ]
    draw.line(check_points, fill=(0, 230, 118, 255), width=max(1, int(size * 0.1)))
    
    out_dir = os.path.join(os.path.dirname(__file__), '..', 'chrome-extension', 'icons')
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, filename)
    img.save(out_path, 'PNG')
    print(f"Saved {out_path}")

create_shield_icon(16, "icon16.png")
create_shield_icon(48, "icon48.png")
create_shield_icon(128, "icon128.png")
