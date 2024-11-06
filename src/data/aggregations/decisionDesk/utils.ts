import levenshtein from 'js-levenshtein'
import { deburr, toLower, trim } from 'lodash-es'

import { DTSI_Candidate } from '@/components/app/pageLocationKeyRaces/locationUnitedStatesLiveResults/types'
import {
  CandidatesWithVote,
  PresidentialDataWithVotingResponse,
} from '@/data/aggregations/decisionDesk/types'
import { getLogger } from '@/utils/shared/logger'

const HARD_CODED_LASTNAMES = ['boebert', 'banks', 'slotkin', 'kim', 'allred', 'curtis', 'gallego']

export const getPoliticianFindMatch = (
  dtsiPerson: DTSI_Candidate,
  ddhqCandidate: CandidatesWithVote | PresidentialDataWithVotingResponse['votingData'] | undefined,
) => {
  if (!ddhqCandidate) return false
  if (!dtsiPerson) return false
  const state =
    'state' in ddhqCandidate ? ddhqCandidate.state : dtsiPerson.primaryRole?.primaryState
  const logger = getLogger(`${state ?? ''} getPoliticianFindMatch`)

  logger.info('Comparing DTSI and DDHQ candidates:')
  logger.info(
    `DTSI: ${dtsiPerson.firstName} ${dtsiPerson.lastName} - ${dtsiPerson.primaryRole?.primaryDistrict ?? ''}`,
  )
  logger.info(
    `DDHQ: ${ddhqCandidate.firstName} ${ddhqCandidate.lastName} - ${'district' in ddhqCandidate ? (ddhqCandidate.district ?? '') : ''}`,
  )

  const decisionDeskDistrict = 'district' in ddhqCandidate ? ddhqCandidate.district : ''
  if (
    (dtsiPerson.primaryRole?.primaryDistrict?.toLowerCase() ?? '') !==
    decisionDeskDistrict.toLowerCase()
  ) {
    return false
  }

  const normalizedDTSIName = normalizeName(`${dtsiPerson.firstName} ${dtsiPerson.lastName}`)
  const normalizedDTSINickname = normalizeName(`${dtsiPerson.firstNickname} ${dtsiPerson.lastName}`)
  const normalizedDTSILastName = normalizeName(dtsiPerson.lastName)

  const normalizedDDHQName = normalizeName(`${ddhqCandidate.firstName} ${ddhqCandidate.lastName}`)
  const normalizedDDHQLastName = normalizeName(ddhqCandidate.lastName)
  logger.info(
    `Normalized all names: ${normalizedDTSIName} ${normalizedDTSINickname} ${normalizedDTSILastName} ${normalizedDDHQName} ${normalizedDDHQLastName}`,
  )

  const decisionDeskCandidateDistrict =
    'district' in ddhqCandidate ? (ddhqCandidate.district ?? '') : ''
  if (
    !HARD_CODED_LASTNAMES.includes(normalizedDTSILastName) &&
    toLower(dtsiPerson.primaryRole?.primaryDistrict ?? '') !==
      toLower(decisionDeskCandidateDistrict)
  ) {
    return false
  }
  logger.info(
    `Districts match: ${dtsiPerson.primaryRole?.primaryDistrict ?? ''} ${decisionDeskCandidateDistrict}`,
  )
  // Allow up to 2 edits for names, e.g. Sapriacone vs Sapraicone, with a threshold of 2
  const nameThreshold = 2

  const hasPassedWithName = levenshtein(normalizedDTSIName, normalizedDDHQName) <= nameThreshold
  const hasPassedWithNickname =
    levenshtein(normalizedDTSINickname, normalizedDDHQName) <= nameThreshold
  const hasPassedWithLastName =
    levenshtein(normalizedDTSILastName, normalizedDDHQLastName) <= nameThreshold

  const hasPassedWithLastNameParts = compareLastNamePartsWithLevenshtein(dtsiPerson, ddhqCandidate)

  let isMatch =
    hasPassedWithName ||
    hasPassedWithNickname ||
    hasPassedWithLastName ||
    hasPassedWithLastNameParts

  logger.info(`isMatch: ${String(isMatch)}`)
  if ('state' in ddhqCandidate) {
    logger.info(`ddhqCandidate state: ${ddhqCandidate.state ?? ''}`)
    isMatch =
      isMatch && toLower(dtsiPerson.primaryRole?.primaryState) === toLower(ddhqCandidate.state)
  }

  return isMatch
}

export const normalizeName = (name: string) => {
  return deburr(toLower(trim(name))).replace(/[.-\s]/g, '')
}

function compareLastNamePartsWithLevenshtein(
  dtsiPerson: DTSI_Candidate,
  ddhqCandidate: CandidatesWithVote | PresidentialDataWithVotingResponse['votingData'],
) {
  const dtsiFirstName = dtsiPerson.firstName
  const dtsiLastName = dtsiPerson.lastName

  const ddhqFirstName = ddhqCandidate!.firstName
  const ddhqLastName = ddhqCandidate!.lastName

  const dtsiLastNameParts = dtsiLastName.split(' ').map(part => normalizeName(part))
  const ddhqLastNameParts = ddhqLastName.split(' ').map(part => normalizeName(part))

  const levenshteinThreshold = 2

  const hasPassedFirstName = levenshtein(dtsiFirstName, ddhqFirstName) <= levenshteinThreshold
  const hasPassedLastName = dtsiLastNameParts.some(dtsiPart =>
    ddhqLastNameParts.some(ddhqPart => levenshtein(dtsiPart, ddhqPart) <= levenshteinThreshold),
  )

  return hasPassedFirstName && hasPassedLastName
}
