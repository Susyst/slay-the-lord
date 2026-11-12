"""The app icon: the soul-link sigil struck through the Great Lord's gilt sunburst.

Drawn at 8x and downsampled, so the edges are clean at every size the installers need.
The teal diamond and its white rune are the game's own symbol for a bound soul; the dull
gold rays behind it are Hamon's mark, half broken by it.
"""
import math
from PIL import Image, ImageDraw, ImageFilter

S = 1024
SS = 4                      # supersample factor
N = S * SS


def lerp(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def rounded_mask(size, radius):
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return m


def build():
    c = N / 2
    img = Image.new("RGBA", (N, N), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # ---- the iron tile: a cold vertical gradient, darker at the foot
    top, bot = (0x1b, 0x18, 0x2e), (0x0b, 0x09, 0x14)
    for y in range(N):
        d.line([(0, y), (N, y)], fill=lerp(top, bot, y / N) + (255,))

    # ---- a pool of light behind the sigil, so the tile is not flat
    glow = Image.new("RGBA", (N, N), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i in range(34, 0, -1):
        r = N * 0.40 * i / 34
        gd.ellipse([c - r, c - r, c + r, c + r], fill=(0x1e, 0xc8, 0xba, 7))
    img = Image.alpha_composite(img, glow.filter(ImageFilter.GaussianBlur(N / 90)))
    d = ImageDraw.Draw(img)

    # ---- Hamon's sunburst: the Great Lord's mark, old gilt, still burning behind everything
    inner, outer = N * 0.150, N * 0.430
    for i in range(16):
        a = i * math.pi / 8 + math.pi / 16
        long = i % 2 == 0
        tip = outer if long else outer * 0.74
        half = 0.055 if long else 0.034
        pts = [(c + math.cos(a) * tip, c + math.sin(a) * tip),
               (c + math.cos(a + half) * inner, c + math.sin(a + half) * inner),
               (c + math.cos(a - half) * inner, c + math.sin(a - half) * inner)]
        d.polygon(pts, fill=(0xb4, 0x82, 0x28, 255) if long else (0x7e, 0x59, 0x18, 255))
    d.ellipse([c - inner, c - inner, c + inner, c + inner], fill=(0x8a, 0x62, 0x1c, 255))
    d.ellipse([c - inner * 0.62, c - inner * 0.62, c + inner * 0.62, c + inner * 0.62], fill=(0x2a, 0x1e, 0x0c, 255))

    # ---- the ring that held it, broken in three places
    rr = N * 0.452
    for i in range(3):
        a0 = -70 + i * 120
        d.arc([c - rr, c - rr, c + rr, c + rr], a0, a0 + 86, fill=(0xc9, 0xa2, 0x58, 255), width=int(N * 0.016))

    # ---- the soul shard: the crystal that floats over every soul station, cut in two facets
    def shard(scale, lit, dark):
        top, bottom, wide, waist = c - N * 0.345 * scale, c + N * 0.340 * scale, N * 0.175 * scale, c - N * 0.045 * scale
        d.polygon([(c, top), (c + wide, waist), (c, bottom), (c - wide, waist)], fill=dark)
        d.polygon([(c, top), (c + wide, waist), (c, bottom)], fill=lit)
    shard(1.08, (0x0e, 0x0a, 0x1c, 255), (0x0e, 0x0a, 0x1c, 255))
    shard(1.0, (0x6a, 0xf0, 0xe4, 255), (0x15, 0x9c, 0x96, 255))
    # the inner fire, and the white edge where the light catches
    shard(0.52, (0xd8, 0xff, 0xf8, 255), (0x3e, 0xd8, 0xcc, 255))
    d.line([(c, c - N * 0.345), (c + N * 0.175, c - N * 0.045)], fill=(0xff, 0xfd, 0xf0, 255), width=int(N * 0.013))

    # ---- the rune cut into the shard: a stroke with two barbs, the mark a bound soul leaves
    gx, gy, gs = c, c + N * 0.02, N * 0.105
    d.line([(gx, gy - gs), (gx, gy + gs)], fill=(0x0b, 0x2e, 0x2c, 255), width=int(N * 0.020))
    d.line([(gx, gy - gs * 0.25), (gx + gs * 0.72, gy - gs * 0.95)], fill=(0x0b, 0x2e, 0x2c, 255), width=int(N * 0.020))
    d.line([(gx, gy + gs * 0.35), (gx - gs * 0.72, gy - gs * 0.35)], fill=(0x0b, 0x2e, 0x2c, 255), width=int(N * 0.020))

    # ---- three motes, the way the link throws them when it holds
    for ang, rad in ((-0.95, 0.40), (0.62, 0.405), (2.45, 0.385)):
        x, y = c + math.cos(ang) * N * rad, c + math.sin(ang) * N * rad
        s = N * 0.017
        d.polygon([(x, y - s * 2.1), (x + s, y), (x, y + s * 2.1), (x - s, y)], fill=(0x6a, 0xf0, 0xe4, 255))

    # ---- bronze rim around the whole tile
    pad = N * 0.035
    d.rounded_rectangle([pad, pad, N - pad, N - pad], radius=N * 0.165,
                        outline=(0xc9, 0xa2, 0x58, 255), width=int(N * 0.022))
    d.rounded_rectangle([pad * 1.9, pad * 1.9, N - pad * 1.9, N - pad * 1.9], radius=N * 0.13,
                        outline=(0x6a, 0x4e, 0x22, 160), width=int(N * 0.008))

    # ---- a soft top light so the iron reads as metal, not paper
    sheen = Image.new("RGBA", (N, N), (0, 0, 0, 0))
    ImageDraw.Draw(sheen).ellipse([-N * 0.3, -N * 0.75, N * 1.3, N * 0.30], fill=(255, 255, 255, 16))
    img = Image.alpha_composite(img, sheen.filter(ImageFilter.GaussianBlur(N / 40)))

    img = img.resize((S, S), Image.LANCZOS)
    img.putalpha(rounded_mask(S, int(S * 0.185)))
    return img


if __name__ == "__main__":
    out = build()
    out.save("app/app-icon.png")
    for n in (256, 128, 64, 32):
        out.resize((n, n), Image.LANCZOS).save(f"/tmp/icon_{n}.png")
    print("written")
