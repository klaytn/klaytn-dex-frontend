@Library('jenkins-library' ) _

def pipeline = new org.js.AppPipeline(
    steps: this,
    test: false,
    buildDockerImage: 'build-tools/node:14-alpine',
    dockerImageName: 'klaytn/klaytn-frontend',
    dockerRegistryCred: 'bot-klaytn-rw',
    packageManager: 'npm',
    buildCmds: ['npm run build'],
    sonarProjectName: 'klaytn-frontend',
    sonarProjectKey: 'jp.co.soramitsu:klaytn-frontend',
    gitUpdateSubmodule: true)
pipeline.runPipeline()