<template>
  <div id="canvas" :class="{ hand: handActive }" :style="canvasStyle">
    <!-- Footer (ground line) - div based for stability -->
    <div class="footer" :style="footerStyle" />

    <!-- Everything that moves in moveAnimate -->
    <div class="tree-layer" :style="treeLayerStyle">
      <!-- Branch dots (tree growth) -->
      <div
        v-for="d in dots"
        :key="d.id"
        class="branch-dot"
        :style="dotStyle(d)"
      />

      <!-- Bloom stamps (canvas-like persistence) -->
      <div
        v-for="b in bloomStamps"
        :key="b.id"
        class="bloom"
        :style="bloomStyle(b)"
      >
        <svg
          class="heart-svg"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 640"
        >
          <path
            d="M305 151.1L320 171.8L335 151.1C360 116.5 400.2 96 442.9 96C516.4 96 576 155.6 576 229.1L576 231.7C576 343.9 436.1 474.2 363.1 529.9C350.7 539.3 335.5 544 320 544C304.5 544 289.2 539.4 276.9 529.9C203.9 474.2 64 343.9 64 231.7L64 229.1C64 155.6 123.6 96 197.1 96C239.8 96 280 116.5 305 151.1z"
            :fill="b.color"
          />
        </svg>
      </div>

      <!-- Seed (click target) -->
      <div
        v-if="seedShowHeart"
        class="seed-heart"
        :style="seedHeartStyle"
        aria-hidden="true"
      >
        <UButton
          color="neutral"
          variant="solid"
          size="md"
          class="seed-button"
          :style="{ backgroundColor: seedColor }"
        >
          Click Me
        </UButton>
      </div>

      <!-- Seed text + guide line (div based) -->
      <div v-if="seedShowHeart" class="seed-annot" :style="seedAnnotStyle">
        <div class="seed-line seed-line-1" :style="seedLineStyle" />
        <div class="seed-line seed-line-2" :style="seedLineStyle" />
        <div class="seed-text seed-text-1">Click Me:)</div>
        <div class="seed-text seed-text-2">Birthday Queen !</div>
      </div>

      <!-- Seed circle (falls down) -->
      <div class="seed-circle" :style="seedCircleStyle" />

      <!-- Transparent hit area for hover/click -->
      <div
        class="seed-hit"
        :style="seedHitStyle"
        @click="emitSeedClick"
        @mouseenter="handActive = true"
        @mouseleave="handActive = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  width: number;
  height: number;
  seedX: number;
  seedY: number;
  seedColor: string;
  seedScale: number;
  seedShowHeart: boolean;
  seedCircleX: number;
  seedCircleY: number;
  seedCircleScale: number;
  seedCircleRadius: number;
  footerLen: number;
  footerHeight: number;
  dots: Array<{ id: number; x: number; y: number; r: number }>;
  bloomStamps: Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    alpha: number;
    angle: number;
    scale: number;
  }>;
  treeTranslateX: number;
  canvasFlash: boolean;
}>();

const emit = defineEmits<{ (e: "seedClick"): void }>();

const handActive = ref(true);
const seedHeartBase = 80;
const bloomHeartBase = 24;

const canvasStyle = computed(() => {
  // Mirrors canvas background flashing in original moveAnimate
  return props.canvasFlash ? { background: "#ffe" } : { background: "none" };
});

const treeLayerStyle = computed(() => ({
  transform: `translate3d(${props.treeTranslateX}px, 0, 0)`,
  width: `${props.width}px`,
  height: `${props.height}px`,
}));

const footerStyle = computed(() => ({
  left: `${props.seedX - props.footerLen / 2}px`,
  top: `${props.height - props.footerHeight / 2}px`,
  width: `${props.footerLen}px`,
  height: `${props.footerHeight}px`,
}));

const seedHeartStyle = computed(() => {
  const size = seedHeartBase * props.seedScale;
  return {
    "--seed-left": `${props.seedX - size / 2}px`,
    "--seed-top": `${props.seedY - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
  };
});

const seedAnnotStyle = computed(() => ({
  left: `${props.seedX}px`,
  top: `${props.seedY}px`,
  transform: `scale(${props.seedScale})`,
  transformOrigin: "0 0",
  color: props.seedColor,
}));

const seedLineStyle = computed(() => ({
  background: props.seedColor,
}));

const seedCircleStyle = computed(() => {
  const r = props.seedCircleRadius * props.seedCircleScale;
  return {
    left: `${props.seedCircleX - r}px`,
    top: `${props.seedCircleY - r}px`,
    width: `${r * 2}px`,
    height: `${r * 2}px`,
  };
});

const seedHitStyle = computed(() => {
  const size = seedHeartBase * props.seedScale;
  return {
    "--seed-left": `${props.seedX - size / 2}px`,
    "--seed-top": `${props.seedY - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
  };
});

const dotStyle = (d: { x: number; y: number; r: number }) => ({
  left: `${d.x - d.r}px`,
  top: `${d.y - d.r}px`,
  width: `${d.r * 2}px`,
  height: `${d.r * 2}px`,
});

const bloomStyle = (b: {
  x: number;
  y: number;
  angle: number;
  scale: number;
  alpha: number;
}) => {
  const size = bloomHeartBase * b.scale;
  return {
    left: `${b.x - size / 2}px`,
    top: `${b.y - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    opacity: b.alpha,
    transform: `rotate(${b.angle}deg)`,
  };
};

const emitSeedClick = () => emit("seedClick");
</script>

<style scoped>
#canvas {
  position: relative;
  overflow: hidden;
}

.tree-layer {
  position: absolute;
  left: 0;
  top: 0;
  will-change: transform;
}

.branch-dot {
  position: absolute;
  border-radius: 999px;
  background: #ffc0cb;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

.footer {
  position: absolute;
  background: #fff;
  border-radius: 999px;
  will-change: width;
}

.seed-circle {
  position: absolute;
  background: #ffc0cb;
  border-radius: 999px;
  will-change: transform, left, top, width, height;
}

.heart-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.bloom,
.seed-heart {
  position: absolute;
  transform-origin: center center;
  will-change: transform, opacity;
  pointer-events: none;
  left: var(--seed-left);
  top: var(--seed-top);
}

.seed-annot {
  position: absolute;
  pointer-events: none;
}

.seed-line {
  position: absolute;
  height: 1px;
}

.seed-line-1 {
  width: 21.213px;
  left: 0;
  top: 0;
  transform: rotate(45deg);
  transform-origin: 0 0;
}

.seed-line-2 {
  width: 115px;
  left: 15px;
  top: 15px;
}

.seed-text {
  position: absolute;
  font-size: 12px;
  font-family: Verdana, sans-serif;
  transform: scale(0.75);
  transform-origin: 0 0;
}

.seed-text-1 {
  left: 30px;
  top: -5px;
}

.seed-text-2 {
  left: 28px;
  top: 10px;
}

.seed-hit {
  position: absolute;
  cursor: pointer;
  background: transparent;
  left: var(--seed-left);
  top: var(--seed-top);
}

.seed-button {
  width: 100%;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-weight: 700;
}

@media (max-width: 640px) {
  .seed-heart,
  .seed-hit {
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%);
  }
}
</style>
