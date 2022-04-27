@Library('jenkins-library' ) _

def pipeline = new org.js.AppPipeline(
    steps: this,
    test: false,
    workerLabel: 'docker-build-agent',
    buildDockerImage: 'build-tools/node:14-alpine',
    dockerImageName: 'klaytn/klaytn-frontend',
    dockerRegistryCred: 'bot-klaytn-rw',
    packageManager: 'npm',
    buildCmds: ['npm run build'],
    dockerImageTags: ['PR-6':'test'],
    gitUpdateSubmodule: true)
pipeline.runPipeline()