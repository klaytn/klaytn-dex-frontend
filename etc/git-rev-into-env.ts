import git from 'git-rev-sync'
import type { EnvGit } from '../src/types'

const composed: EnvGit = {
  revision: git.long(),
  branch: git.branch(),
  date: git.date().toISOString(),
}

process.env.VITE_GIT = JSON.stringify(composed)
