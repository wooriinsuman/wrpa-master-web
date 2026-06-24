import { ref } from 'vue'
const dark = ref(false)
export function useTheme() {
  function apply() { document.documentElement.setAttribute('data-theme', dark.value ? 'dark' : 'light') }
  function toggle() { dark.value = !dark.value; localStorage.setItem('wrpa-theme', dark.value ? 'dark' : 'light'); apply() }
  function init() { dark.value = localStorage.getItem('wrpa-theme') === 'dark'; apply() }
  return { dark, toggle, init }
}
