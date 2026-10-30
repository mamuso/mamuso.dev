#!/usr/bin/env python3
"""Exact pixel comparison: python scripts/diff-fonts.py BASELINE AFTER OUTPUT."""
import json
import sys
from pathlib import Path
from PIL import Image, ImageChops

before, after, output = map(Path, sys.argv[1:])
output.mkdir(parents=True, exist_ok=True)
results = []
for original in sorted(before.glob('*.png')):
    candidate = after / original.name
    a, b = Image.open(original).convert('RGB'), Image.open(candidate).convert('RGB')
    if a.size != b.size:
        results.append({'image': original.name, 'beforeSize': a.size, 'afterSize': b.size, 'regression': 'dimensions'})
        continue
    diff = ImageChops.difference(a, b)
    changed = sum(pixel != (0, 0, 0) for pixel in diff.get_flattened_data())
    max_delta = max(max(pixel) for pixel in diff.get_flattened_data())
    results.append({'image': original.name, 'size': a.size, 'pixels': a.width * a.height, 'changedPixels': changed, 'maxChannelDelta': max_delta, 'bounds': diff.getbbox()})
    diff.save(output / original.name)
(output / 'pixels.json').write_text(json.dumps(results, indent=2) + '\n')
print(json.dumps(results, indent=2))
sys.exit(1 if any(r.get('regression') or r['changedPixels'] for r in results) else 0)
