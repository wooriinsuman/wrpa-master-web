<!-- app/components/app/AppUserMenu.vue -->
<script setup lang="ts">
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem } from 'reka-ui'

const auth = useAuthStore()
const displayName = computed(() => auth.user?.username ?? '사용자')
const roleLabel = computed(() => auth.user?.roles?.[0] ?? '')

async function goSessions() {
  await navigateTo('/account/sessions')
}
async function onLogout() {
  await auth.logout()
}
</script>

<template>
  <DropdownMenuRoot v-if="auth.isAuthed">
    <DropdownMenuTrigger class="um-trigger">
      <div class="um-role">{{ roleLabel }}</div>
      <div class="um-name">{{ displayName }}</div>
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent class="um-content" :side-offset="6" align="start">
        <DropdownMenuItem class="um-item" @select="goSessions">계정/세션 관리</DropdownMenuItem>
        <DropdownMenuItem class="um-item um-item--danger" @select="onLogout">로그아웃</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<style scoped>
.um-trigger {
  width: 100%;
  text-align: left;
  padding: 10px 9px;
  border-radius: 10px;
  background: var(--th);
  border: 1px solid var(--line);
  cursor: pointer;
  font: inherit;
  color: inherit;
}

.um-role {
  font-size: 11px;
  color: var(--ink-2);
  margin-bottom: 3px;
}

.um-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink);
}

.um-content {
  min-width: 180px;
  padding: 6px;
  border-radius: 10px;
  background: var(--panel);
  border: 1px solid var(--line);
  box-shadow: 0 12px 32px rgba(16, 24, 40, 0.14);
  z-index: 100;
}

.um-item {
  padding: 8px 10px;
  border-radius: 7px;
  font-size: 12.5px;
  color: var(--ink);
  cursor: pointer;
  outline: none;
}

.um-item:hover,
.um-item[data-highlighted] {
  background: var(--nav-active);
}

.um-item--danger {
  color: #c0392b;
}
</style>
