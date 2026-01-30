type Point = { x: number; y: number };

type BranchSpec = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  ReadonlyArray<BranchSpec>?,
];

type BranchRuntime = {
  p1: Point;
  p2: Point;
  p3: Point;
  radius: number;
  length: number;
  len: number;
  t: number;
  children: ReadonlyArray<BranchSpec>;
};

type Dot = { id: number; x: number; y: number; r: number };

type BloomStamp = {
  id: number;
  x: number;
  y: number;
  color: string;
  alpha: number;
  angle: number;
  scale: number;
};

type BloomSeed = {
  x: number;
  y: number;
  color: string;
  alpha: number;
  angle: number;
  scale: number;
};

type FloatItem = {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  drift: number;
  src: string;
};

type TimingConfig = {
  seedFallSpeed?: number;
  seedFallIntervalMs?: number;
  seedFallDurationSec?: number;
  treeGrowStepsPerTick?: number;
  treeGrowIntervalMs?: number;
  treeGrowDurationSec?: number;
  bloomStepsPerTick?: number;
  bloomIntervalMs?: number;
  bloomDurationSec?: number;
  moveAfterGrow?: boolean;
  maxFloatItems?: number;
  floatSpawnChance?: number;
  floatSpawnPerSec?: number;
  floatDespawnY?: number;
  floatFadeRange?: number;
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const randomInt = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1));

const bezier = (cp: [Point, Point, Point], t: number): Point => {
  const mt = 1 - t;
  const p1 = { x: cp[0].x * (mt * mt), y: cp[0].y * (mt * mt) };
  const p2 = { x: cp[1].x * (2 * t * mt), y: cp[1].y * (2 * t * mt) };
  const p3 = { x: cp[2].x * (t * t), y: cp[2].y * (t * t) };
  return { x: p1.x + p2.x + p3.x, y: p1.y + p2.y + p3.y };
};

const inHeart = (x: number, y: number, r: number) => {
  const xr = x / r;
  const yr = y / r;
  const a = xr * xr + yr * yr - 1;
  const z = a * a * a - xr * xr * yr * yr * yr;
  return z < 0;
};

const estimateGrowTicks = (specs: ReadonlyArray<BranchSpec>) => {
  type SimBranch = { length: number; len: number; children: BranchSpec[] };
  const toSimBranch = (spec: BranchSpec): SimBranch => {
    const [, , , , , , , l, children] = spec;
    return {
      length: l ?? 100,
      len: 0,
      children: children ? [...children] : [],
    };
  };

  let active = specs.map(toSimBranch);
  let ticks = 0;

  while (active.length) {
    const next: SimBranch[] = [];
    for (const br of active) {
      if (br.len <= br.length) {
        br.len += 1;
        next.push(br);
      } else if (br.children.length) {
        for (const child of br.children) {
          next.push(toSimBranch(child));
        }
      }
    }
    active = next;
    ticks += 1;
  }

  return ticks;
};

export const useBirthdayScene = () => {
  const width = 1100;
  const height = 680;

  const seedX = ref(width / 2 - 20);
  const seedY = ref(height / 2);
  const seedColor = ref("rgb(190, 26, 37)");
  const seedScale = ref(2);
  const seedShowHeart = ref(true);

  const seedCircleX = ref(seedX.value);
  const seedCircleY = ref(seedY.value);
  const seedCircleScale = ref(seedScale.value);
  const seedCircleRadius = 5;

  const footerLen = ref(0);
  const footerWidth = 1200;
  const footerHeight = 5;
  const footerSpeed = 10;
  const bloomScaleStep = 0.2;
  const bloomMaxStamps = 1200;

  const dots = shallowRef<Dot[]>([]);
  let dotId = 1;

  const bloomStamps = shallowRef<BloomStamp[]>([]);
  let bloomId = 1;

  const bloomCache = shallowRef<BloomSeed[]>([]);
  const bloomActive = shallowRef<BloomSeed[]>([]);

  const floatItems = shallowRef<FloatItem[]>([]);
  let floatId = 1;
  let floatDespawnY = -80;
  let floatFadeRange = 120;
  const floatSources = [
    "/3M2A4434.JPG",
    "/3M2A4449.JPG",
    "/3M2A4458.JPG",
    "/3M2A4508.JPG",
    "/3M2A4531.JPG",
    "/3M2A4550.JPG",
    "/3M2A4551.JPG",
    "/3M2A4562.JPG",
    "/3M2A4585.JPG",
    "/3M2A4657.JPG",
    "/3M2A4694.JPG",
    "/3M2A4701.JPG",
    "/3M2A4811.JPG",
    "/IMG_3263.JPG",
    "/IMG_3583.JPG",
    "/IMG_3831.JPG",
    "/IMG_3841.JPG",
    "/IMG_3977.JPG",
    "/IMG_4045.JPG",
    "/IMG_4057.JPG",
    "/IMG_4059.JPG",
    "/IMG_4889.JPG",
  ] as const;
  type FloatSource = (typeof floatSources)[number];
  let lastFloatSrc: FloatSource | null = null;

  const treeTranslateX = ref(0);
  const canvasFlash = ref(false);

  const isHand = ref(true);
  const hold = ref(true);

  const branches = shallowRef<BranchRuntime[]>([]);

  const setBranchSpecs = (specs: ReadonlyArray<BranchSpec>) => {
    const next: BranchRuntime[] = [];
    const add = (list: ReadonlyArray<BranchSpec>) => {
      for (const b of list) {
        const [x1, y1, x2, y2, x3, y3, r, l, children] = b;
        next.push({
          p1: { x: x1, y: y1 },
          p2: { x: x2, y: y2 },
          p3: { x: x3, y: y3 },
          radius: r,
          length: l ?? 100,
          len: 0,
          t: 1 / ((l ?? 100) - 1),
          children: children ?? [],
        });
      }
    };
    add(specs);
    branches.value = next;
  };

  const initBlooms = (num: number, bloomWidth: number, bloomHeight: number) => {
    const cache: BloomSeed[] = [];
    const r = 240;
    for (let i = 0; i < num; i++) {
      let x = 0;
      let y = 0;
      // Matches original: random point constrained by heart equation.
      while (true) {
        x = randomInt(20, bloomWidth - 20);
        y = randomInt(20, bloomHeight - 20);
        if (
          inHeart(
            x - bloomWidth / 2,
            bloomHeight - (bloomHeight - 40) / 2 - y,
            r,
          )
        ) {
          break;
        }
      }
      cache.push({
        x,
        y,
        color: `rgb(255,${randomInt(0, 255)},${randomInt(0, 255)})`,
        alpha: randomInt(30, 100) / 100,
        angle: randomInt(0, 360),
        scale: 0.1,
      });
    }
    bloomCache.value = cache;
    bloomActive.value = [];
    bloomStamps.value = [];
  };

  const drawFooterStep = () => {
    if (footerLen.value < footerWidth) {
      footerLen.value = Math.min(footerWidth, footerLen.value + footerSpeed);
    }
  };

  const spawnFloatItem = (limit?: number) => {
    if (typeof limit === "number" && floatItems.value.length >= limit) return;
    const baseY = height - footerHeight / 2;
    const size = randomInt(42, 78);
    const sourceIndex = randomInt(0, floatSources.length - 1);
    let src: FloatSource = floatSources[sourceIndex] ?? floatSources[0]!;
    if (src === lastFloatSrc && floatSources.length > 1) {
      const currentIndex = floatSources.indexOf(src);
      src = floatSources[(currentIndex + 1) % floatSources.length]!;
    }
    lastFloatSrc = src;
    floatItems.value = [
      ...floatItems.value,
      {
        id: floatId++,
        x: randomInt(80, width - 80),
        y: baseY - randomInt(0, 10),
        size,
        opacity: 1,
        speed: randomInt(9, 14) / 10,
        drift: randomInt(-4, 4) / 10,
        src,
      },
    ];
  };

  const updateFloatItems = () => {
    const next: FloatItem[] = [];
    for (const item of floatItems.value) {
      const nextY = item.y - item.speed;
      const heightFade =
        floatFadeRange > 0
          ? Math.min(1, Math.max(0, (nextY - floatDespawnY) / floatFadeRange))
          : 1;
      const nextOpacity = Math.max(
        0,
        Math.min(item.opacity - 0.004, heightFade),
      );
      if (nextY + item.size > floatDespawnY && nextOpacity > 0) {
        next.push({
          ...item,
          y: nextY,
          x: item.x + item.drift,
          opacity: nextOpacity,
        });
      }
    }
    floatItems.value = next;
  };

  const growStep = () => {
    const current = branches.value;
    if (!current.length) return;

    const nextBranches: BranchRuntime[] = [];
    const nextDots = dots.value.slice();
    for (const br of current) {
      if (br.len <= br.length) {
        const p = bezier([br.p1, br.p2, br.p3], br.len * br.t);
        nextDots.push({ id: dotId++, x: p.x, y: p.y, r: br.radius });
        br.len += 1;
        br.radius *= 0.97;
        nextBranches.push(br);
      } else {
        // Spawn children.
        if (br.children?.length) {
          for (const child of br.children) {
            const [x1, y1, x2, y2, x3, y3, r, l, children] = child;
            nextBranches.push({
              p1: { x: x1, y: y1 },
              p2: { x: x2, y: y2 },
              p3: { x: x3, y: y3 },
              radius: r,
              length: l ?? 100,
              len: 0,
              t: 1 / ((l ?? 100) - 1),
              children: children ?? [],
            });
          }
        }
      }
    }
    dots.value = nextDots;
    branches.value = nextBranches;
  };

  const flowerStep = (num: number) => {
    const toAdd = bloomCache.value.splice(0, num);
    bloomActive.value = [...bloomActive.value, ...toAdd];

    // Persist stamps like canvas (no clearing): each tick adds a stamped heart.
    const stillActive: BloomSeed[] = [];
    const nextStamps = bloomStamps.value.slice();
    const skipIntermediate = nextStamps.length > bloomMaxStamps;
    for (const b of bloomActive.value) {
      if (!skipIntermediate) {
        nextStamps.push({
          id: bloomId++,
          x: b.x,
          y: b.y,
          color: b.color,
          alpha: b.alpha,
          angle: b.angle,
          scale: b.scale,
        });
      }
      const nextScale = b.scale + bloomScaleStep;
      if (nextScale <= 1) {
        stillActive.push({ ...b, scale: nextScale });
      } else {
        // Final stamp at scale=1
        nextStamps.push({
          id: bloomId++,
          x: b.x,
          y: b.y,
          color: b.color,
          alpha: b.alpha,
          angle: b.angle,
          scale: 1,
        });
      }
    }
    bloomStamps.value = nextStamps;
    bloomActive.value = stillActive;
  };

  const onSeedClick = () => {
    hold.value = false;
  };

  const run = async (opts: {
    branch: ReadonlyArray<BranchSpec>;
    bloom: { num: number; width: number; height: number };
    timing?: TimingConfig;
  }) => {
    // Reset
    dots.value = [];
    dotId = 1;
    bloomId = 1;
    floatItems.value = [];
    floatId = 1;

    seedScale.value = 2;
    seedCircleScale.value = 2;
    seedShowHeart.value = true;
    seedCircleX.value = seedX.value;
    seedCircleY.value = seedY.value;

    footerLen.value = 0;
    treeTranslateX.value = 0;
    canvasFlash.value = false;

    hold.value = true;

    setBranchSpecs(opts.branch);
    initBlooms(opts.bloom.num, opts.bloom.width, opts.bloom.height);

    // Seed draw + wait for click
    while (hold.value) {
      await sleep(10);
    }

    // Scale down seed heart
    while (seedScale.value > 0.5) {
      seedScale.value *= 0.95;
      seedCircleScale.value = seedScale.value;
      await sleep(16);
    }

    const seedFallIntervalMs = opts.timing?.seedFallIntervalMs ?? 24;
    const seedFallDurationMs = (opts.timing?.seedFallDurationSec ?? 0) * 1000;
    const seedFallSpeed =
      seedFallDurationMs > 0
        ? (height + 20 - seedCircleY.value) /
          Math.max(1, Math.round(seedFallDurationMs / seedFallIntervalMs))
        : (opts.timing?.seedFallSpeed ?? 1.2);

    const growDurationMs = (opts.timing?.treeGrowDurationSec ?? 0) * 1000;
    const estimatedGrowTicks =
      growDurationMs > 0 ? estimateGrowTicks(opts.branch) : 0;
    const treeGrowStepsPerTick =
      growDurationMs > 0 ? 1 : (opts.timing?.treeGrowStepsPerTick ?? 1);
    const treeGrowIntervalMs =
      growDurationMs > 0
        ? Math.max(
            1,
            Math.round(growDurationMs / Math.max(1, estimatedGrowTicks)),
          )
        : (opts.timing?.treeGrowIntervalMs ?? 10);

    const bloomIntervalMs = opts.timing?.bloomIntervalMs ?? 40;
    const bloomDurationMs = (opts.timing?.bloomDurationSec ?? 0) * 1000;
    const bloomTicks =
      bloomDurationMs > 0
        ? Math.max(1, Math.round(bloomDurationMs / bloomIntervalMs))
        : 0;
    const bloomStepsPerTick =
      bloomDurationMs > 0
        ? Math.max(1, Math.ceil(opts.bloom.num / bloomTicks))
        : (opts.timing?.bloomStepsPerTick ?? 4);

    const maxFloatItems = opts.timing?.maxFloatItems ?? Infinity;
    const floatSpawnChance = opts.timing?.floatSpawnChance ?? 0.08;
    const floatSpawnPerSec = opts.timing?.floatSpawnPerSec ?? 0;
    const floatSpawnIntervalMs =
      floatSpawnPerSec > 0 ? 1000 / floatSpawnPerSec : 0;
    let floatSpawnElapsedMs = 0;
    floatDespawnY = opts.timing?.floatDespawnY ?? -80;
    floatFadeRange = opts.timing?.floatFadeRange ?? 120;

    // Drop circle + footer
    seedShowHeart.value = false;
    while (seedCircleY.value < height + 20) {
      seedCircleY.value += seedFallSpeed;
      drawFooterStep();
      if (floatSpawnIntervalMs > 0) {
        floatSpawnElapsedMs += seedFallIntervalMs;
        while (floatSpawnElapsedMs >= floatSpawnIntervalMs) {
          spawnFloatItem(maxFloatItems);
          floatSpawnElapsedMs -= floatSpawnIntervalMs;
        }
      } else if (Math.random() < floatSpawnChance) {
        spawnFloatItem(maxFloatItems);
      }
      updateFloatItems();
      await sleep(seedFallIntervalMs);
    }

    // Grow tree
    let growTicks = 0;
    while (branches.value.length) {
      for (
        let i = 0;
        i < treeGrowStepsPerTick && branches.value.length;
        i += 1
      ) {
        growStep();
      }
      growTicks += 1;
      updateFloatItems();
      await sleep(treeGrowIntervalMs);
    }

    const moveTree = () => {
      // Move tree area to the right (matches snapshot x=240 -> x=500)
      const targetX = 260;
      treeTranslateX.value = targetX;
      footerLen.value = footerWidth;
    };

    let moved = false;
    if (opts.timing?.moveAfterGrow) {
      moveTree();
      moved = true;
      await sleep(900);
    }

    // Bloom
    // Original: flower(2) every ~10ms while canFlower() (i.e., while blooms length)
    // Our bloomCache drives the total amount.
    while (bloomCache.value.length || bloomActive.value.length) {
      flowerStep(bloomStepsPerTick);
      updateFloatItems();
      await sleep(bloomIntervalMs);
    }

    if (!moved) {
      moveTree();
      await sleep(900);
    }

    // Disable background flash to avoid white flicker
    canvasFlash.value = false;
  };

  return {
    width,
    height,
    seedX,
    seedY,
    seedColor,
    seedScale,
    seedShowHeart,
    seedCircleX,
    seedCircleY,
    seedCircleScale,
    seedCircleRadius,
    footerLen,
    footerHeight,
    dots,
    bloomStamps,
    floatItems,
    treeTranslateX,
    canvasFlash,
    isHand,
    onSeedClick,
    run,
  };
};
