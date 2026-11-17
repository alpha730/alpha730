import math, random, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = sys.argv[1]
S = 2
PAL = np.array([
    (17, 17, 17), (28, 38, 51), (47, 72, 98), (47, 111, 154), (122, 160, 186), (196, 214, 224),
    (244, 240, 230), (182, 176, 160), (110, 13, 21), (196, 30, 42), (232, 98, 82),
    (52, 34, 24), (110, 72, 42), (176, 134, 84), (226, 200, 150), (245, 200, 66), (232, 128, 40),
    (96, 96, 100), (170, 172, 176), (60, 18, 24), (204, 170, 116),
], dtype=np.float32)
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16 - 0.5


def canvas(w, h):
    return np.zeros((h * S, w * S, 3), dtype=np.float32)


def vgrad(a, top, bottom, y0=0.0, y1=1.0, power=1.0):
    h = a.shape[0]
    for y in range(h):
        t = np.clip((y / h - y0) / (y1 - y0), 0, 1) ** power
        a[y, :, :] = np.array(top) * (1 - t) + np.array(bottom) * t
    return a


def glow(a, cx, cy, r, color, strength):
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt((xx - cx * S) ** 2 + (yy - cy * S) ** 2)
    g = np.clip(1 - d / (r * S), 0, 1) ** 2 * strength
    a += g[..., None] * np.array(color) / 255
    return a


def to_img(a):
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def pixelate(img, w, h, name, P=3, blur=1.1, dither=20):
    img = img.filter(ImageFilter.GaussianBlur(blur))
    small = img.resize((w // P, h // P), Image.BILINEAR)
    a = np.asarray(small).astype(np.float32)
    hh, ww = a.shape[:2]
    a = a + BAYER[np.arange(hh)[:, None] % 4, np.arange(ww)[None, :] % 4][..., None] * dither
    dist = ((a[:, :, None, :] - PAL[None, None]) ** 2).sum(-1)
    q = PAL[dist.argmin(-1)].astype(np.uint8)
    Image.fromarray(q).resize((w * 2, h * 2), Image.NEAREST).save(f"{OUT}/{name}.png", optimize=True)


def P(*pts):
    return [(x * S, y * S) for x, y in pts]


def stars(dr, w, ymax, n=30):
    for _ in range(n):
        x, y = random.uniform(0, w), random.uniform(0, ymax)
        b = random.randint(150, 230)
        dr.ellipse([x * S - 1, y * S - 1, x * S + 2, y * S + 2], fill=(b, b, b))


# ---------------------------------------------------------------- I. the Wall
def wall():
    random.seed(11)
    w, h = 384, 236
    a = vgrad(canvas(w, h), (12, 18, 30), (46, 68, 92), 0, 0.3)
    img = to_img(a); dr = ImageDraw.Draw(img)
    stars(dr, w, 36, 20)
    # ice face
    top = [(x, 38 + 4 * math.sin(x / 13) + random.uniform(-2, 2)) for x in range(0, w + 8, 8)]
    for x in range(0, w * S):
        gx = x / S
        ty = 38 + 4 * math.sin(gx / 13)
        base = random.uniform(-14, 14)
        for y in range(int(ty * S), 212 * S, 2):
            gy = y / S
            t = (gy - ty) / (212 - ty)
            c = np.array([214, 228, 236]) * (1 - t) + np.array([110, 150, 180]) * t
            c = c + base + 10 * math.sin(gx / 3.7 + gy / 40)
            img.putpixel((x, y), tuple(int(v) for v in np.clip(c, 0, 255)))
            if y + 1 < h * S:
                img.putpixel((x, y + 1), tuple(int(v) for v in np.clip(c, 0, 255)))
    dr = ImageDraw.Draw(img)
    for y in range(60, 210, 22):  # strata
        dr.line(P(*[(x, y + 3 * math.sin(x / 17 + y)) for x in range(0, w + 6, 6)]), fill=(150, 184, 206), width=S)
    for _ in range(26):  # cracks
        x, y = random.uniform(0, w), random.uniform(50, 200)
        pts = [(x, y)]
        for _ in range(random.randint(3, 7)):
            x += random.uniform(-6, 6); y += random.uniform(4, 10); pts.append((x, y))
        dr.line(P(*pts), fill=random.choice([(72, 110, 140), (240, 248, 252)]), width=S)
    dr.polygon(P(*[(0, 40)] + top + [(w, 40), (w, 34), (0, 34)]), fill=(246, 248, 250))  # snow cap
    for tx in (40, 120, 200, 280, 360):  # torches on top
        img2 = np.asarray(img).astype(np.float32)
        img2 = glow(img2, tx, 32, 18, (255, 150, 60), 160)
        img = to_img(img2); dr = ImageDraw.Draw(img)
        dr.ellipse(P((tx - 2, 28), (tx + 2, 34)), fill=(255, 210, 90))
    # arrows stuck in the ice
    for ax, ay in [(150, 96), (176, 122), (128, 140), (210, 104), (190, 158), (236, 136), (160, 176)]:
        ang = math.radians(random.uniform(195, 215))
        ex, ey = ax + math.cos(ang) * 28, ay - math.sin(ang) * 28
        dr.line(P((ax, ay), (ex, ey)), fill=(50, 34, 22), width=2 * S)
        dr.polygon(P((ex, ey), (ex - 6, ey - 3), (ex - 4, ey + 1)), fill=(230, 230, 226))
        dr.polygon(P((ex, ey), (ex - 6, ey + 4), (ex - 3, ey)), fill=(196, 30, 42))
        for _ in range(4):
            qx, qy = ax + random.uniform(-4, 4), ay + random.uniform(-4, 4)
            dr.ellipse(P((qx, qy), (qx + 2, qy + 2)), fill=(250, 252, 255))
    # snow ground and pine forest
    dr.polygon(P(*[(x, 210 + 3 * math.sin(x / 19)) for x in range(0, w + 8, 8)] + [(w, h), (0, h)]), fill=(232, 238, 242))
    for px in list(range(-6, 120, 13)) + list(range(268, 400, 12)):
        ph = random.uniform(30, 52); bx = px + random.uniform(-3, 3); by = 222 + random.uniform(-3, 3)
        for k in range(4):
            yk = by - ph * k / 4
            wk = (ph * 0.42) * (1 - k / 5)
            dr.polygon(P((bx - wk, yk), (bx + wk, yk), (bx, yk - ph * 0.42)), fill=(18, 26, 34))
    for _ in range(5):
        x = random.uniform(130, 260); y = random.uniform(222, 232)
        dr.line(P((x, y), (x + random.uniform(10, 18), y + random.uniform(-3, 3))), fill=(50, 34, 22), width=2 * S)
    pixelate(img, w, h, "wall")


# ---------------------------------------------------------------- II. the raven
def raven():
    random.seed(5)
    w, h = 384, 236
    a = vgrad(canvas(w, h), (10, 14, 22), (40, 58, 80), 0, 1, 1.2)
    a = glow(a, 236, 92, 150, (180, 190, 210), 90)
    img = to_img(a); dr = ImageDraw.Draw(img)
    stars(dr, w, 120, 26)
    mx, my, mr = 236, 92, 66
    dr.ellipse(P((mx - mr, my - mr), (mx + mr, my + mr)), fill=(236, 230, 210))
    for _ in range(14):
        cx, cy, r = mx + random.uniform(-48, 40), my + random.uniform(-48, 44), random.uniform(4, 13)
        dr.ellipse(P((cx - r, cy - r), (cx + r, cy + r)), fill=(206, 200, 182))
    # branch
    br = [(-10, 200), (60, 188), (130, 182), (200, 186), (270, 176), (330, 182), (400, 170)]
    dr.line(P(*br), fill=(36, 24, 18), width=11 * S, joint="curve")
    dr.line(P(*[(x, y - 3) for x, y in br]), fill=(80, 56, 38), width=3 * S, joint="curve")
    dr.line(P((270, 176), (300, 150), (318, 138)), fill=(36, 24, 18), width=5 * S)
    k = (14, 14, 18)
    # tail, body, head
    dr.polygon(P((150, 150), (96, 214), (112, 220), (176, 166)), fill=k)
    dr.polygon(P((140, 150), (160, 110), (198, 92), (236, 96), (244, 120), (224, 158), (188, 176), (154, 170)), fill=k)
    dr.ellipse(P((216, 68), (262, 108)), fill=k)
    dr.polygon(P((254, 78), (304, 90), (282, 98), (256, 102)), fill=(24, 24, 28))
    dr.line(P((256, 88), (300, 90)), fill=(70, 70, 76), width=S)
    for _ in range(14):  # throat hackles
        x = random.uniform(230, 252); y = random.uniform(98, 118)
        dr.line(P((x, y), (x + random.uniform(-2, 4), y + random.uniform(6, 10))), fill=k, width=2 * S)
    for _ in range(170):  # feather sheen
        x = random.uniform(150, 240); y = random.uniform(100, 168)
        if (x - 192) ** 2 / 46 ** 2 + (y - 134) ** 2 / 36 ** 2 < 1:
            dr.line(P((x, y), (x - random.uniform(6, 14), y + random.uniform(2, 7))), fill=random.choice([(40, 52, 74), (28, 32, 44), (60, 78, 110)]), width=S)
    dr.polygon(P((166, 118), (214, 108), (226, 140), (172, 160)), fill=(20, 22, 30))  # folded wing
    for i in range(6):
        dr.line(P((172 + i * 7, 158 - i * 2), (210 + i * 3, 116 + i * 4)), fill=(46, 60, 88), width=S)
    dr.ellipse(P((238, 80), (246, 88)), fill=(200, 26, 38))
    dr.ellipse(P((241, 81), (243, 83)), fill=(255, 240, 230))
    for lx in (196, 210):  # legs gripping the branch
        dr.line(P((lx, 168), (lx + 2, 184)), fill=(30, 30, 34), width=2 * S)
        dr.line(P((lx - 5, 186), (lx + 8, 186)), fill=(30, 30, 34), width=2 * S)
    pixelate(img, w, h, "raven")


# ---------------------------------------------------------------- III. sealed scroll
def scroll():
    random.seed(9)
    w, h = 384, 236
    a = vgrad(canvas(w, h), (40, 26, 18), (70, 46, 30), 0, 1)
    img = to_img(a); dr = ImageDraw.Draw(img)
    for y in range(0, h, 5):  # wood grain
        dr.line(P(*[(x, y + 3 * math.sin(x / 31 + y)) for x in range(0, w + 8, 8)]), fill=random.choice([(52, 34, 22), (84, 56, 36), (60, 40, 26)]), width=S)
    a = np.asarray(img).astype(np.float32)
    a = glow(a, 352, 62, 190, (255, 170, 80), 120)
    img = to_img(a); dr = ImageDraw.Draw(img)
    # parchment sheet
    sheet = [(52, 72), (318, 62), (330, 202), (60, 212)]
    dr.polygon(P(*sheet), fill=(226, 200, 150))
    for _ in range(900):
        x, y = random.uniform(56, 326), random.uniform(66, 208)
        dr.point((x * S, y * S), fill=random.choice([(206, 178, 126), (236, 214, 168), (196, 164, 112)]))
    dr.line(P(*sheet, sheet[0]), fill=(150, 112, 68), width=2 * S)
    for (x0, y0, x1, y1) in [(40, 66, 66, 216), (310, 56, 338, 206)]:  # rolled ends
        dr.rounded_rectangle(P((x0, y0), (x1, y1)), radius=12 * S, fill=(196, 160, 104))
        dr.line(P((x0 + 6, y0 + 8), (x0 + 8, y1 - 8)), fill=(240, 220, 176), width=2 * S)
        dr.line(P((x1 - 6, y0 + 8), (x1 - 4, y1 - 8)), fill=(130, 92, 52), width=3 * S)
    for row in range(9):  # handwriting
        y = 86 + row * 12.5
        x = 82
        while x < 286:
            ln = random.uniform(8, 26)
            dr.line(P((x, y + random.uniform(-1, 1)), (x + ln, y + random.uniform(-1, 1))), fill=(70, 46, 30), width=S)
            x += ln + random.uniform(4, 8)
    # wax seal
    cx, cy = 262, 182
    dr.ellipse(P((cx - 20, cy - 18), (cx + 20, cy + 20)), fill=(140, 16, 26))
    dr.ellipse(P((cx - 15, cy - 13), (cx + 15, cy + 15)), fill=(196, 30, 42))
    dr.ellipse(P((cx - 9, cy - 7), (cx + 9, cy + 9)), fill=(150, 18, 28))
    dr.line(P((cx - 8, cy - 10), (cx - 2, cy - 14)), fill=(240, 110, 100), width=2 * S)
    dr.polygon(P((cx - 6, cy + 18), (cx - 2, cy + 30), (cx + 2, cy + 18)), fill=(140, 16, 26))
    # quill
    dr.line(P((24, 226), (130, 150)), fill=(60, 40, 26), width=2 * S)
    for i in range(22):
        t = i / 22
        x, y = 70 + 60 * t, 190 - 42 * t
        dr.line(P((x, y), (x - 10 + 4 * t, y - 14 + 4 * t)), fill=(236, 232, 222), width=2 * S)
        dr.line(P((x, y), (x + 12 - 4 * t, y + 8)), fill=(214, 208, 196), width=2 * S)
    # candle
    dr.rectangle(P((344, 70), (362, 150)), fill=(232, 222, 196))
    dr.line(P((358, 72), (358, 148)), fill=(196, 182, 150), width=3 * S)
    dr.polygon(P((344, 72), (348, 86), (352, 72)), fill=(244, 236, 214))
    dr.ellipse(P((338, 146), (368, 158)), fill=(150, 112, 70))
    dr.line(P((353, 70), (353, 62)), fill=(30, 20, 14), width=S)
    dr.ellipse(P((347, 38), (359, 64)), fill=(245, 180, 60))
    dr.ellipse(P((350, 46), (356, 62)), fill=(255, 238, 170))
    pixelate(img, w, h, "scroll")


# ---------------------------------------------------------------- IV. dragonfire
def dragon():
    random.seed(3)
    w, h = 384, 236
    a = vgrad(canvas(w, h), (16, 20, 34), (150, 60, 40), 0, 1, 1.6)
    a = glow(a, 300, 120, 200, (255, 140, 60), 80)
    img = to_img(a); dr = ImageDraw.Draw(img)
    stars(dr, w, 60, 14)
    # mountains
    for layer, col, base in [(0, (40, 34, 44), 186), (1, (20, 18, 24), 206)]:
        pts = [(0, h)]
        x = 0
        while x <= w + 20:
            pts.append((x, base - random.uniform(10, 44 - layer * 12)))
            x += random.uniform(18, 34)
        pts.append((w, h))
        dr.polygon(P(*pts), fill=col)
    # fire cone from the mouth
    fire = Image.new("RGBA", img.size, (0, 0, 0, 0)); fd = ImageDraw.Draw(fire)
    mx, my = 214, 92
    for i in range(520):
        t = random.random() ** 0.8
        x = mx + t * 180 + random.uniform(-6, 6)
        y = my + t * 34 + random.gauss(0, 4 + 30 * t)
        r = 3 + 16 * t * random.uniform(0.6, 1.2)
        core = abs(y - (my + t * 34)) / (6 + 30 * t)
        col = (255, 244, 190) if core < 0.3 and t < 0.6 else (255, 196, 60) if core < 0.7 else (232, 96, 30) if core < 1.2 else (180, 40, 30)
        fd.ellipse(P((x - r, y - r), (x + r, y + r)), fill=col + (200,))
    img.paste(fire.filter(ImageFilter.GaussianBlur(3)), (0, 0), fire.filter(ImageFilter.GaussianBlur(3)))
    dr = ImageDraw.Draw(img)
    k = (14, 10, 12); mem = (90, 16, 22); memlit = (150, 34, 30)
    # far wing
    dr.polygon(P((132, 98), (96, 22), (126, 40), (150, 18), (164, 46), (186, 34), (170, 96)), fill=mem)
    # tail
    dr.line(P((86, 124), (54, 140), (28, 150), (10, 140), (2, 124)), fill=k, width=7 * S, joint="curve")
    dr.polygon(P((0, 118), (8, 128), (-6, 134)), fill=k)
    # body and neck
    dr.polygon(P((80, 118), (110, 104), (150, 98), (178, 96), (196, 86), (206, 80), (214, 84), (204, 96), (184, 110), (150, 120), (112, 128)), fill=k)
    # head
    dr.polygon(P((200, 76), (218, 70), (232, 80), (236, 90), (222, 96), (206, 92)), fill=k)
    dr.polygon(P((206, 74), (198, 60), (212, 70)), fill=k)
    dr.polygon(P((214, 72), (212, 56), (222, 70)), fill=k)
    dr.ellipse(P((218, 77), (222, 81)), fill=(255, 200, 60))
    # near wing: bones and lit membrane
    sh = (140, 100)
    tips = [(54, 6), (98, -4), (148, 0), (192, 20), (212, 52)]
    for i in range(len(tips) - 1):
        a0, a1 = tips[i], tips[i + 1]
        dr.polygon(P(sh, a0, ((a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2 + 18), a1), fill=memlit if i % 2 else mem)
    for tx, ty in tips:
        dr.line(P(sh, (tx, ty)), fill=k, width=3 * S)
    dr.line(P((100, 104), (82, 132), (74, 140)), fill=k, width=4 * S)
    dr.line(P((150, 116), (146, 138), (138, 146)), fill=k, width=4 * S)
    pixelate(img, w, h, "dragon")


# ---------------------------------------------------------------- the maester's chain
def chain():
    random.seed(2)
    w, h = 300, 272
    a = canvas(w, h)
    yy, xx = np.mgrid[0:h * S, 0:w * S]
    d = np.sqrt((xx - w * S / 2) ** 2 + (yy - h * S / 2) ** 2) / (w * S)
    a[:] = (np.array([96, 18, 28]) * (1 - d[..., None] * 1.4)).clip(20, 255)
    img = to_img(a); dr = ImageDraw.Draw(img)
    metals = [((92, 92, 98), (200, 202, 208)), ((150, 92, 40), (236, 170, 100)), ((176, 132, 40), (252, 222, 120)),
              ((150, 152, 158), (240, 242, 246)), ((44, 44, 50), (130, 132, 140)), ((160, 76, 40), (240, 150, 100))]
    def ell(cx, cy, rx, ry, ang, n=40):
        return [(cx + rx * math.cos(t) * math.cos(ang) - ry * math.sin(t) * math.sin(ang),
                 cy + rx * math.cos(t) * math.sin(ang) + ry * math.sin(t) * math.cos(ang)) for t in [i / n * 2 * math.pi for i in range(n)]]
    def cy_at(x):
        return 150 - 0.003 * (x - 150) ** 2
    bg = (34, 6, 10)
    xs = [38 + i * 28 for i in range(9)]
    order = [i for i in range(9) if i % 2 == 1] + [i for i in range(9) if i % 2 == 0]
    for i in order:
        x = xs[i]; y = cy_at(x)
        slope = -0.006 * (x - 150)
        ang = math.atan(slope)
        base, hi = metals[i % 6]
        if i % 2 == 0:
            dr.polygon(P(*ell(x, y, 26, 15, ang)), fill=base)
            dr.polygon(P(*ell(x, y, 17, 7, ang)), fill=bg)
            pts = ell(x, y - 2, 23, 12, ang)
            dr.line(P(*pts[22:34]), fill=hi, width=3 * S)
        else:
            dr.polygon(P(*ell(x, y, 26, 6, ang)), fill=base)
            pts = ell(x, y - 2, 22, 3, ang)
            dr.line(P(*pts[22:34]), fill=hi, width=2 * S)
    # a pendant disc at the lowest point
    dr.line(P((150, cy_at(150) + 12), (150, cy_at(150) + 40)), fill=(120, 122, 130), width=2 * S)
    dr.ellipse(P((132, cy_at(150) + 38), (168, cy_at(150) + 74)), fill=(176, 132, 40))
    dr.ellipse(P((138, cy_at(150) + 44), (162, cy_at(150) + 68)), fill=(140, 100, 30))
    dr.arc(P((134, cy_at(150) + 40), (166, cy_at(150) + 72)), 200, 280, fill=(252, 222, 120), width=3 * S)
    pixelate(img, w, h, "chain", P=3)


# ---------------------------------------------------------------- parchment map
def parchmap():
    random.seed(4)
    w, h = 300, 292
    a = canvas(w, h); a[:] = np.array([226, 200, 150])
    yy, xx = np.mgrid[0:h * S, 0:w * S]
    d = np.sqrt((xx - w * S / 2) ** 2 + (yy - h * S / 2) ** 2) / (w * S * 0.7)
    m = np.clip(d - 0.5, 0, 1)[..., None] * 1.6
    a = a * (1 - np.clip(m, 0, 0.8)) + np.array([120, 80, 46]) * np.clip(m, 0, 0.8)
    img = to_img(a); dr = ImageDraw.Draw(img)
    for _ in range(9):
        x, y, r = random.uniform(0, w), random.uniform(0, h), random.uniform(10, 30)
        dr.ellipse(P((x - r, y - r), (x + r, y + r)), outline=(186, 150, 100), width=S)
    for y in range(14, h, 10):  # sea hatching
        dr.line(P((6, y), (40, y)), fill=(176, 140, 96), width=S)
    pts = []
    for i in range(64):
        t = i / 64 * 2 * math.pi
        r = 92 + 18 * math.sin(3 * t) + 10 * math.sin(7 * t + 1) + random.uniform(-4, 4)
        pts.append((154 + math.cos(t) * r * 0.8, 150 + math.sin(t) * r))
    dr.polygon(P(*pts), fill=(232, 210, 164))
    dr.line(P(*pts, pts[0]), fill=(90, 58, 34), width=2 * S)
    for _ in range(12):  # mountains
        x, y = random.uniform(110, 210), random.uniform(70, 120)
        dr.line(P((x - 6, y + 4), (x, y - 5), (x + 6, y + 4)), fill=(90, 58, 34), width=S)
    for _ in range(18):  # forests
        x, y = random.uniform(100, 220), random.uniform(160, 220)
        dr.ellipse(P((x - 2.5, y - 2.5), (x + 2.5, y + 2.5)), fill=(110, 80, 46))
    dr.line(P((150, 120), (140, 160), (160, 200), (150, 236)), fill=(120, 150, 170), width=2 * S)
    for mx, my in [(168, 104), (196, 126), (150, 140), (186, 160), (214, 150), (166, 190)]:
        dr.ellipse(P((mx - 8, my - 8), (mx + 8, my + 8)), fill=(150, 18, 28))
        dr.ellipse(P((mx - 5, my - 5), (mx + 5, my + 5)), fill=(200, 30, 42))
        dr.line(P((mx - 3, my - 4), (mx + 1, my - 6)), fill=(240, 120, 110), width=S)
    cx, cy = 252, 246  # compass rose
    dr.polygon(P((cx, cy - 22), (cx + 5, cy - 5), (cx + 22, cy), (cx + 5, cy + 5), (cx, cy + 22), (cx - 5, cy + 5), (cx - 22, cy), (cx - 5, cy - 5)), fill=(232, 210, 164), outline=(90, 58, 34))
    dr.polygon(P((cx, cy - 22), (cx + 5, cy - 5), (cx, cy)), fill=(196, 30, 42))
    pixelate(img, w, h, "map", P=3, dither=14)


for f in (wall, raven, scroll, dragon, chain):
    f(); print("ok", f.__name__)
