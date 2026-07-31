"""
Single source of truth for the apotheke mark.

Everything here is derived from the 'a' of the wordmark, so the favicon, the
touch icon and the README header logo can never drift from the logotype.

Outputs:
  app/icon.png          favicon, rounded black tile with a white glyph
  app/apple-icon.png    touch icon, full-bleed square (iOS applies its own mask)
  public/mark.png       bare glyph, black ink, for light backgrounds
  public/mark-dark.png  bare glyph, white ink, for dark backgrounds
"""
from PIL import Image, ImageDraw

WORDMARK = 'public/wordmark.png'
A_RIGHT = 120          # column where the 'a' ends and the 'p' begins

src = Image.open(WORDMARK).convert('RGBA')
glyph = src.crop((0, 0, A_RIGHT, src.height))
glyph = glyph.crop(glyph.getbbox())
gw, gh = glyph.size


def inked(rgb):
    """Recolour the glyph, keeping its alpha."""
    return Image.merge('RGBA', (*[Image.new('L', glyph.size, c) for c in rgb],
                                glyph.getchannel('A')))


def tile(size, rounded, pad_ratio=0.20):
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(out)
    box = (0, 0, size - 1, size - 1)
    if rounded:
        d.rounded_rectangle(box, radius=int(size * 0.22), fill=(0, 0, 0, 255))
    else:
        d.rectangle(box, fill=(0, 0, 0, 255))
    inner = int(size * (1 - 2 * pad_ratio))
    s = min(inner / gw, inner / gh)
    g = inked((255, 255, 255)).resize((round(gw * s), round(gh * s)), Image.LANCZOS)
    out.alpha_composite(g, ((size - g.width) // 2, (size - g.height) // 2))
    return out


def bare(rgb, size=256):
    """Glyph centred on a transparent square, for use as a header logo."""
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    s = min(size / gw, size / gh) * 0.92
    g = inked(rgb).resize((round(gw * s), round(gh * s)), Image.LANCZOS)
    out.alpha_composite(g, ((size - g.width) // 2, (size - g.height) // 2))
    return out


tile(256, rounded=True).save('app/icon.png')
tile(180, rounded=False).save('app/apple-icon.png')
bare((0, 0, 0)).save('public/mark.png')
bare((255, 255, 255)).save('public/mark-dark.png')
print('glyph', (gw, gh), '-> icon.png, apple-icon.png, mark.png, mark-dark.png')
