<script setup lang="ts">
definePageMeta({ layout: 'auth' })
const username = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)
const route = useRoute()

async function submit() {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { username: username.value, password: password.value } })
    await useAuthStore().fetchMe()
    await navigateTo((route.query.redirect as string) || '/')
  } catch {
    error.value = '로그인에 실패했습니다. 아이디와 비밀번호를 확인하세요.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="scene">
    <div class="grid-bg" aria-hidden="true" />
    <div class="glow glow--a" aria-hidden="true" />
    <div class="glow glow--b" aria-hidden="true" />

    <form class="card" @submit.prevent="submit">
      <div class="brand">
        <span class="hb" aria-hidden="true"><span class="pulse" /><span class="core" /></span>
        <div class="brand-text">
          <span class="eyebrow">SYSTEM ONLINE</span>
          <h1 class="wordmark">WRPA<span class="accent">.</span></h1>
        </div>
      </div>
      <p class="tagline">보험 자동화 관제 콘솔 — Control Room</p>

      <label class="field">
        <span class="lab">아이디</span>
        <input v-model="username" placeholder="username" autocomplete="username" />
      </label>
      <label class="field">
        <span class="lab">비밀번호</span>
        <input v-model="password" type="password" placeholder="••••••••" autocomplete="current-password" />
      </label>

      <p v-if="error" class="err" role="alert">{{ error }}</p>

      <button class="submit" :disabled="busy" type="submit">
        <span v-if="busy" class="loading"><span class="spin" aria-hidden="true" />확인 중…</span>
        <span v-else>관제 콘솔 입장</span>
      </button>

      <div class="meta">
        <span class="meta-dot" aria-hidden="true" />
        <span>48+ 보험사 · 워커 플릿 대기 중</span>
      </div>
    </form>
  </div>
</template>

<style scoped>
.scene {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--bg);
  overflow: hidden;
}

/* ambient control-room texture + glows */
.grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--line) 1px, transparent 1px),
    linear-gradient(90deg, var(--line) 1px, transparent 1px);
  background-size: 38px 38px;
  opacity: .4;
  -webkit-mask-image: radial-gradient(ellipse 72% 60% at 50% 40%, #000 28%, transparent 76%);
  mask-image: radial-gradient(ellipse 72% 60% at 50% 40%, #000 28%, transparent 76%);
}
.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(72px);
  pointer-events: none;
}
.glow--a {
  width: 440px; height: 440px;
  top: -130px; left: -110px;
  background: var(--run);
  opacity: .22;
  animation: drift-a 15s ease-in-out infinite alternate;
}
.glow--b {
  width: 380px; height: 380px;
  bottom: -150px; right: -100px;
  background: var(--done);
  opacity: .16;
  animation: drift-b 18s ease-in-out infinite alternate;
}

/* the card */
.card {
  position: relative;
  z-index: 1;
  width: min(92vw, 384px);
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 34px 30px 26px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: var(--rim), var(--elev-hi);
  animation: rise .5s cubic-bezier(.2, .7, .2, 1) both;
}
.card::before {
  content: '';
  position: absolute;
  top: 0; left: 26px; right: 26px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, var(--run), transparent);
  opacity: .85;
}

/* brand + heartbeat signature */
.brand { display: flex; align-items: center; gap: 12px; }
.hb { position: relative; width: 11px; height: 11px; flex: none; }
.pulse, .core { position: absolute; inset: 0; border-radius: 50%; background: var(--run); }
.pulse { transform-origin: center; animation: wrpaPulse 1.7s ease-out infinite; }
.core { box-shadow: 0 0 10px var(--run); }
.brand-text { display: flex; flex-direction: column; gap: 1px; }
.eyebrow {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .18em;
  color: var(--run);
}
.wordmark {
  margin: 0;
  font-family: var(--font-display);
  font-size: 27px;
  font-weight: 700;
  letter-spacing: -.02em;
  line-height: 1;
  color: var(--ink);
}
.accent { color: var(--run); }
.tagline {
  margin: -4px 0 6px;
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--ink-2);
}

/* fields */
.field { display: flex; flex-direction: column; gap: 6px; }
.lab { font-size: 11px; font-weight: 600; letter-spacing: .02em; color: var(--ink-2); }
.field input {
  padding: 11px 13px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--th);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 14px;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.field input::placeholder { color: var(--ink-2); opacity: .6; }
.field input:focus {
  outline: none;
  border-color: var(--run);
  box-shadow: 0 0 0 3px var(--run-shadow);
}

.err {
  margin: 0;
  padding: 9px 11px;
  border: 1px solid var(--fail);
  border-radius: 9px;
  background: color-mix(in srgb, var(--fail) 10%, transparent);
  color: var(--fail);
  font-size: 12px;
  font-weight: 600;
}

/* submit */
.submit {
  margin-top: 4px;
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  background: var(--run);
  color: var(--on-accent);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 10px var(--run-shadow), inset 0 1px 0 rgba(255, 255, 255, .2);
  transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease;
}
.submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px var(--run-shadow), inset 0 1px 0 rgba(255, 255, 255, .2); }
.submit:active:not(:disabled) { transform: translateY(0); }
.submit:disabled { opacity: .6; cursor: progress; }
.loading { display: inline-flex; align-items: center; gap: 8px; }
.spin {
  width: 13px; height: 13px;
  border: 2px solid rgba(255, 255, 255, .4);
  border-top-color: var(--on-accent);
  border-radius: 50%;
  animation: spin .7s linear infinite;
}

/* footer meta */
.meta {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 8px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--ink-2);
}
.meta-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--done);
  box-shadow: 0 0 7px var(--done);
  animation: blink 2.4s ease-in-out infinite;
}

@keyframes wrpaPulse { 0% { transform: scale(1); opacity: .55; } 100% { transform: scale(3.6); opacity: 0; } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
@keyframes drift-a { to { transform: translate(40px, 30px); } }
@keyframes drift-b { to { transform: translate(-36px, -26px); } }

@media (prefers-reduced-motion: reduce) {
  .pulse, .meta-dot, .glow--a, .glow--b { animation: none; }
  .card { animation: none; }
  .submit { transition: none; }
}
</style>
