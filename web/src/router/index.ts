import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/",         name: "home",     component: () => import("@/views/HomeView.vue") },
    { path: "/photo",    name: "photo",    component: () => import("@/views/PhotoView.vue") },
    { path: "/generate", name: "generate", component: () => import("@/views/GenerateView.vue") },
    { path: "/library",  name: "library",  component: () => import("@/views/LibraryView.vue") },
    { path: "/blog",     name: "blog",     component: () => import("@/views/BlogView.vue") },
    { path: "/blog/:slug", name: "blog-post", component: () => import("@/views/BlogPostView.vue") },
    { path: "/:rest(.*)*", redirect: "/" },
  ],
});

export default router;
