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

        <div id="clock-box">
          <span id="clock">577 days 0 hours 0 minutes 0 seconds</span>
        </div>

        <!-- Canvas replaced with DOM/SVG renderer; id/class preserved via #canvas wrapper -->
        <BirthdayCanvasDom
          :width="scene.width"
          :height="scene.height"
          :seed-x="scene.seedX.value"
          :seed-y="scene.seedY.value"
          :seed-color="scene.seedColor.value"
          :seed-scale="scene.seedScale.value"
          :seed-show-heart="scene.seedShowHeart.value"
          :seed-circle-x="scene.seedCircleX.value"
          :seed-circle-y="scene.seedCircleY.value"
          :seed-circle-scale="scene.seedCircleScale.value"
          :seed-circle-radius="scene.seedCircleRadius"
          :footer-len="scene.footerLen.value"
          :footer-height="scene.footerHeight"
          :dots="scene.dots.value"
          :bloom-stamps="scene.bloomStamps.value"
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

// Original DOM content (kept as HTML so typewriter preserves <span> and <br>)
const codeHtml =
  '<span class="say">Hey you 💞</span><br>' +
  '<span class="say">Happy Birthday 🎈</span><br>' +
  '<span class="say">May God bless you 🍀</span><br>' +
  '<span class="say">And give u many happiness 💕</span><br>' +
  '<span class="say">Just saying... you\'re pretty awesome ❤️</span><br>' +
  '<span class="say">Sending good vibes and maybe a wink 😏</span><br>' +
  '<span class="say">Hope u have a great day today ❤️😘</span><br>';

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

  let progress = 0;
  while (progress < codeHtml.length) {
    const current = codeHtml.substr(progress, 1);
    if (current === "<") {
      progress = codeHtml.indexOf(">", progress) + 1;
    } else {
      progress += 1;
    }

    typedHtml.value =
      codeHtml.substring(0, progress) + (progress & 1 ? "_" : "");
    await new Promise<void>((r) => setTimeout(r, 75));
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
      const scale = Math.min(
        window.innerWidth / baseWidth,
        window.innerHeight / baseHeight,
        1,
      );
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
