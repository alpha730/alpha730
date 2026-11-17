import math, random, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

random.seed(7); np.random.seed(7)
S = 2                      # supersample
W, H = 792 * S, 432 * S
img = Image.new("RGB", (W, H))
px = np.zeros((H, W, 3), dtype=np.float32)

# --- night sky gradient with soft moon glow
top, bottom = np.array([10, 16, 26]), np.array([52, 78, 104])
for y in range(H):
    t = (y / (H * 0.9)) ** 1.3
    px[y, :, :] = top * (1 - min(t, 1)) + bottom * min(t, 1)
mx, my, mr = 456 * S, 60 * S, 30 * S
yy, xx = np.mgrid[0:H, 0:W]
d = np.sqrt((xx - mx) ** 2 + (yy - my) ** 2)
glow = np.clip(1 - d / (220 * S), 0, 1) ** 2 * 70
px += glow[..., None] * np.array([0.9, 0.95, 1.0])
moon = d < mr
px[moon] = np.array([238, 232, 212]) - (np.clip((xx[moon] - mx + 10 * S) / (2 * mr), 0, 1)[..., None] * 60)
img = Image.fromarray(np.clip(px, 0, 255).astype(np.uint8))
dr = ImageDraw.Draw(img)

# stars
for _ in range(70):
    x, y = random.randint(0, W), random.randint(0, int(H * 0.5))
    if math.hypot(x - mx, y - my) > 60 * S:
        b = random.randint(150, 235); r = random.choice([1, 1, 2])
        dr.ellipse([x - r, y - r, x + r, y + r], fill=(b, b, b))

# --- snowy ground
ground = [(0, H)]
for x in range(0, W + 1, 8):
    gx = x / S
    gy = 404 - 10 * math.exp(-((gx - 620) / 140) ** 2) + 3 * math.sin(gx / 37)
    ground.append((x, gy * S))
ground.append((W, H))
dr.polygon(ground, fill=(206, 210, 214))
for i in range(260):  # snow shading
    x = random.randint(0, W); y = random.randint(int(392 * S), H)
    dr.ellipse([x - 14, y - 4, x + 14, y + 4], fill=random.choice([(176, 188, 200), (226, 228, 230), (192, 200, 210)]))

# --- branches (recursive)
tips = []
def branch(x, y, ang, length, width, depth):
    if depth == 0 or length < 6 * S:
        tips.append((x, y)); return
    steps = 6
    cx, cy, a = x, y, ang
    for _ in range(steps):
        a += random.uniform(-0.12, 0.12)
        nx = cx + math.cos(a) * length / steps
        ny = cy - math.sin(a) * length / steps
        dr.line([cx, cy, nx, ny], fill=(214, 206, 188), width=max(1, int(width)))
        dr.line([cx + width * 0.3, cy, nx + width * 0.3, ny], fill=(150, 142, 128), width=max(1, int(width * 0.35)))
        cx, cy = nx, ny
        if depth <= 2: tips.append((cx, cy))
    n = 2 if depth > 2 else random.choice([2, 3])
    for i in range(n):
        spread = random.uniform(0.3, 0.6) * (1 if i % 2 else -1)
        branch(cx, cy, a + spread, length * random.uniform(0.62, 0.78), width * 0.66, depth - 1)

base_x, base_y = 620 * S, 384 * S
fork_y = 200 * S
for ang, ln in [(math.radians(150), 62), (math.radians(122), 66), (math.radians(96), 66),
                (math.radians(70), 66), (math.radians(40), 62), (math.radians(168), 52), (math.radians(14), 52)]:
    branch(base_x + random.uniform(-6, 6) * S, fork_y, ang, ln * S, 9 * S, 5)

# --- canopy leaves
reds = [(118, 14, 24), (160, 22, 34), (196, 30, 42), (222, 64, 58), (240, 110, 92)]
leaves = []
for (tx, ty) in tips:
    for _ in range(14):
        r = random.gauss(0, 16 * S)
        a = random.uniform(0, 2 * math.pi)
        lx, ly = tx + math.cos(a) * r, ty + math.sin(a) * r * 0.7
        leaves.append((ly, lx))
leaves.sort()
for ly, lx in leaves:
    # light from the moon (upper right), darker low and left
    light = 0.45 + 0.5 * (1 - (ly / S - 20) / 190) + 0.25 * ((lx / S - 620) / 170)
    light += random.uniform(-0.25, 0.25)
    idx = int(np.clip(light * 4.2 - 0.6, 0, 4))
    s = random.uniform(3, 6) * S
    rot = random.uniform(0, math.pi)
    pts = [(lx + math.cos(rot) * s, ly + math.sin(rot) * s), (lx + math.cos(rot + 1.9) * s * 0.45, ly + math.sin(rot + 1.9) * s * 0.45),
           (lx - math.cos(rot) * s, ly - math.sin(rot) * s), (lx + math.cos(rot - 1.2) * s * 0.45, ly + math.sin(rot - 1.2) * s * 0.45)]
    dr.polygon(pts, fill=reds[idx])

# --- trunk
def tx_at(y, side):
    t = (y - fork_y / S) / (384 - fork_y / S)
    half = 18 + 6 * t + 34 * max(0, t - 0.75) ** 2 * 16
    return 620 + side * half + 4 * math.sin(y / 23)
left = [(tx_at(y, -1) * S, y * S) for y in range(int(fork_y / S) - 10, 392, 4)]
right = [(tx_at(y, 1) * S, y * S) for y in range(391, int(fork_y / S) - 11, -4)]
dr.polygon(left + right, fill=(230, 224, 208))
for y in range(int(fork_y / S), 390, 3):  # shading on the shadow side
    xl, xr = tx_at(y, -1), tx_at(y, 1)
    dr.line([((xl + (xr - xl) * 0.62) * S, y * S), (xr * S, y * S)], fill=(168, 160, 146), width=3 * S)
for _ in range(60):  # bark marks
    y = random.uniform(fork_y / S + 6, 386)
    xl, xr = tx_at(y, -1), tx_at(y, 1)
    x0 = random.uniform(xl + 2, xr - 10)
    dr.line([(x0 * S, y * S), ((x0 + random.uniform(4, 12)) * S, (y + random.uniform(-1, 1)) * S)], fill=(52, 46, 40), width=random.choice([2, 3, 4]))
# roots
for sx, ex, ey in [(-1, 560, 398), (1, 690, 400), (-1, 588, 404), (1, 656, 405)]:
    dr.line([(620 + sx * 20) * S, 372 * S, ex * S, ey * S], fill=(214, 206, 188), width=7 * S)

# --- carved face
fy = 268
for ex in (608, 632):
    dr.polygon([((ex - 8) * S, fy * S), (ex * S, (fy - 5) * S), ((ex + 8) * S, fy * S), (ex * S, (fy + 4) * S)], fill=(40, 6, 10))
    dr.ellipse([(ex - 3.5) * S, (fy - 2.5) * S, (ex + 3.5) * S, (fy + 2.5) * S], fill=(200, 26, 38))
    dr.line([ex * S, (fy + 4) * S, (ex + random.uniform(-1, 1)) * S, (fy + 16) * S], fill=(170, 18, 30), width=2 * S)
dr.arc([608 * S, 296 * S, 632 * S, 312 * S], 200, 340, fill=(52, 44, 40), width=3 * S)

# fallen leaves on the snow
for _ in range(90):
    x = random.gauss(620, 110) * S; y = random.uniform(396, 428) * S
    s = random.uniform(2, 4) * S
    dr.ellipse([x - s, y - s * 0.5, x + s, y + s * 0.5], fill=random.choice(reds[:4]))

# --- raven flying across the moon
rx, ry = 446 * S, 70 * S
k = (14, 14, 16)
dr.ellipse([rx - 12 * S, ry - 5 * S, rx + 14 * S, ry + 6 * S], fill=k)
dr.ellipse([rx + 10 * S, ry - 6 * S, rx + 20 * S, ry + 3 * S], fill=k)
dr.polygon([(rx + 19 * S, ry - 3 * S), (rx + 28 * S, ry - 1 * S), (rx + 19 * S, ry + 1 * S)], fill=k)
dr.polygon([(rx - 10 * S, ry), (rx - 24 * S, ry - 4 * S), (rx - 24 * S, ry + 5 * S)], fill=k)
dr.polygon([(rx - 4 * S, ry - 3 * S), (rx - 14 * S, ry - 22 * S), (rx - 30 * S, ry - 30 * S), (rx - 20 * S, ry - 18 * S), (rx - 6 * S, ry + 1 * S)], fill=k)
dr.polygon([(rx + 4 * S, ry - 3 * S), (rx + 2 * S, ry - 24 * S), (rx + 10 * S, ry - 34 * S), (rx + 10 * S, ry - 18 * S), (rx + 8 * S, ry)], fill=k)
dr.ellipse([rx + 14 * S, ry - 3 * S, rx + 16 * S, ry - 1 * S], fill=(196, 30, 42))

img = img.filter(ImageFilter.GaussianBlur(1.2))
img.save(sys.argv[1] + "/hero_full.png")

# --- chunky pixel pass with a limited palette
P = 4  # pixel size at 792 px wide
small = img.resize((W // (P * S), H // (P * S)), Image.BILINEAR)
pal = np.array([
    (17, 17, 17), (28, 38, 51), (47, 72, 98), (47, 111, 154),
    (122, 140, 156), (196, 204, 210), (244, 236, 214), (182, 176, 160),
    (110, 13, 21), (196, 30, 42), (232, 98, 82),
], dtype=np.float32)
a = np.asarray(small).astype(np.float32)
bayer = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16 - 0.5
h, w = a.shape[:2]
a = a + bayer[np.arange(h)[:, None] % 4, np.arange(w)[None, :] % 4][..., None] * 22
dist = ((a[:, :, None, :] - pal[None, None]) ** 2).sum(-1)
q = pal[dist.argmin(-1)].astype(np.uint8)
out = Image.fromarray(q).resize((792 * 2, 432 * 2), Image.NEAREST)
out.save(sys.argv[1] + "/hero_pixel.png", optimize=True)
print("ok", out.size)
