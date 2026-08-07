"""Generates small, tasteful animated GIFs for the Weekly Recap email.

Run once: `python3 scripts/gen_recap_gifs.py`. Output goes to public/newsletter/.
One header banner per week-*mood* (slow / interesting / busy / heavy) plus one
shimmer divider. The palette is strictly black/white + cream — no colour — so
all the colour in the newsletter comes from the article photographs. Each mood
animates at a different tempo so the header quietly signals the week's tone.
Committed to the repo so emails can hot-link them.
"""
import math
import os
import random

from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "newsletter")
os.makedirs(OUT, exist_ok=True)

W = 600
H = 132
FRAMES = 18

CREAM = (250, 248, 243)
INK = (23, 22, 20)
CHARCOAL = (60, 58, 54)

# (name/mood, accent, soft-bg, style) — monochrome only. Tempo/style differs
# per mood: slow = calm bubbles, interesting = sparkles, busy = fast streaks,
# heavy = a somber slow drift.
THEMES = [
    ("slow", CHARCOAL, CREAM, "bubbles"),
    ("interesting", INK, CREAM, "sparkles"),
    ("busy", INK, CREAM, "streaks"),
    ("heavy", INK, (238, 236, 231), "confetti"),
]


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def confetti_frame(i, accent, soft, pieces):
    img = Image.new("RGB", (W, H), soft)
    d = ImageDraw.Draw(img)
    for (x, y0, hue, size, speed, rot) in pieces:
        y = (y0 + i * speed) % (H + 20) - 10
        c = lerp(accent, (255, 255, 255), hue * 0.6)
        d.rectangle([x, y, x + size, y + size], fill=c)
    return img


def bubbles_frame(i, accent, soft, pieces):
    img = Image.new("RGB", (W, H), soft)
    d = ImageDraw.Draw(img)
    for (x, y0, hue, r, speed) in pieces:
        y = H - ((y0 + i * speed) % (H + 30)) + 15
        c = lerp(accent, (255, 255, 255), 0.35 + hue * 0.5)
        d.ellipse([x - r, y - r, x + r, y + r], outline=c, width=2)
    return img


def sparkles_frame(i, accent, soft, pieces):
    img = Image.new("RGB", (W, H), soft)
    d = ImageDraw.Draw(img)
    for (x, y, phase, size) in pieces:
        t = (math.sin((i / FRAMES) * 2 * math.pi + phase) + 1) / 2
        s = int(size * (0.4 + 0.6 * t))
        c = lerp(soft, accent, 0.3 + 0.7 * t)
        d.line([x - s, y, x + s, y], fill=c, width=2)
        d.line([x, y - s, x, y + s], fill=c, width=2)
    return img


def streaks_frame(i, accent, soft, pieces):
    img = Image.new("RGB", (W, H), soft)
    d = ImageDraw.Draw(img)
    for (x0, y, hue, ln, speed) in pieces:
        x = (x0 + i * speed) % (W + 80) - 40
        c = lerp(accent, (255, 255, 255), hue * 0.6)
        d.line([x, y, x + ln, y - ln * 0.5], fill=c, width=3)
    return img


def build_header(name, accent, soft, style):
    rnd = random.Random(hash(name) & 0xFFFF)
    frames = []
    if style == "confetti":
        pieces = [
            (rnd.randint(0, W), rnd.randint(0, H), rnd.random(),
             rnd.randint(5, 11), rnd.uniform(3, 8), 0)
            for _ in range(40)
        ]
        gen = lambda i: confetti_frame(i, accent, soft, pieces)
    elif style == "bubbles":
        pieces = [
            (rnd.randint(0, W), rnd.randint(0, H), rnd.random(),
             rnd.randint(6, 18), rnd.uniform(3, 7))
            for _ in range(22)
        ]
        gen = lambda i: bubbles_frame(i, accent, soft, pieces)
    elif style == "sparkles":
        pieces = [
            (rnd.randint(0, W), rnd.randint(0, H), rnd.uniform(0, 6.28),
             rnd.randint(5, 12))
            for _ in range(34)
        ]
        gen = lambda i: sparkles_frame(i, accent, soft, pieces)
    else:
        pieces = [
            (rnd.randint(0, W), rnd.randint(0, H), rnd.random(),
             rnd.randint(20, 46), rnd.uniform(6, 12))
            for _ in range(26)
        ]
        gen = lambda i: streaks_frame(i, accent, soft, pieces)
    for i in range(FRAMES):
        frames.append(gen(i).convert("P", palette=Image.ADAPTIVE, colors=64))
    path = os.path.join(OUT, f"recap-{name}.gif")
    frames[0].save(path, save_all=True, append_images=frames[1:],
                   duration=90, loop=0, optimize=True, disposal=2)
    print("wrote", path, os.path.getsize(path), "bytes")


def build_divider():
    """One monochrome shimmer bar shared by every issue (ink on cream)."""
    dw, dh = 600, 6
    frames = []
    for i in range(FRAMES):
        img = Image.new("RGB", (dw, dh), CREAM)
        d = ImageDraw.Draw(img)
        head = int((i / FRAMES) * (dw + 120)) - 60
        for x in range(dw):
            dist = abs(x - head)
            t = max(0.0, 1 - dist / 90)
            d.line([x, 0, x, dh], fill=lerp(CREAM, INK, 0.2 + 0.7 * t))
        frames.append(img.convert("P", palette=Image.ADAPTIVE, colors=32))
    path = os.path.join(OUT, "divider.gif")
    frames[0].save(path, save_all=True, append_images=frames[1:],
                   duration=80, loop=0, optimize=True, disposal=2)
    print("wrote", path, os.path.getsize(path), "bytes")


for name, accent, soft, style in THEMES:
    build_header(name, accent, soft, style)
build_divider()
print("done")
