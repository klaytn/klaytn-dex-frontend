@Library('jenkins-library' ) _

def pipeline = new org.js.AppPipeline(
    steps: this,
    buildDockerImage: 'build-tools/node:16-pnpm7',
    dockerImageName: 'klaytn/klaytn-frontend',
    dockerRegistryCred: 'bot-klaytn-rw',
    npmRegistries: [:],
    packageManager: 'pnpm',
    testCmds: ['pnpm format:check','pnpm lint','pnpm typecheck','pnpm test'],
    buildCmds: ['cp .env.example .env','pnpm build'],
    sonarProjectName: 'klaytn-frontend',
    sonarProjectKey: 'jp.co.soramitsu:klaytn-frontend',
    gitUpdateSubmodule: true)
pipeline.runPipeline()
