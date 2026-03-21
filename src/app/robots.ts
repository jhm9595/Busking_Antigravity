import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Mediapartners-Google",
        allow: "/",
      },
      {
        userAgent: "Google-Display-Ads-Bot",
        allow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/auth",
          "/dashboard/",
          "/dashboard",
          "/singer/dashboard/",
          "/singer/dashboard",
          "/venue/",
          "/venue",
          "/login/",
          "/login",
          "/sign-in/",
          "/sign-in",
          "/sign-up/",
          "/sign-up",
          "/design-flow/",
          "/design-flow",
          "/design-preview/",
          "/design-preview",
          "/design-to-be/",
          "/design-to-be",
          "/test-perf-flow/",
          "/test-perf-flow",
          "/guide-draft.html",
          "/guide-i18n-board.html",
          "/guide-i18n/",
        ],
      },
    ],
    sitemap: "https://busking.minibig.pw/sitemap.xml",
  };
}
