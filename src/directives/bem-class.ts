import { type ComponentInternalInstance } from 'vue'

type Element = string
type Modifiers = Record<string, any>
type Props = Element | [Element, Modifiers?] | Modifiers | undefined

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

export function getBemClasses(props: Props, blockParam?: string): Set<string> {
  const block = blockParam ? blockParam : getBlockName()

  if (isRef(props) || isRef(props?.[0]) || isRef(props?.[1]))
    throw new Error('Value of bem class directive must not contain refs')
  if (typeof props !== 'string' && !Array.isArray(props) && props !== undefined && typeof props !== 'object')
    throw new Error('Value of bem class directive must be string, array or object')
  let classList = [block]
  if (props) {
    if (typeof props === 'string' || Array.isArray(props)) {
      const element = typeof props === 'string' ? props : props[0]
      if (element) classList = [`${block}__${element}`]
    }
    const modifiers = props[1] || props
    if (typeof modifiers === 'object') {
      Object.entries(modifiers).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          if (value) classList.push(`${classList[0]}--${toKebabCase(key)}`)
        } else {
          classList.push(`${classList[0]}--${toKebabCase(key)}--${value}`)
        }
      })
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

export default {
  useBemClass,
}
