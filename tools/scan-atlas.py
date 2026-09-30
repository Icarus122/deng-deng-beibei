"""Read-only atlas alpha/component audit; does not alter any source pixels."""
import sys
import json
from PIL import Image
import numpy as np
from collections import deque

image = Image.open(sys.argv[1]).convert('RGBA')
mask = np.asarray(image)[:, :, 3] > 32
boxes = []
height, width = mask.shape
for start_y, start_x in zip(*np.nonzero(mask)):
    if not mask[start_y, start_x]:
        continue
    mask[start_y, start_x] = False
    queue = deque([(int(start_y), int(start_x))])
    left = right = int(start_x)
    top = bottom = int(start_y)
    pixels = 0
    while queue:
        y, x = queue.popleft()
        pixels += 1
        left, right = min(left, x), max(right, x)
        top, bottom = min(top, y), max(bottom, y)
        for ny, nx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
            if 0 <= ny < height and 0 <= nx < width and mask[ny,nx]:
                mask[ny,nx] = False
                queue.append((ny,nx))
    if pixels >= 500:
        boxes.append({'x':left,'y':top,'w':right-left+1,'h':bottom-top+1,'pixels':pixels})
print(json.dumps({'size': image.size, 'components': sorted(boxes, key=lambda b:(b['y']//400,b['x']))}))
