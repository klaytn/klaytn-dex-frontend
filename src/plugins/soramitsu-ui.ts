import { plugin } from '@soramitsu-ui/ui'
import { type Plugin } from '@/types'

export const install: Plugin = ({ app }) => {
  app.use(plugin)
}
