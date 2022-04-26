@Library('jenkins-library' ) _

def pipeline = new org.docker.AppPipeline(steps: this,
    dockerImageName: 'klaytn/klaytn-frontend',
    buildDockerImage: 'docker.soramitsu.co.jp/build-tools/node:14-ubuntu-extended',
    dockerRegistryCred: 'bot-polkaswap-rw',
    dockerRegistryCred: 'bot-klaytn-rw',
    gitUpdateSubmodule: true)
pipeline.runPipeline()