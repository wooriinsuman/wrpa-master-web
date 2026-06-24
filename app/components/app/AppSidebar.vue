<script setup lang="ts">
import { computed } from 'vue'
import { NAV } from '~/utils/nav'

const route = useRoute()
const isActive = (itemRoute: string) => {
  if (itemRoute === '/') return route.path === '/'
  return route.path === itemRoute || route.path.startsWith(itemRoute + '/')
}
</script>

<template>
  <aside class="sidebar">
    <!-- Brand -->
    <div class="brand">
      <div class="brand-logo">W</div>
      <div class="brand-text">
        <div class="brand-name">WRPA</div>
        <div class="brand-sub">CONTROL ROOM</div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="nav">
      <NuxtLink
        v-for="item in NAV"
        :key="item.id"
        :to="item.route"
        class="nav-item"
        :class="{ 'nav-item--active': isActive(item.route) }"
      >
        <span class="nav-bar" />
        <span class="nav-code">{{ item.code }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <!-- Operator footer -->
    <div class="operator">
      <div class="operator-role">운영자</div>
      <div class="operator-name">박지운 · 관제 1팀</div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 236px;
  flex: none;
  background: var(--panel);
  border-right: 1px solid var(--line);
  padding: 18px 14px;
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 40;
  box-shadow: 6px 0 24px rgba(16, 24, 40, 0.05);
}

/* Brand block */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px;
}

.brand-logo {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--ink);
  color: var(--panel);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 15px;
  box-shadow: 0 2px 8px rgba(27, 36, 48, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.18);
  flex: none;
}

.brand-text {
  line-height: 1.15;
}

.brand-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.04em;
  color: var(--ink);
}

.brand-sub {
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--ink-2);
  letter-spacing: 0.14em;
}

/* Nav */
.nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 9px;
  border-radius: 9px;
  text-decoration: none;
  background: transparent;
  position: relative;
  cursor: pointer;
  transition: background 0.15s ease;
}

.nav-item:hover {
  background: var(--th);
}

.nav-item--active {
  background: var(--nav-active);
}

/* Left-side active bar */
.nav-bar {
  width: 3px;
  height: 18px;
  border-radius: 2px;
  background: transparent;
  position: absolute;
  left: -3px;
}

.nav-item--active .nav-bar {
  background: var(--run);
  box-shadow: 0 0 8px var(--run);
}

/* Code chip */
.nav-code {
  width: 26px;
  height: 22px;
  flex: none;
  border-radius: 6px;
  background: var(--th);
  color: var(--ink-2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 600;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.nav-item--active .nav-code {
  background: rgba(45, 125, 210, 0.12);
  color: var(--run);
  box-shadow: inset 0 1px 0 rgba(45, 125, 210, 0.2);
}

/* Nav label */
.nav-label {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--ink-2);
  transition: color 0.15s ease;
}

.nav-item--active .nav-label {
  color: var(--ink);
}

/* Operator footer */
.operator {
  margin-top: auto;
  padding: 10px 9px;
  border-radius: 10px;
  background: var(--th);
  border: 1px solid var(--line);
}

.operator-role {
  font-size: 11px;
  color: var(--ink-2);
  margin-bottom: 3px;
}

.operator-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink);
}

/* 880px responsive: collapse to bottom tab bar */
@media (max-width: 880px) {
  .sidebar {
    position: fixed !important;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto !important;
    width: 100% !important;
    height: auto !important;
    flex-direction: row !important;
    overflow-x: auto;
    border-right: none !important;
    border-top: 1px solid var(--line);
    z-index: 60;
    padding: 8px 10px !important;
    gap: 8px !important;
  }

  .brand {
    display: none !important;
  }

  .nav {
    flex-direction: row !important;
    gap: 4px !important;
  }

  .nav-label {
    display: none !important;
  }

  .operator {
    display: none !important;
  }
}
</style>
