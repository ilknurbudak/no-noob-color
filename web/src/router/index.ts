import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/",         name: "home",     component: () => import("@/views/HomeView.vue") },
    { path: "/photo",    redirect: "/generate" },
    { path: "/generate", name: "generate", component: () => import("@/views/GenerateView.vue") },
    { path: "/library",  name: "library",  component: () => import("@/views/LibraryView.vue") },
    { path: "/blog",     name: "blog",     component: () => import("@/views/BlogView.vue") },
    { path: "/blog/:slug", name: "blog-post", component: () => import("@/views/BlogPostView.vue") },
    { path: "/share/:slug", name: "share", component: () => import("@/views/ShareView.vue") },
    { path: "/profile", name: "profile", component: () => import("@/views/ProfileView.vue") },
    { path: "/about", name: "about", component: () => import("@/views/AboutView.vue") },
    { path: "/:rest(.*)*", name: "not-found", component: () => import("@/views/NotFoundView.vue") },
  ],
});

export default router;
