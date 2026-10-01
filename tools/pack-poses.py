"""User-authorized lossless pose isolation/packing; never redraw or resize ink."""
import argparse
import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


def isolate(image, expected):
    rgba = np.asarray(image.convert('RGBA'))
    height, width = rgba.shape[:2]
    mask = rgba[:, :, 3] > 32
    owners = np.zeros((height, width), dtype=np.int32)
    components = []
    for sy, sx in zip(*np.nonzero(mask)):
        if not mask[sy, sx]:
            continue
        queue = deque([(int(sy), int(sx))])
        mask[sy, sx] = False
        pixels = []
        while queue:
            y, x = queue.popleft()
            pixels.append((y, x))
            for ny, nx in ((y-1, x), (y+1, x), (y, x-1), (y, x+1)):
                if 0 <= ny < height and 0 <= nx < width and mask[ny, nx]:
                    mask[ny, nx] = False
                    queue.append((ny, nx))
        if len(pixels) >= 500:
            label = len(components) + 1
            points = np.asarray(pixels)
            owners[points[:, 0], points[:, 1]] = label
            components.append({'label': label, 'x': int(points[:, 1].min()),
                               'y': int(points[:, 0].min()),
                               'right': int(points[:, 1].max()) + 1,
                               'bottom': int(points[:, 0].max()) + 1})
    if len(components) != expected:
        raise ValueError(f'Expected {expected} connected bodies, found {len(components)}; manual review required')
    # Preserve original antialias pixels connected to the body. Simultaneous
    # assignment cannot bring a neighbouring pose into this silhouette.
    for _ in range(4):
        expanded = owners.copy()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            shifted = np.roll(owners, (dy, dx), axis=(0, 1))
            if dy == -1:
                shifted[-1] = 0
            elif dy == 1:
                shifted[0] = 0
            elif dx == -1:
                shifted[:, -1] = 0
            else:
                shifted[:, 0] = 0
            choose = (expanded == 0) & (rgba[:, :, 3] > 0) & (shifted > 0)
            expanded[choose] = shifted[choose]
        owners = expanded
    return rgba, owners, components


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--origins', required=True, help='Original authored x,y anchors, separated by semicolons')
    parser.add_argument('--columns', type=int, default=4)
    parser.add_argument('--cell', type=int, nargs=2, default=[384, 384])
    parser.add_argument('--anchor', type=int, nargs=2, default=[192, 368])
    args = parser.parse_args()
    origins = [tuple(map(int, item.split(','))) for item in args.origins.split(';')]
    rgba, owners, bodies = isolate(Image.open(args.source), len(origins))
    # Validate the sheet visually before supplying its row-major anchor list.
    by_height = sorted(bodies, key=lambda b: (b['y'] + b['bottom']) / 2)
    ordered = []
    for start in range(0, len(bodies), args.columns):
        ordered.extend(sorted(by_height[start:start + args.columns], key=lambda b: b['x']))
    cell_w, cell_h = args.cell
    output = np.zeros((cell_h * ((len(bodies) + args.columns - 1) // args.columns), cell_w * args.columns, 4), dtype=np.uint8)
    frames = []
    for index, (body, origin) in enumerate(zip(ordered, origins)):
        ys, xs = np.nonzero(owners == body['label'])
        x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
        cx, cy = (index % args.columns) * cell_w, (index // args.columns) * cell_h
        dx, dy = args.anchor[0] - origin[0], args.anchor[1] - origin[1]
        margins = [x0 + dx, y0 + dy, cell_w - x1 - dx, cell_h - y1 - dy]
        if min(margins) < 12:
            raise ValueError(f'Pose {index} needs a larger cell/anchor; margins={margins}')
        pose = rgba[y0:y1, x0:x1].copy()
        pose[owners[y0:y1, x0:x1] != body['label']] = 0
        output[cy + y0 + dy:cy + y1 + dy, cx + x0 + dx:cx + x1 + dx] = pose
        frames.append({'x': cx, 'y': cy, 'w': cell_w, 'h': cell_h,
                       'originX': cx + args.anchor[0], 'originY': cy + args.anchor[1],
                       'originalOrigin': origin, 'inkMargins': margins})
    args.output.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(output).save(args.output, optimize=True)
    args.output.with_suffix('.json').write_text(json.dumps({'source': str(args.source), 'pixelScale': 1,
        'frames': frames}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'PACKED {len(frames)} original bodies, no rescaling; min safety margin={min(min(f["inkMargins"]) for f in frames)}px')


if __name__ == '__main__':
    main()
