<script setup>
import { onMounted } from 'vue'
onMounted(() => useTheme().init())
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
