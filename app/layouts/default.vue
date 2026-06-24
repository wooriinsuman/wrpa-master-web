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
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
}

.shell-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.shell-content {
  padding: 24px;
  flex: 1;
}

@media (max-width: 880px) {
  .shell-content {
    padding: 16px;
    padding-bottom: 88px;
  }
}
</style>
