import { POSITIVE_CHOICES } from './const'
import { ProposalState, ProposalStatus, RawProposal } from './types'

export function getLowerCaseChoice(choice: string) {
  return choice.toLocaleLowerCase().trim()
}

export function getLowerCaseChoices(choices: RawProposal['choices']) {
  return choices.map((choice) => getLowerCaseChoice(choice))
}

export function getProposalStatus({
  state,
  choices,
  scores,
}: Pick<RawProposal, 'state' | 'choices' | 'scores'>): ProposalStatus {
  let status: ProposalStatus | null = null
  if (state === ProposalState.Active) status = ProposalStatus.Active
  else {
    const positiveChoices = getLowerCaseChoices(POSITIVE_CHOICES)
    const proposalChoicesInLowerCase = getLowerCaseChoices(choices)
    const hasPositiveChoice = positiveChoices.some((positiveChoice) =>
      proposalChoicesInLowerCase.includes(positiveChoice),
    )
    if (hasPositiveChoice) {
      const maxScore = Math.max(...scores)
      const resultChoice = proposalChoicesInLowerCase[scores.indexOf(maxScore)]
      if (positiveChoices.includes(resultChoice)) status = ProposalStatus.Executed
      else status = ProposalStatus.Defeated
    } else status = ProposalStatus.Finished
  }
  return status
}

export function formatAmount(score: number) {
  const scoreToFixed = (div: number) => Number((score / div).toFixed(1))
  const billion = 1_000_000_000
  const million = 1_000_000
  const thousand = 1_000
  if (score >= billion) return `${scoreToFixed(billion)}B`
  else if (score >= million) return `${scoreToFixed(million)}M`
  else if (score >= thousand) return `${scoreToFixed(thousand)}K`
  else return `${scoreToFixed(1)}`
}
