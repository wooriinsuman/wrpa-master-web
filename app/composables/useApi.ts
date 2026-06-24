export const useApi = () => $fetch.create({
  baseURL: '/api',
  onResponseError({ response }) {
    if (response.status === 401) navigateTo(`/login?redirect=${useRoute().fullPath}`)
  },
})
