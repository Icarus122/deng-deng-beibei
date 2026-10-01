"""Run artwork contract: 12 original isolated bodies and lossless explicit anchors."""
import hashlib
import importlib.util
import json
from pathlib import Path
import unittest

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'godot' / 'assets'
spec = importlib.util.spec_from_file_location('pack_poses', Path(__file__).with_name('pack-poses.py'))
packer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packer)


class PartnerRunPackTest(unittest.TestCase):
    def check_partner(self, name, packed_name='run-packed-v2', source_name='run-v2', head_budget=8):
        manifest_path = ASSETS / f'{name}-{packed_name}.json'
        self.assertTrue(manifest_path.exists(), f'{name} needs an authored 12-frame run manifest')
        manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
        self.assertEqual(manifest['pixelScale'], 1)
        self.assertEqual(len(manifest['frames']), 12)
        source = np.asarray(Image.open(ASSETS / f'{name}-{source_name}.png').convert('RGBA'))
        packed = np.asarray(Image.open(ASSETS / f'{name}-{packed_name}.png').convert('RGBA'))
        hashes = set()
        head_tops = []
        for frame in manifest['frames']:
            x, y, w, h = (frame[key] for key in ('x', 'y', 'w', 'h'))
            cell = packed[y:y+h, x:x+w]
            self.assertGreaterEqual(min(frame['inkMargins']), 12)
            self.assertFalse(cell[:12, :, 3].any())
            self.assertFalse(cell[-12:, :, 3].any())
            self.assertFalse(cell[:, :12, 3].any())
            self.assertFalse(cell[:, -12:, 3].any())
            # A complete silhouette, rather than fragments imported from adjacent cells.
            packer.isolate(Image.fromarray(cell), 1)
            cy, cx = np.nonzero(cell[:, :, 3])
            anchor_x, anchor_y = frame['originX'] - x, frame['originY'] - y
            self.assertEqual((anchor_x, anchor_y), (224, 400))
            sx = cx + frame['originalOrigin'][0] - anchor_x
            sy = cy + frame['originalOrigin'][1] - anchor_y
            self.assertTrue(np.array_equal(cell[cy, cx], source[sy, sx]), 'packing must preserve original RGBA pixels')
            hashes.add(hashlib.sha256(cell.tobytes()).hexdigest())
            head_tops.append(int(cy.min()) - anchor_y)
        self.assertEqual(len(hashes), 12, '12 keys must contain 12 different original drawings')
        self.assertLessEqual(max(head_tops) - min(head_tops), head_budget, 'head anchor cannot jump between rows')

    def test_meng_has_twelve_lossless_safely_anchored_bodies(self):
        self.check_partner('meng')

    def test_cao_has_twelve_lossless_safely_anchored_bodies(self):
        self.check_partner('cao')

    def test_meng_beibei_style_complete_frames(self):
        self.check_partner('meng', 'run-beibei-packed-v1', 'run-beibei-style-v2', 16)

    def test_cao_beibei_style_complete_frames(self):
        self.check_partner('cao', 'run-beibei-packed-v1', 'run-beibei-style-v1', 16)

    def test_current_short_hair_original_frames(self):
        for name in ('meng', 'cao'):
            with self.subTest(character=name):
                self.check_partner(name, 'run-short-packed-v1', 'run-short-v1', 40)


if __name__ == '__main__':
    unittest.main()
