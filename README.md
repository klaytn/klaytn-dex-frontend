# Repo template

Template repository to help setup new projects in ground-x.

## Checklist

- [ ] PR 리뷰어로 등록될 프로젝트 담당 개발자 지정 `.github/CODEOWNERS`
- [ ] 테스트 구성 (unit, lint, coverage, integration, e2e, sanity)
- [ ] (Optional) example-Dockerfile 참고하여 Dockerfile 작성
- [ ] branch policy 설정(Dev, Master) 확인
- [ ] CI/CD Pipeline 설정
- [ ] example-REAME.md 참고하여 README 작성 

# Category

## GX 공통 개발 프로세스
- 프로젝트 레포의 fork를 떠서 개발을 한다.
- 개인의 repo에서 ground-x/project dev(dev가 없을 경우 master) branch로 PR을 올려 코드 리뷰를 한다.
- 2명 이상의 approve 후에 머지를 한다.

참고: [Standard CI/CD pipeline](https://groundx.atlassian.net/wiki/spaces/PG/pages/324305133/Standard+CI+CD+Pipeline)

## CI/CD pipeline
CI/CD pipeline은 환경이 얼마나 필요하냐에 따라 크게 두가지로 분류.

### One branch
master 브랜치 하나를 가지고 태깅으로 production에 배포. 주로 개발 공수가 많이 안들어가는 static site의 경우가 이에 해당.

환경
- Prod
- (optional) dev

배포
- dev: master branch PR merge(코드 리뷰)
- prod: master branch에서 `/env/prod/{{ prefix }}` 태그가 push 될때 마다 
Example
- klaytn-homepage, groundx-homepage, kaikas-mobile-homepage.. etc.

### Multi branch
dev, master 브랜치를 여러개 사용해서 여러 환경에 배포. QA환경(rc)이 추가되고 performance, staging 환경이 추가될 수 있음. 주로 개발 공수가 꽤 들어가는 major project일 경우 이에 해당.

환경
- dev, QA, Prod
- (optional) performance, staging

배포
- dev: dev branch PR merge(코드 리뷰)
- QA: rc tagging ex, `v1.1.0-rc.1`
- staging: master branch PR merge(QA Sign-off) -- performance 환경이 추가될 수 있음.
- prod: approve by circleci console(alert to slack channel #tech_release)
Example
- go-klip-backend, klip-front, kas-auth, kaikas-pixeplex, klaytn, caver-js, caver-java, wallet-api.. etc. 

### Hotfix
hotfix가 필요할땐 [hotfix process](https://groundx.atlassian.net/wiki/spaces/PG/pages/770998428/Standard+CI+CD+Pipeline+-+Hotfix+Differences) 대로 진행.

master branch에서 `hotfix/v1.1.0`라는 브랜치 생성. 해당 브랜치로 PR 생성하여 코드리뷰 진행
- live product인 경우: hotfix 브랜치 PR 머지시 QA에 배포
- klaytn 같은 binary인 경우: PR 머지하여 hotfix 브랜치에서 rc 생성시 rc 버전 배포

## Tests
- Unit test
- Integration test
- Sanity Check

More deails: [Project Test Types](https://groundx.atlassian.net/wiki/spaces/PG/pages/795836631/Project+Test+Types+Draft)

## Docker image
CI나 로컬 환경을 위해 도커 이미지가 필요하다면 가이드라인을 참고. [Recommended Docker Base Images](https://groundx.atlassian.net/wiki/spaces/PG/pages/809697425/Recommended+Docker+Base+Images).
기본적으로 build 하기 위한 이미지, run 하는 이미지를 분리하여 작성(예, [example-Dockerfile](https://github.com/ground-x/repo-template/blob/master/example-Dockerfile))

### Pre-Built CircleCI Docker Images
https://circleci.com/docs/2.0/circleci-images/#latest-image-tags-by-language
