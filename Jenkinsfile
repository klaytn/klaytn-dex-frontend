@Library('jenkins-library' ) _

def pipeline = new org.js.AppPipeline(
    steps: this,
    test: false,
    dockerImageName: 'klaytn/klaytn-frontend',
    dockerRegistryCred: 'bot-klaytn-rw',
    dockerImageTags: ['PR-6':'test'],
    workerLabel: 'docker-build-agent',
    dockerFileName: 'Dockerfile',
    buildDockerImage: 'build-tools/node:14-alpine',
    packageManager: 'npm',
    buildCmds: ['npm run build'],
    gitUpdateSubmodule: true)
pipeline.runPipeline()