<script setup lang="ts">
definePageMeta({ layout: 'auth' })
const username = ref(''); const password = ref(''); const error = ref(''); const busy = ref(false)
const route = useRoute()
async function submit() {
  busy.value = true; error.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { username: username.value, password: password.value } })
    await useAuthStore().fetchMe()
    await navigateTo((route.query.redirect as string) || '/')
  } catch { error.value = '로그인에 실패했습니다. 아이디와 비밀번호를 확인하세요.' }
  finally { busy.value = false }
}
</script>
<template>
  <form class="login-card" @submit.prevent="submit">
    <h1>WRPA 관제</h1>
    <input v-model="username" placeholder="아이디" autocomplete="username" />
    <input v-model="password" type="password" placeholder="비밀번호" autocomplete="current-password" />
    <p v-if="error" class="err">{{ error }}</p>
    <button :disabled="busy" type="submit">{{ busy ? '확인 중…' : '로그인' }}</button>
  </form>
</template>
