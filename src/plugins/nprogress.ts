import NProgress from 'nprogress'
import { type Plugin } from '@/types'

export const install: Plugin = ({ router }) => {
  router.beforeEach((to, from) => {
    if (to.path !== from.path) NProgress.start()
  })
  router.afterEach(() => {
    NProgress.done()
  })
}
