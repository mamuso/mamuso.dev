#!/usr/bin/env python3
"""Classify long-article pixel differences against recorded image rectangles."""
import json
import math
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw

root = Path(__file__).resolve().parents[1]
artifacts = root / 'output/verification/fonts/long-articles'
media = json.loads((root / 'docs/fonts/long-after-pages.json').read_text())
results = []
for row in media:
    name = row['path'].lstrip('/').replace('/', '_') + '-' + str(row['width']) + '.png'
    before = Image.open(artifacts / 'baseline' / name).convert('RGB')
    after = Image.open(artifacts / 'after' / name).convert('RGB')
    assert before.size == after.size
    diff = ImageChops.difference(before, after)
    image_changes = []
    for image in row['images']:
        assert image['width'] > 0 and image['height'] > 0, image
        left, top, right, bottom = image['rect']
        bounds = (math.floor(left), math.floor(top), math.ceil(right), math.ceil(bottom))
        count = sum(p != (0, 0, 0) for p in diff.crop(bounds).get_flattened_data())
        if count:
            image_changes.append({'src': image['src'], 'bounds': bounds, 'changedPixels': count})
        ImageDraw.Draw(diff).rectangle((bounds[0], bounds[1], bounds[2] - 1, bounds[3] - 1), fill=(0, 0, 0))
    outside = sum(p != (0, 0, 0) for p in diff.get_flattened_data())
    results.append({'image': name, 'changedPixelsOutsideImages': outside, 'imageChanges': image_changes})
repeat = Image.open(artifacts / 'imperfection-same-build-repeat.png').convert('RGB')
original = Image.open(artifacts / 'baseline/note_imperfection-1280.png').convert('RGB')
repeat_changes = sum(p != (0, 0, 0) for p in ImageChops.difference(repeat, original).get_flattened_data())
report = {'pages': results, 'imperfectionSameBuildRepeatVersusBaselineChangedPixels': repeat_changes}
(root / 'docs/fonts/long-diff-review.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
assert all(row['changedPixelsOutsideImages'] == 0 for row in results)
assert repeat_changes == 0
