import 'server-only'

import { getCountPolicymakerContacts } from '@/data/aggregations/getCountPolicymakerContacts'
import { getCountUsers } from '@/data/aggregations/getCountUsers'
import { getSumDonations } from '@/data/aggregations/getSumDonations'
import { getSumDonationsByUser } from '@/data/aggregations/getSumDonationsByUser'
import { queryDTSIHomepagePeople } from '@/data/dtsi/queries/queryDTSIHomepagePeople'
import { getPublicRecentActivity } from '@/data/recentActivity/getPublicRecentActivity'

interface GetHomePageTopLevelMetricsProps {
  countryCode: string
}

export async function getHomepageTopLevelMetrics({ countryCode }: GetHomePageTopLevelMetricsProps) {
  const [sumDonations, countUsers, countPolicymakerContacts] = await Promise.all([
    getSumDonations({ countryCode }),
    getCountUsers({ countryCode }),
    getCountPolicymakerContacts({ countryCode }),
  ])
  return {
    sumDonations,
    countUsers,
    countPolicymakerContacts,
  }
}
export type GetHomepageTopLevelMetricsResponse = Awaited<
  ReturnType<typeof getHomepageTopLevelMetrics>
>

interface GetHomePageDataProps {
  recentActivityLimit?: number
  restrictToUS?: boolean
  countryCode: string
}

export async function getHomepageData(props: GetHomePageDataProps) {
  const [
    { sumDonations, countUsers, countPolicymakerContacts },
    actions,
    dtsiHomepagePeople,
    sumDonationsByUser,
  ] = await Promise.all([
    getHomepageTopLevelMetrics({ countryCode: props.countryCode }),
    getPublicRecentActivity({
      limit: props?.recentActivityLimit ?? 10,
      countryCode: props.countryCode,
    }),
    queryDTSIHomepagePeople(),
    getSumDonationsByUser({ limit: 10, pageNum: 1 }),
  ])
  return {
    sumDonations,
    countUsers,
    countPolicymakerContacts,
    actions,
    sumDonationsByUser,
    dtsiHomepagePeople,
  }
}
