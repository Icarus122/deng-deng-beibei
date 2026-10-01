"""Checks the user-authorized repack against original pixels and authored anchors."""
import json
import importlib.util
from pathlib import Path
import unittest

import numpy as np
from PIL import Image

packer_spec = importlib.util.spec_from_file_location('pack_poses', Path(__file__).with_name('pack-poses.py'))
packer = importlib.util.module_from_spec(packer_spec)
packer_spec.loader.exec_module(packer)
isolate = packer.isolate


class PosePackTest(unittest.TestCase):
    def check_pack(self, name):
        assets = Path(__file__).resolve().parents[1] / 'godot' / 'assets'
        original = np.asarray(Image.open(assets / f'{name}-actions-v1.png').convert('RGBA'))
        packed = np.asarray(Image.open(assets / f'{name}-actions-packed-v1.png').convert('RGBA'))
        manifest = json.loads((assets / f'{name}-actions-packed-v1.json').read_text(encoding='utf-8'))
        self.assertEqual(manifest['pixelScale'], 1)
        self.assertEqual(len(manifest['frames']), 16)
        for frame in manifest['frames']:
            x, y, w, h = (frame[key] for key in ('x', 'y', 'w', 'h'))
            cell = packed[y:y+h, x:x+w]
            self.assertEqual((frame['originX'] - x, frame['originY'] - y), (192, 368))
            self.assertGreaterEqual(min(frame['inkMargins']), 12)
            self.assertFalse(cell[:12, :, 3].any())
            self.assertFalse(cell[-12:, :, 3].any())
            self.assertFalse(cell[:, :12, 3].any())
            self.assertFalse(cell[:, -12:, 3].any())
            _, _, bodies = isolate(Image.fromarray(cell), 1)
            self.assertEqual(len(bodies), 1)
            cy, cx = np.nonzero(cell[:, :, 3])
            sx = cx + frame['originalOrigin'][0] - 192
            sy = cy + frame['originalOrigin'][1] - 368
            # No changes to skin, clothing, colours or antialias opacity.
            self.assertTrue(np.array_equal(cell[cy, cx], original[sy, sx]))

    def test_beibei_original_pixels_one_body_per_cell_and_fixed_anchor(self):
        self.check_pack('beibei')

    def test_meng_original_pixels_one_body_per_cell_and_fixed_anchor(self):
        self.check_pack('meng')

    def test_cao_original_pixels_one_body_per_cell_and_fixed_anchor(self):
        self.check_pack('cao')


if __name__ == '__main__':
    unittest.main()
