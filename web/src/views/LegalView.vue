<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const kind = computed<"privacy" | "terms">(() =>
  String(route.params.kind) === "terms" ? "terms" : "privacy"
);
</script>

<template>
  <section class="legal">
    <header class="head">
      <span class="eyebrow">{{ kind === "privacy" ? "Privacy policy" : "Terms of service" }}</span>
      <h1>
        {{ kind === "privacy"
          ? "We collect what we need, nothing else."
          : "Use it, share it, don't pretend you wrote it." }}
      </h1>
      <p class="meta">Last updated: 2026-05-01</p>
    </header>

    <!-- PRIVACY -->
    <article v-if="kind === 'privacy'">
      <h2>What we collect</h2>
      <p>
        If you create an account, we store your <strong>email address</strong>
        and a hashed <strong>password</strong>. That's it. Your library —
        palettes, tags, folders, favorites — is stored on your PocketBase
        instance under your user record.
      </p>

      <h2>What we don't collect</h2>
      <ul>
        <li>No analytics scripts, tracking pixels, or third-party fingerprinting.</li>
        <li>No telemetry of which palettes you view or generate.</li>
        <li>No cross-site cookies. No marketing or remarketing IDs.</li>
        <li>No phone numbers, addresses, or "verify with phone".</li>
      </ul>

      <h2>What lives on your device</h2>
      <p>
        When you're not signed in, everything (saved palettes, taste training,
        liked colors, theme preference, persona choice) lives in your browser's
        localStorage. We never see it. Clearing site data wipes it. Use the
        Library export button before clearing if you want a backup.
      </p>

      <h2>Image processing</h2>
      <p>
        When you drop a reference image, it's resized in the browser to max
        1200px and sent to our Python service for k-means extraction. The
        image is processed in memory and discarded — we never store, log,
        or transmit your photo to third parties. Thumbnails saved with
        palettes are stored on your PocketBase under your account.
      </p>

      <h2>Optional AI providers</h2>
      <p>
        If you configure an OpenAI or Apify API key (server-side env), prompt
        text is forwarded to that provider per their privacy policy. We don't
        log the prompt or response. The keys live in your env, not in our
        codebase.
      </p>

      <h2>Cookies</h2>
      <p>
        We use a session cookie for PocketBase auth (httpOnly, same-site).
        No advertising cookies. No analytics cookies.
      </p>

      <h2>Your data, your call</h2>
      <p>
        Sign out: drop the auth token from this device. Delete your account:
        currently a manual step — email <a href="mailto:hello@nonoob.color">hello@nonoob.color</a>
        and we'll wipe the user + cascade-delete all linked palettes within
        72 hours. GDPR / KVKK rights (access, rectification, erasure,
        portability) apply.
      </p>
    </article>

    <!-- TERMS -->
    <article v-else>
      <h2>The rules, briefly</h2>
      <ol>
        <li>This is free software for personal and commercial use.</li>
        <li>Don't claim you wrote it. The source is on GitHub; credit is welcome but not required.</li>
        <li>Don't use it to harass, deceive, or generate content that infringes someone else's rights.</li>
        <li>The "Trademark check" feature is sanity-check, not legal advice.</li>
        <li>The Pantone-like data is approximate, NOT licensed. For production work that needs exact PMS, license Pantone Connect.</li>
      </ol>

      <h2>Warranty</h2>
      <p>
        The software is provided "as is", without warranty of any kind. We're
        a one-person operation; if something breaks, file an issue and we'll
        try to fix it, but no guarantees on timeline.
      </p>

      <h2>Liability</h2>
      <p>
        We're not liable for color drift between your screen and your printer.
        We're not liable for brand decisions you make using these tools. We're
        not liable for indirect, consequential, or incidental damages —
        always preview real proofs before committing budget.
      </p>

      <h2>Changes</h2>
      <p>
        These terms may change as the project grows. Major changes will be
        announced in a public changelog. Minor wording updates won't.
      </p>

      <h2>Contact</h2>
      <p>
        Issues, feature requests, vulnerabilities:
        <a href="https://github.com/ilknurbudak/no-noob-color/issues" target="_blank" rel="noopener">GitHub Issues</a>
        or email <a href="mailto:hello@nonoob.color">hello@nonoob.color</a>.
      </p>
    </article>
  </section>
</template>

<style scoped>
.legal { max-width: 720px; margin: 0 auto; padding-bottom: var(--s-7); }
.head {
  margin-bottom: var(--s-6);
  border-bottom: 1px solid var(--hairline);
  padding-bottom: var(--s-5);
}
.eyebrow {
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--text-3);
}
.head h1 {
  font-family: var(--sans);
  font-style: italic;
  font-weight: 800;
  font-size: 32px;
  letter-spacing: -.02em;
  line-height: 1.1;
  margin: var(--s-3) 0;
  color: var(--text);
}
.meta {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-3);
  letter-spacing: .04em;
  margin: 0;
}
article { display: flex; flex-direction: column; gap: var(--s-4); }
article h2 {
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--text-3);
  font-weight: 600;
  margin: var(--s-3) 0 0;
}
article p, article li {
  font-size: 14px;
  line-height: 1.65;
  color: var(--text);
  margin: 0;
}
article p strong { font-weight: 600; }
article ul, article ol { padding-left: 1.4em; margin: 0; }
article li { padding: 4px 0; }
article a { color: var(--text); text-decoration: underline; }
</style>
