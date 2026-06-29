<script setup lang="ts">
import { computed } from 'vue'
import { NAV } from '~/utils/nav'

const route = useRoute()
const current = computed(() => NAV.find(n => n.route === route.path))
</script>

<template>
  <div class="shell">
    <AppSidebar />
    <div class="shell-main">
      <AppTopbar :title="current?.label ?? 'WRPA'" />
      <main class="shell-content"><slot /></main>
    </div>
    <WToast />
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--bg);
  color: var(--ink);
}

.shell-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.shell-content {
  padding: 24px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* List pages render a single root <section class="panel"> — let it fill the
   viewport height so its data table scrolls internally with a pinned header
   instead of the whole page scrolling. Dashboard panels live inside .dash
   (not a direct child), so they keep natural page scroll. */
.shell-content > :deep(.panel) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

@media (max-width: 880px) {
  .shell-content {
    padding: 16px;
    padding-bottom: 88px;
  }
}
</style>
