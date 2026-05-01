import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/",         name: "home",     component: () => import("@/views/HomeView.vue") },
    { path: "/welcome",  name: "welcome",  component: () => import("@/views/WelcomeView.vue") },
    { path: "/photo",    redirect: "/generate" },
    { path: "/generate", name: "generate", component: () => import("@/views/GenerateView.vue") },
    { path: "/library",  name: "library",  component: () => import("@/views/LibraryView.vue") },
    { path: "/blog",     name: "blog",     component: () => import("@/views/BlogView.vue") },
    { path: "/blog/:slug", name: "blog-post", component: () => import("@/views/BlogPostView.vue") },
    { path: "/share/:slug", name: "share", component: () => import("@/views/ShareView.vue") },
    { path: "/profile", name: "profile", component: () => import("@/views/ProfileView.vue") },
    { path: "/about", name: "about", component: () => import("@/views/AboutView.vue") },
    { path: "/glossary", name: "glossary", component: () => import("@/views/GlossaryView.vue") },
    { path: "/legal/:kind?", name: "legal", component: () => import("@/views/LegalView.vue") },
    { path: "/changelog", name: "changelog", component: () => import("@/views/ChangelogView.vue") },
    { path: "/playground", name: "playground", component: () => import("@/views/PlaygroundView.vue") },
    { path: "/api-docs", name: "api-docs", component: () => import("@/views/ApiDocsView.vue") },
    { path: "/case-studies", name: "case-studies", component: () => import("@/views/CaseStudiesView.vue") },
    { path: "/case-studies/:slug", name: "case-study", component: () => import("@/views/CaseStudiesView.vue") },
    { path: "/videos", name: "videos", component: () => import("@/views/VideosView.vue") },
    { path: "/:rest(.*)*", name: "not-found", component: () => import("@/views/NotFoundView.vue") },
  ],
});

export default router;
