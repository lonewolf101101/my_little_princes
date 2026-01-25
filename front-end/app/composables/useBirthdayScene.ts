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

  const dots = shallowRef<Dot[]>([]);
  let dotId = 1;

  const bloomStamps = shallowRef<BloomStamp[]>([]);
  let bloomId = 1;

  const bloomCache = shallowRef<BloomSeed[]>([]);
  const bloomActive = shallowRef<BloomSeed[]>([]);

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

  const growStep = () => {
    const current = branches.value;
    if (!current.length) return;

    const nextBranches: BranchRuntime[] = [];
    for (const br of current) {
      if (br.len <= br.length) {
        const p = bezier([br.p1, br.p2, br.p3], br.len * br.t);
        dots.value = [
          ...dots.value,
          { id: dotId++, x: p.x, y: p.y, r: br.radius },
        ];
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
    branches.value = nextBranches;
  };

  const flowerStep = (num: number) => {
    const toAdd = bloomCache.value.splice(0, num);
    bloomActive.value = [...bloomActive.value, ...toAdd];

    // Persist stamps like canvas (no clearing): each tick adds a stamped heart.
    const stillActive: BloomSeed[] = [];
    for (const b of bloomActive.value) {
      bloomStamps.value = [
        ...bloomStamps.value,
        {
          id: bloomId++,
          x: b.x,
          y: b.y,
          color: b.color,
          alpha: b.alpha,
          angle: b.angle,
          scale: b.scale,
        },
      ];
      const nextScale = b.scale + 0.1;
      if (nextScale <= 1) {
        stillActive.push({ ...b, scale: nextScale });
      } else {
        // Final stamp at scale=1
        bloomStamps.value = [
          ...bloomStamps.value,
          {
            id: bloomId++,
            x: b.x,
            y: b.y,
            color: b.color,
            alpha: b.alpha,
            angle: b.angle,
            scale: 1,
          },
        ];
      }
    }
    bloomActive.value = stillActive;
  };

  const onSeedClick = () => {
    hold.value = false;
  };

  const run = async (opts: {
    branch: ReadonlyArray<BranchSpec>;
    bloom: { num: number; width: number; height: number };
  }) => {
    // Reset
    dots.value = [];
    dotId = 1;
    bloomId = 1;

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
    while (seedScale.value > 0.2) {
      seedScale.value *= 0.95;
      seedCircleScale.value = seedScale.value;
      await sleep(10);
    }

    // Drop circle + footer
    seedShowHeart.value = false;
    while (seedCircleY.value < height + 20) {
      seedCircleY.value += 2;
      drawFooterStep();
      await sleep(10);
    }

    // Grow tree
    while (branches.value.length) {
      growStep();
      await sleep(10);
    }

    // Bloom
    // Original: flower(2) every ~10ms while canFlower() (i.e., while blooms length)
    // Our bloomCache drives the total amount.
    while (bloomCache.value.length || bloomActive.value.length) {
      flowerStep(2);
      await sleep(10);
    }

    // Move tree area to the right (matches snapshot x=240 -> x=500)
    let speed = 10;
    const targetX = 260;
    while (treeTranslateX.value < targetX) {
      treeTranslateX.value = Math.min(targetX, treeTranslateX.value + speed);
      drawFooterStep();
      speed *= 0.95;
      if (speed < 2) speed = 2;
      await sleep(10);
    }

    // Flash background like original
    canvasFlash.value = true;
    await sleep(300);
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
    treeTranslateX,
    canvasFlash,
    isHand,
    onSeedClick,
    run,
  };
};
