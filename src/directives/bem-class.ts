export function useBemClass() {
  const context = getCurrentInstance()
  const componentName = (context?.vnode.type as any).name as String
  const block = componentName.split(/(?=[A-Z])/).join('-').toLowerCase()
  return {
    mounted(el: HTMLElement, { value }: { value?: string | [string] | [string, Record<string, any>] | Record<string, any> }) {
      if (typeof value !== 'string' && !Array.isArray(value) && value !== undefined && typeof value !== 'object')
        throw new Error('Value of bem class directive must be string, array or object')
      let classList = [block]
      if (value) {
        if (typeof value === 'string' || Array.isArray(value)) {
          const element = typeof value === 'string' ? value : value[0]
          if (element)
            classList = [`${block}__${element}`]
        }
        const modifiers = value[1] || value
        if (typeof modifiers === 'object') {
          Object.entries(modifiers).forEach(([key, value]) => {
            if (typeof value === 'boolean') {
              if (value)
                classList.push(`${classList[0]}--${key}`)
              else
                classList.push(`${classList[0]}--${key}-${value}`)
            }
          })
        }
      }
      classList.forEach((item) => {
        el.classList.add(item)
      })
    },
  }
}

export default {
  useBemClass,
}
