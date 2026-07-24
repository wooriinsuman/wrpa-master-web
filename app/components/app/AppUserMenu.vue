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
  <div v-if="auth.isAuthed" class="um-wrap">
    <DropdownMenuRoot>
      <DropdownMenuTrigger class="um-trigger">
        <div class="um-role">{{ roleLabel }}</div>
        <div class="um-name">{{ displayName }}</div>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent class="um-content" :side-offset="6" align="start">
          <DropdownMenuItem class="um-item" @select="goSessions">계정/세션 관리</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
    <button type="button" class="um-logout" aria-label="로그아웃" @click="onLogout">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
      <span>로그아웃</span>
    </button>
  </div>
</template>

<style scoped>
.um-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

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

.um-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px 9px;
  border-radius: 10px;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--fail);
  cursor: pointer;
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
}

.um-logout:hover {
  background: var(--nav-active);
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
</style>
