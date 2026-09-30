// Explicit isolated source rectangles; every frame uses the same scale and virtual body anchor.
export const ACADEMY_SCALE = 88 / 385;
export const ACADEMY_HEIGHT_RATIO = {beibei:1,meng:1,cao:183/170};
export const ACADEMY_FRAMES = {
  "beibei": [
    {
      "x": 29,
      "y": 9,
      "w": 253,
      "h": 409,
      "originX": 151,
      "originY": 397,
      "contactFoot": "left",
      "phase": 0
    },
    {
      "x": 360,
      "y": 12,
      "w": 221,
      "h": 405,
      "originX": 133.5,
      "originY": 394,
      "contactFoot": null,
      "phase": 0.08333333333333333
    },
    {
      "x": 656,
      "y": 8,
      "w": 249,
      "h": 408,
      "originX": 151,
      "originY": 398,
      "contactFoot": null,
      "phase": 0.16666666666666666
    },
    {
      "x": 964,
      "y": 4,
      "w": 260,
      "h": 411,
      "originX": 156.5,
      "originY": 402,
      "contactFoot": null,
      "phase": 0.25
    },
    {
      "x": 28,
      "y": 419,
      "w": 265,
      "h": 396,
      "originX": 152,
      "originY": 395,
      "contactFoot": null,
      "phase": 0.3333333333333333
    },
    {
      "x": 347,
      "y": 420,
      "w": 247,
      "h": 406,
      "originX": 146.5,
      "originY": 394,
      "contactFoot": null,
      "phase": 0.4166666666666667
    },
    {
      "x": 648,
      "y": 420,
      "w": 260,
      "h": 406,
      "originX": 159,
      "originY": 394,
      "contactFoot": "right",
      "phase": 0.5
    },
    {
      "x": 999,
      "y": 418,
      "w": 217,
      "h": 410,
      "originX": 121.5,
      "originY": 396,
      "contactFoot": null,
      "phase": 0.5833333333333334
    },
    {
      "x": 37,
      "y": 826,
      "w": 244,
      "h": 402,
      "originX": 143,
      "originY": 390,
      "contactFoot": null,
      "phase": 0.6666666666666666
    },
    {
      "x": 336,
      "y": 827,
      "w": 255,
      "h": 401,
      "originX": 157.5,
      "originY": 389,
      "contactFoot": null,
      "phase": 0.75
    },
    {
      "x": 653,
      "y": 823,
      "w": 262,
      "h": 361,
      "originX": 154,
      "originY": 393,
      "contactFoot": null,
      "phase": 0.8333333333333334
    },
    {
      "x": 966,
      "y": 829,
      "w": 252,
      "h": 398,
      "originX": 154.5,
      "originY": 387,
      "contactFoot": null,
      "phase": 0.9166666666666666
    }
  ],
  "meng": [
    {
      "x": 27,
      "y": 22,
      "w": 274,
      "h": 393,
      "originX": 153,
      "originY": 381,
      "contactFoot": "left",
      "phase": 0
    },
    {
      "x": 368,
      "y": 25,
      "w": 214,
      "h": 387,
      "originX": 125.5,
      "originY": 378,
      "contactFoot": null,
      "phase": 0.08333333333333333
    },
    {
      "x": 644,
      "y": 23,
      "w": 255,
      "h": 389,
      "originX": 163,
      "originY": 380,
      "contactFoot": null,
      "phase": 0.16666666666666666
    },
    {
      "x": 944,
      "y": 23,
      "w": 300,
      "h": 386,
      "originX": 176.5,
      "originY": 380,
      "contactFoot": null,
      "phase": 0.25
    },
    {
      "x": 14,
      "y": 430,
      "w": 322,
      "h": 354,
      "originX": 166,
      "originY": 373,
      "contactFoot": null,
      "phase": 0.3333333333333333
    },
    {
      "x": 344,
      "y": 433,
      "w": 279,
      "h": 381,
      "originX": 149.5,
      "originY": 370,
      "contactFoot": null,
      "phase": 0.4166666666666667
    },
    {
      "x": 643,
      "y": 436,
      "w": 287,
      "h": 379,
      "originX": 164,
      "originY": 367,
      "contactFoot": "right",
      "phase": 0.5
    },
    {
      "x": 998,
      "y": 440,
      "w": 211,
      "h": 375,
      "originX": 122.5,
      "originY": 363,
      "contactFoot": null,
      "phase": 0.5833333333333334
    },
    {
      "x": 27,
      "y": 832,
      "w": 258,
      "h": 392,
      "originX": 153,
      "originY": 380,
      "contactFoot": null,
      "phase": 0.6666666666666666
    },
    {
      "x": 316,
      "y": 831,
      "w": 318,
      "h": 388,
      "originX": 177.5,
      "originY": 381,
      "contactFoot": null,
      "phase": 0.75
    },
    {
      "x": 647,
      "y": 831,
      "w": 321,
      "h": 344,
      "originX": 160,
      "originY": 381,
      "contactFoot": null,
      "phase": 0.8333333333333334
    },
    {
      "x": 987,
      "y": 837,
      "w": 248,
      "h": 384,
      "originX": 133.5,
      "originY": 375,
      "contactFoot": null,
      "phase": 0.9166666666666666
    }
  ],
  "cao": [
    {
      "x": 34,
      "y": 17,
      "w": 270,
      "h": 404,
      "originX": 146,
      "originY": 392,
      "contactFoot": "left",
      "phase": 0
    },
    {
      "x": 398,
      "y": 17,
      "w": 199,
      "h": 403,
      "originX": 95.5,
      "originY": 392,
      "contactFoot": null,
      "phase": 0.08333333333333333
    },
    {
      "x": 644,
      "y": 19,
      "w": 259,
      "h": 399,
      "originX": 163,
      "originY": 390,
      "contactFoot": null,
      "phase": 0.16666666666666666
    },
    {
      "x": 944,
      "y": 14,
      "w": 300,
      "h": 403,
      "originX": 176.5,
      "originY": 395,
      "contactFoot": null,
      "phase": 0.25
    },
    {
      "x": 16,
      "y": 430,
      "w": 325,
      "h": 362,
      "originX": 164,
      "originY": 383,
      "contactFoot": null,
      "phase": 0.3333333333333333
    },
    {
      "x": 363,
      "y": 425,
      "w": 269,
      "h": 395,
      "originX": 130.5,
      "originY": 388,
      "contactFoot": null,
      "phase": 0.4166666666666667
    },
    {
      "x": 644,
      "y": 431,
      "w": 301,
      "h": 394,
      "originX": 163,
      "originY": 382,
      "contactFoot": "right",
      "phase": 0.5
    },
    {
      "x": 1024,
      "y": 429,
      "w": 200,
      "h": 393,
      "originX": 96.5,
      "originY": 384,
      "contactFoot": null,
      "phase": 0.5833333333333334
    },
    {
      "x": 30,
      "y": 837,
      "w": 253,
      "h": 389,
      "originX": 150,
      "originY": 382,
      "contactFoot": null,
      "phase": 0.6666666666666666
    },
    {
      "x": 317,
      "y": 835,
      "w": 316,
      "h": 392,
      "originX": 176.5,
      "originY": 384,
      "contactFoot": null,
      "phase": 0.75
    },
    {
      "x": 637,
      "y": 835,
      "w": 347,
      "h": 357,
      "originX": 170,
      "originY": 384,
      "contactFoot": null,
      "phase": 0.8333333333333334
    },
    {
      "x": 998,
      "y": 834,
      "w": 256,
      "h": 397,
      "originX": 122.5,
      "originY": 385,
      "contactFoot": null,
      "phase": 0.9166666666666666
    }
  ]
};
export const ACADEMY_POSES = {
  "beibei": [
    {
      "x": 145,
      "y": 15,
      "w": 236,
      "h": 390,
      "originX": 118,
      "originY": 382
    },
    {
      "x": 519,
      "y": 13,
      "w": 188,
      "h": 407,
      "originX": 94,
      "originY": 399
    },
    {
      "x": 921,
      "y": 116,
      "w": 201,
      "h": 308,
      "originX": 100.5,
      "originY": 300
    }
  ],
  "meng": [
    {
      "x": 145,
      "y": 418,
      "w": 228,
      "h": 369,
      "originX": 114,
      "originY": 361
    },
    {
      "x": 536,
      "y": 421,
      "w": 168,
      "h": 389,
      "originX": 84,
      "originY": 381
    },
    {
      "x": 892,
      "y": 492,
      "w": 257,
      "h": 317,
      "originX": 128.5,
      "originY": 309
    }
  ],
  "cao": [
    {
      "x": 119,
      "y": 803,
      "w": 286,
      "h": 410,
      "originX": 143,
      "originY": 402
    },
    {
      "x": 523,
      "y": 806,
      "w": 197,
      "h": 426,
      "originX": 98.5,
      "originY": 418
    },
    {
      "x": 859,
      "y": 885,
      "w": 334,
      "h": 342,
      "originX": 167,
      "originY": 334
    }
  ]
};
