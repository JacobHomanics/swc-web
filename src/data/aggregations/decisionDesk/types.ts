import { DTSI_UnitedStatesPresidentialQuery } from '@/data/dtsi/generated'
import { ELECTION_TYPES, OFFICES } from '@/utils/server/decisionDesk/constants'

export interface RacesVotingDataResponse {
  state: string
  stateName: string
  district: string
  office: (typeof OFFICES)[0] | null
  electionType: (typeof ELECTION_TYPES)[0] | null
  year: number
  party: string | null
  totalVotes: number
  candidatesWithVotes: CandidatesWithVote[]
}

export interface CongressDataResponse {
  office: (typeof OFFICES)[0] | null
  year: number
  candidatesWithVotes: CandidatesWithVote[]
}

export interface CandidatesWithVote {
  id: number
  firstName: string
  lastName: string
  party: string
  votes: number
}

interface VotingData {
  id: number
  firstName: string
  lastName: string
  votes: number
  percentage: number
  electoralVotes: number
  partyName: string
}

export type PresidentialDataWithVotingResponse = DTSI_UnitedStatesPresidentialQuery['people'][0] & {
  votingData?: VotingData
}

export interface GetAllCongressDataProps {
  houseData: RacesVotingDataResponse[]
  senateData: RacesVotingDataResponse[]
}

export interface GetAllCongressDataResponse {
  senateDataWithDtsi: CongressDataResponse & {
    votingData?: VotingData
  }
  houseDataWithDtsi: CongressDataResponse & {
    votingData?: VotingData
  }
}
