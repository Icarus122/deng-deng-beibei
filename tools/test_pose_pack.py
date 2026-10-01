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
    def check_pack(self, name, version='v1', anchor=(192, 368)):
        assets = Path(__file__).resolve().parents[1] / 'godot' / 'assets'
        original = np.asarray(Image.open(assets / f'{name}-actions-{version}.png').convert('RGBA'))
        packed = np.asarray(Image.open(assets / f'{name}-actions-packed-{version}.png').convert('RGBA'))
        manifest = json.loads((assets / f'{name}-actions-packed-{version}.json').read_text(encoding='utf-8'))
        self.assertEqual(manifest['pixelScale'], 1)
        self.assertEqual(len(manifest['frames']), 16)
        for frame in manifest['frames']:
            x, y, w, h = (frame[key] for key in ('x', 'y', 'w', 'h'))
            cell = packed[y:y+h, x:x+w]
            self.assertEqual((frame['originX'] - x, frame['originY'] - y), anchor)
            self.assertGreaterEqual(min(frame['inkMargins']), 12)
            self.assertFalse(cell[:12, :, 3].any())
            self.assertFalse(cell[-12:, :, 3].any())
            self.assertFalse(cell[:, :12, 3].any())
            self.assertFalse(cell[:, -12:, 3].any())
            _, _, bodies = isolate(Image.fromarray(cell), 1)
            self.assertEqual(len(bodies), 1)
            cy, cx = np.nonzero(cell[:, :, 3])
            sx = cx + frame['originalOrigin'][0] - anchor[0]
            sy = cy + frame['originalOrigin'][1] - anchor[1]
            # No changes to skin, clothing, colours or antialias opacity.
            self.assertTrue(np.array_equal(cell[cy, cx], original[sy, sx]))

    def test_beibei_original_pixels_one_body_per_cell_and_fixed_anchor(self):
        self.check_pack('beibei')

    def test_meng_original_pixels_one_body_per_cell_and_fixed_anchor(self):
        self.check_pack('meng')

    def test_cao_original_pixels_one_body_per_cell_and_fixed_anchor(self):
        self.check_pack('cao')

    def test_three_current_action_families_preserve_pixels_and_complete_bodies(self):
        for name in ('beibei', 'meng', 'cao'):
            with self.subTest(character=name):
                self.check_pack(name, 'v2', (192, 400))


if __name__ == '__main__':
    unittest.main()
