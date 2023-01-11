import { P, match } from 'ts-pattern'

type Element = string
type Modifiers = Record<string, string | boolean>
type Props = Element | Modifiers | [Element, Modifiers?] | undefined

const isModifiers = (x: any): x is Modifiers => typeof x === 'object' && !Array.isArray(x)

function toKebabCase(value: string) {
  return value
    .split(/(?=[A-Z])/)
    .join('-')
    .toLowerCase()
}

function getBlockName() {
  const context = getCurrentInstance()
  if (context === null) throw new Error('Component context is null')

  const componentName = (context.vnode.type as any).name as string
  const block = toKebabCase(componentName)

  return block
}

function getBemClasses(props: Props, blockParam?: string): Set<string> {
  const block = blockParam ? blockParam : getBlockName()

  interface MatchPropsResult {
    element?: string
    modifiers?: Modifiers
  }

  const result: MatchPropsResult | null = match(props)
    .with(P.nullish, () => null)
    .with(P.when(isRef), [P.when(isRef), P.optional(P.when(isRef))], () => {
      throw new Error('Value of bem class directive must not contain refs')
    })
    .with(P.string, (element) => ({ element }))
    .with(P.when(isModifiers), (modifiers) => ({ modifiers }))
    .with([P.string, P.optional(P.when(isModifiers))], ([element, modifiers]) => ({ element, modifiers }))
    .otherwise(() => {
      throw new Error('Value of bem class directive must be string, array or object')
    })

  let classList = [block]

  if (result) {
    if (result.element) classList = [`${block}__${result.element}`]

    if (result.modifiers) {
      for (const [key, value] of Object.entries(result.modifiers)) {
        const newClass = match(value)
          .with(true, () => `${classList[0]}--${toKebabCase(key)}`)
          .with(P.string, (value) => `${classList[0]}--${toKebabCase(key)}--${value}`)
          .otherwise(() => null)

        newClass && classList.push(newClass)
      }
    }
  }

  return new Set(classList)
}

export function useBemClass() {
  const block = getBlockName()
  return {
    mounted(el: HTMLElement, { value }: { value: Props }) {
      const classList = getBemClasses(value, block)
      if (!el.bemClassList) el.bemClassList = {}
      el.bemClassList[block] = classList
      classList.forEach((item) => {
        el.classList.add(item)
      })
    },
    updated(el: HTMLElement, { value }: { value: Props }) {
      const oldClassList = el.bemClassList?.[block]
      const newClassList = getBemClasses(value, block)
      if (oldClassList) {
        oldClassList.forEach((item) => {
          if (!newClassList.has(item)) {
            el.classList.remove(item)
          }
        })
        newClassList.forEach((item) => {
          if (!el.classList.contains(item)) {
            el.classList.add(item)
          }
        })
      } else {
        newClassList.forEach((item) => {
          el.classList.add(item)
        })
      }

      if (!el.bemClassList) el.bemClassList = {}
      el.bemClassList[block] = newClassList
    },
  }
}
