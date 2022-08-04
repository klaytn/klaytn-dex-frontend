## Plugins

A custom user plugin system. Place a `.ts` file with the following template, it will be installed automatically.

```ts
import { type Plugin } from '@/types'

export const install: Plugin = ({ app, router }) => {
  // do something
}
```
