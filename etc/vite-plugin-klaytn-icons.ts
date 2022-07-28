import fs from 'fs/promises'
import fastGlob from 'fast-glob'
import { pascalCase } from 'change-case'
import path from 'path'
import { PluginOption } from 'vite'

const BUNCH_IMPORT = '~klay-icons'
const ICONS_DIR = path.resolve(__dirname, '../src/assets/icons')
const DTS_PATH = path.resolve(__dirname, '../src/klay-icons.d.ts')

const icons: { id: string; name: string }[] = fastGlob.sync(path.join(ICONS_DIR, '*.svg')).map((id) => {
  const [, iconNameKebabCase] = id.match(/\/([\w\-]+)\.svg$/)!
  const name = pascalCase(`klay-icon-` + iconNameKebabCase)
  return { id, name }
})

const dtsContent =
  `declare module '${BUNCH_IMPORT}' {\n` +
  `  import { type DefineComponent } from 'vue'\n` +
  icons.map(({ name }) => `  export const ${name}: DefineComponent<{}, {}, any>`).join('\n') +
  `\n}`

const BUNCH_IMPORT_CONTENT = icons.map(({ name, id }) => `export { default as ${name} } from '${id}'`).join('\n')

async function writeDts() {
  await fs.writeFile(DTS_PATH, dtsContent)
}

export default function plugin(): PluginOption {
  return {
    name: 'klaytn:icons',
    async configResolved() {
      await writeDts()
    },
    resolveId(id) {
      if (id === BUNCH_IMPORT) return id
    },
    load(id) {
      if (id === BUNCH_IMPORT) {
        return BUNCH_IMPORT_CONTENT
      }
    },
  }
}
