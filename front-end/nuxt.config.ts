// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/css/tailwind.css", "~/assets/css/her-birthday.css"],
  modules: ["@nuxt/ui"],
  app: {
    head: {
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/heart-solid-full.svg" },
      ],
    },
  },
});
