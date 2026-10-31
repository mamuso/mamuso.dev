#!/usr/bin/env python3
"""Manual FreeType proof; does not modify shipped fonts. Output directory is argv[1]."""
import io
import json
import sys
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFont
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
output = Path(sys.argv[1])
output.mkdir(parents=True, exist_ok=True)
sample = 'Camera ISO 400 0123456789 -- regular'


def ttf(font):
    font.flavor = None
    data = io.BytesIO()
    font.save(data)
    return data.getvalue()


def paint(font, text):
    image = Image.new('L', (800, 80), 255)
    ImageDraw.Draw(image).text((10, 10), text, font=font, fill=0)
    return image


def count(a, b):
    return sum(v != 0 for v in ImageChops.difference(a, b).get_flattened_data())


report = {}
for style in ('Regular', 'Bold'):
    source = root / f'app/fonts/courier-prime/CourierPrime-{style}.ttf'
    original = ImageFont.truetype(str(source), 16, layout_engine=ImageFont.Layout.BASIC)
    unhinted = TTFont(source)
    options = subset.Options()
    options.hinting = False
    options.layout_features = ['*']
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(glyphs=unhinted.getGlyphOrder())
    subsetter.subset(unhinted)
    nohint = ImageFont.truetype(io.BytesIO(ttf(unhinted)), 16, layout_engine=ImageFont.Layout.BASIC)
    a, b = paint(original, sample), paint(nohint, sample)
    a.save(output / f'{style}-original.png')
    b.save(output / f'{style}-nohint.png')
    ImageChops.difference(a, b).save(output / f'{style}-nohint-diff.png')
    checks = []
    for path in sorted((root / 'public/fonts').glob(f'*{style.lower()}-*.woff2')):
        font = TTFont(path)
        candidate = ImageFont.truetype(io.BytesIO(ttf(font)), 16, layout_engine=ImageFont.Layout.BASIC)
        changes = {f'U+{u:04X}': count(paint(original, chr(u)), paint(candidate, chr(u))) for u in font.getBestCmap()}
        checks.append({'file': path.name, 'characters': len(changes), 'changedPixels': sum(changes.values())})
    report[style] = {'noHintingSampleChangedPixels': count(a, b), 'shipped': checks}
(output / 'hinting.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
assert all(check['changedPixels'] == 0 for r in report.values() for check in r['shipped'])
