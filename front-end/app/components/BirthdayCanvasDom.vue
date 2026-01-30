<script setup lang="ts">
import { Icon } from "@iconify/vue";

const props = withDefaults(
  defineProps<{
    width: number;
    height: number;
    seedX: number;
    seedY: number;
    seedColor: string;
    seedScale: number;
    heartScale?: number;
    seedHeartScale?: number;
    leafHeartScale?: number;
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
    floatItems: Array<{
      id: number;
      x: number;
      y: number;
      size: number;
      opacity: number;
      src: string;
    }>;
    treeTranslateX: number;
    canvasFlash: boolean;
  }>(),
  {
    heartScale: 0.5,
    seedHeartScale: undefined,
    leafHeartScale: undefined,
  },
);

const emit = defineEmits<{ (e: "seedClick"): void }>();

const handActive = ref(true);
const seedHeartBase = 80;
const bloomHeartBase = 24;
const heartScale = computed(() => props.heartScale ?? 1);
const seedHeartScale = computed(() => props.seedHeartScale ?? heartScale.value);
const leafHeartScale = computed(() => props.leafHeartScale ?? heartScale.value);

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
  const size = seedHeartBase * props.seedScale * seedHeartScale.value;
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
    background: props.seedColor,
  };
});

const seedHitStyle = computed(() => {
  const size = seedHeartBase * props.seedScale * seedHeartScale.value;
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
  color: props.seedColor,
});

const bloomStyle = (b: {
  color: string;
  x: number;
  y: number;
  angle: number;
  scale: number;
  alpha: number;
}) => {
  const size = bloomHeartBase * b.scale * leafHeartScale.value;
  return {
    left: `${b.x - size / 2}px`,
    top: `${b.y - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    opacity: b.alpha,
    transform: `rotate(${b.angle}deg)`,
    color: b.color || props.seedColor,
  };
};

const floatStyle = (f: {
  x: number;
  y: number;
  size: number;
  opacity: number;
}) => ({
  left: `${f.x}px`,
  top: `${f.y}px`,
  transform: "translate(-50%, -50%)",
  opacity: f.opacity,
});

const emitSeedClick = () => emit("seedClick");
</script>

<template>
  <div id="canvas" :class="{ hand: handActive }" :style="canvasStyle">
    <!-- Footer (ground line) - div based for stability -->
    <div class="footer" :style="footerStyle" />

    <!-- Everything that moves in moveAnimate -->
    <div class="tree-layer" :style="treeLayerStyle">
      <!-- Branch dots (tree growth) -->
      <Icon
        v-for="d in dots"
        :key="d.id"
        class="branch-heart"
        :style="dotStyle(d)"
        icon="ph:heart-fill"
      />

      <!-- Bloom stamps (canvas-like persistence) -->
      <div
        v-for="b in bloomStamps"
        :key="b.id"
        class="bloom"
        :style="bloomStyle(b)"
      >
        <Icon class="bloom-heart" icon="ph:heart-fill" />
      </div>

      <!-- Floating images during seed fall -->
      <div
        v-for="f in floatItems"
        :key="f.id"
        class="float-item"
        :style="floatStyle(f)"
      >
        <img :src="f.src" alt="" class="float-img" />
      </div>

      <!-- Seed (click target) -->
      <div
        v-if="seedShowHeart"
        class="seed-heart"
        :style="seedHeartStyle"
        aria-hidden="true"
      >
        <div class="seed-button" :style="{ color: seedColor }">
          <Icon class="seed-button-heart" icon="ph:heart-fill" />
        </div>
      </div>

      <!-- Seed text + guide line (div based) -->
      <div v-if="seedShowHeart" class="seed-annot" :style="seedAnnotStyle">
        <div class="seed-text seed-text-1">Click Me:)</div>
        <div class="seed-text seed-text-2">My Birthday Princess</div>
        <div class="seed-line seed-line-1" :style="seedLineStyle" />
        <div class="seed-line seed-line-2" :style="seedLineStyle" />
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
  transition: transform 900ms ease-out;
}

.branch-heart {
  position: absolute;
  display: block;
}

.footer {
  position: absolute;
  background: #fff;
  border-radius: 999px;
  will-change: width;
}

.seed-circle {
  position: absolute;
  border-radius: 999px;
  will-change: transform, left, top, width, height;
}

.bloom-heart,
.branch-heart {
  width: 100%;
  height: 100%;
  display: block;
}

.float-item {
  position: absolute;
  pointer-events: none;
  will-change: transform, opacity;
}

.float-img {
  width: auto;
  height: auto;
  max-width: 220px;
  max-height: 220px;
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
  width: 500px;
  position: absolute;
  font-size: 12px;
  font-family: Verdana, sans-serif;
  transform: scale(0.75);
  transform-origin: 0 0;
}

.seed-text-1 {
  left: 28px;
  top: -10px;
}

.seed-text-2 {
  left: 28px;
  top: 0px;
}

.seed-hit {
  position: absolute;
  cursor: pointer;
  background: transparent;
  left: var(--seed-left);
  top: var(--seed-top);
}

.seed-button {
  position: relative;
  width: 100%;
  height: 100%;
  display: block;
}

.seed-button-heart {
  width: 100%;
  height: 100%;
  display: block;
}

.seed-button-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
  pointer-events: none;
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
