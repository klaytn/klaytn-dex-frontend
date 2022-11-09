import type { EnvGit } from '@/types'

if (import.meta.env.VITE_GIT) {
  const { branch, revision, date }: EnvGit = JSON.parse(import.meta.env.VITE_GIT)

  const BRAND_COLOR = '#2177F8'

  console.log(
    '%cGit%c\nRevision: %c%s%c%s\nBranch: %c%s%c\nDate: %o',
    `color:${BRAND_COLOR};font-size:5em;text-shadow: 3px 3px 0px #E3EDFC;padding: 5px`,
    '',
    `font-weight:bold;color:${BRAND_COLOR}`,
    revision.slice(0, 7),
    '',
    revision.slice(7),
    `font-weight:bold;color:${BRAND_COLOR}`,
    branch,
    '',
    new Date(date),
  )
}
