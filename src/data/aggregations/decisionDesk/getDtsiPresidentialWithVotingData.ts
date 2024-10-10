import * as Sentry from '@sentry/node'

import { PresidentialDataWithVotingResponse } from '@/data/aggregations/decisionDesk/types'
import { getPoliticianFindMatch, normalizeName } from '@/data/aggregations/decisionDesk/utils'
import { queryDTSILocationUnitedStatesPresidential } from '@/data/dtsi/queries/queryDTSILocationUnitedStatesPresidentialInformation'
import { fetchElectoralCollege } from '@/utils/server/decisionDesk/services'

async function getPresidentialData(year = '2024') {
  const { candidates } = await fetchElectoralCollege(year)

  if (!candidates) {
    return []
  }

  return candidates.map(currentCandidate => {
    return {
      id: currentCandidate.cand_id,
      firstName: currentCandidate.first_name,
      lastName: currentCandidate.last_name,
      votes: currentCandidate.votes,
      percentage: currentCandidate.percentage,
      electoralVotes: currentCandidate.electoral_votes_total,
      partyName: currentCandidate.party_name,
      called: currentCandidate.called,
    }
  })
}

export async function getDtsiPresidentialWithVotingData(
  year = '2024',
): Promise<PresidentialDataWithVotingResponse[]> {
  const presidentialData = await getPresidentialData(year)
  const dtsiData = await queryDTSILocationUnitedStatesPresidential()

  const presidentialVoteData = dtsiData.people.map(currentPolitician => {
    const votingData = presidentialData.find(currentVotingData => {
      const [currentPoliticianFirstName] = currentPolitician.firstName.split(' ')
      const [currentPoliticianLastName] = currentPolitician.lastName.split(' ')

      const normalizedPoliticianFirstName = normalizeName(currentPoliticianFirstName)
      const normalizedPoliticianLastName = normalizeName(currentPoliticianLastName)
      const normalizedVotingDataFirstName = normalizeName(currentVotingData.firstName)
      const normalizedVotingDataLastName = normalizeName(currentVotingData.lastName)

      return getPoliticianFindMatch({
        dtsiPerson: {
          politicianFirstName: normalizedPoliticianFirstName,
          politicianLastName: normalizedPoliticianLastName,
        },
        decisionDeskPerson: {
          votingDataFirstName: normalizedVotingDataFirstName,
          votingDataLastName: normalizedVotingDataLastName,
        },
      })
    })

    return {
      ...currentPolitician,
      votingData,
    }
  })

  const notFoundVotingData = presidentialVoteData.filter(
    currentVoteData => !currentVoteData.votingData,
  )

  if (notFoundVotingData.length > 0) {
    const candidateNames = notFoundVotingData.map(
      currentCandidate => `${currentCandidate.firstName} ${currentCandidate.lastName}`,
    )

    Sentry.captureMessage('No match for candidates between decisionDesk and DTSI.', {
      extra: {
        domain: 'aggregations/decisionDesk/getDtsiPresidentialWithVotingData',
        candidateNames,
      },
    })
  }

  return presidentialVoteData
}
