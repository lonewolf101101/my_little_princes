<template>
  <div id="main">
    <div id="error">
      <a
        href="http://www.google.cn/chrome/intl/zh-CN/landing_chrome.html?hl=zh-CN&brand=CHMI"
        >Chrome</a
      >
      (<a href="http://firefox.com.cn/download/">Firefox</a>)
    </div>

    <!-- Original audio element (autoplay is best-effort; click will force play) -->
    <audio autoplay height="100" width="100" id="myAudio" ref="audioEl">
      <source src="/aud.mp3" type="audio/mp3" />
      <embed height="100" width="100" src="/aud.mp3" />
    </audio>

    <div id="wrap" ref="wrapRef">
      <div id="scene">
        <div id="text">
          <div
            id="code"
            :style="{ display: codeVisible ? 'block' : 'none' }"
            v-html="typedHtml"
          />
        </div>

        <!-- Canvas replaced with DOM/SVG renderer; id/class preserved via #canvas wrapper -->
        <BirthdayCanvasDom
          :width="scene.width"
          :height="scene.height"
          :seed-x="scene.seedX.value"
          :seed-y="scene.seedY.value"
          :seed-color="scene.seedColor.value"
          :seed-scale="scene.seedScale.value"
          :heart-scale="0.5"
          :leaf-heart-scale="1.5"
          :seed-show-heart="scene.seedShowHeart.value"
          :seed-circle-x="scene.seedCircleX.value"
          :seed-circle-y="scene.seedCircleY.value"
          :seed-circle-scale="scene.seedCircleScale.value"
          :seed-circle-radius="scene.seedCircleRadius"
          :footer-len="scene.footerLen.value"
          :footer-height="scene.footerHeight"
          :dots="scene.dots.value"
          :bloom-stamps="scene.bloomStamps.value"
          :float-items="scene.floatItems.value"
          :tree-translate-x="scene.treeTranslateX.value"
          :canvas-flash="scene.canvasFlash.value"
          @seed-click="handleSeedClick"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BirthdayCanvasDom from "~/components/BirthdayCanvasDom.vue";
import { useBirthdayScene } from "~/composables/useBirthdayScene";

const audioEl = ref<HTMLAudioElement | null>(null);

const scene = useBirthdayScene();

// Original DOM content (kept as HTML so typewriter preserves <span> styling)
const codeLines = [
  '<span class="say">Хайрт чамдаа 💕</span>',
  '<span class="say">Төрсөн өдрийн мэнд хүргэе ❤️🎂</span>',
  '<span class="say">Чамтай хамт өнгөрүүлдэг мөч бүртээ</span>',
  '<span class="say">би үнэхээр талархдаг ✨</span>',
  '<span class="say">Чи зүгээр л өөрөөрөө байснаараа</span>',
  '<span class="say">миний өдрүүдийг гэрэлтүүлдэг ✨</span>',
  '<span class="say">Чи бол миний шөнийг гэрэлтүүлэх</span>',
  '<span class="say">сарны намуухан туяа 🌙</span>',
  '<span class="say">Өнөөдөр чамд энэ дэлхий</span>',
  '<span class="say">өгч чадах хамгийн их</span>',
  '<span class="say">аз жаргалыг хүсье 💖✨</span>',
];

const perLineDurationSec = 1.5;

const typedHtml = ref("");
const codeVisible = ref(false);

const wrapRef = ref<HTMLDivElement | null>(null);

let onResize: (() => void) | null = null;

const playAudio = async () => {
  const el = audioEl.value;
  if (!el) return;
  try {
    await el.play();
  } catch {
    // Autoplay may be blocked; click will usually allow playback.
  }
};

const typewriter = async () => {
  // Port of $.fn.typewriter from her-birthday-main/file/function.js
  codeVisible.value = true;
  typedHtml.value = "";

  let rendered = "";
  for (const [lineIndex, lineHtml] of codeLines.entries()) {
    const visibleChars = lineHtml.replace(/<[^>]*>/g, "").length;
    const lineDurationMs = perLineDurationSec * 1000;
    const stepDelay = visibleChars
      ? Math.max(16, lineDurationMs / visibleChars)
      : lineDurationMs;

    let progress = 0;
    while (progress < lineHtml.length) {
      const current = lineHtml.substr(progress, 1);
      if (current === "<") {
        progress = lineHtml.indexOf(">", progress) + 1;
      } else {
        progress += 1;
      }

      typedHtml.value =
        rendered + lineHtml.substring(0, progress) + (progress & 1 ? "_" : "");
      await new Promise<void>((r) => setTimeout(r, stepDelay));
    }

    rendered += lineHtml;
    if (lineIndex < codeLines.length - 1) {
      rendered += "<br>";
    }
    typedHtml.value = rendered;
  }
};

const handleSeedClick = async () => {
  await playAudio();
  scene.onSeedClick();
};

onMounted(async () => {
  const baseWidth = 1100;
  const baseHeight = 680;

  let rafId = 0;
  const applyScale = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const padding = 16;
      const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight;
      const safeWidth = Math.max(0, viewportWidth - padding);
      const safeHeight = Math.max(0, viewportHeight - padding);
      const scale = Math.min(safeWidth / baseWidth, safeHeight / baseHeight, 1);
      if (wrapRef.value) {
        wrapRef.value.style.setProperty("--scene-scale", String(scale));
      }
    });
  };
  applyScale();

  // Port of resize behavior from her-birthday-main/file/function.js
  const w = window.innerWidth;
  const h = window.innerHeight;
  onResize = () => {
    const newW = window.innerWidth;
    const newH = window.innerHeight;
    applyScale();
    if (newW !== w && newH !== h) {
      location.replace(location.href);
    }
  };
  window.addEventListener("resize", onResize);

  // Original opts from index.html
  const opts = {
    branch: [
      [
        535,
        680,
        570,
        250,
        500,
        200,
        30,
        100,
        [
          [
            540,
            500,
            455,
            417,
            340,
            400,
            13,
            100,
            [[450, 435, 434, 430, 394, 395, 2, 40]],
          ],
          [
            550,
            445,
            600,
            356,
            680,
            345,
            12,
            100,
            [[578, 400, 648, 409, 661, 426, 3, 80]],
          ],
          [539, 281, 537, 248, 534, 217, 3, 40],
          [
            546,
            397,
            413,
            247,
            328,
            244,
            9,
            80,
            [
              [427, 286, 383, 253, 371, 205, 2, 40],
              [498, 345, 435, 315, 395, 330, 4, 60],
            ],
          ],
          [
            546,
            357,
            608,
            252,
            678,
            221,
            6,
            100,
            [[590, 293, 646, 277, 648, 271, 2, 80]],
          ],
        ],
      ],
    ],
    bloom: {
      num: 700,
      width: 1080,
      height: 650,
    },
    timing: {
      seedFallDurationSec: 25,
      treeGrowDurationSec: 0,
      bloomDurationSec: 27,
      moveAfterGrow: false,
      maxFloatItems: 18,
      floatSpawnPerSec: 0.6,
      floatDespawnY: -900,
      floatFadeRange: 800,
    },
  } as const;

  // Run the full animation sequence (seed -> grow -> bloom -> move)
  await scene.run(opts);

  // Port of textAnimate/runAsync tail from index.html
  await typewriter();
});

onBeforeUnmount(() => {
  if (onResize) {
    window.removeEventListener("resize", onResize);
  }
});
</script>
