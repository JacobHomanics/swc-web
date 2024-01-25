import { SumDonationsByUserRow } from '@/components/app/sumDonationsByUserRow/sumDonationsByUserRow'
import { RecentActivityRow } from '@/components/app/recentActivityRow/recentActivityRow'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SumDonationsByUser } from '@/data/aggregations/getSumDonationsByUser'
import { getPublicRecentActivity } from '@/data/recentActivity/getPublicRecentActivity'
import { SupportedLocale } from '@/intl/locales'
import { RecentActivityAndLeaderboardTabs } from './recentActivityAndLeaderboardTabs'
import { ExternalLink } from '@/components/ui/link'

export function RecentActivityAndLeaderboard({
  locale,
  actions,
  sumDonationsByUser,
  offset = 0,
  defaultValue = RecentActivityAndLeaderboardTabs.RECENT_ACTIVITY,
}: {
  locale: SupportedLocale
  actions: Awaited<ReturnType<typeof getPublicRecentActivity>>
  sumDonationsByUser: SumDonationsByUser
  offset?: number
  defaultValue?: RecentActivityAndLeaderboardTabs
}) {
  return (
    <Tabs defaultValue={defaultValue} className="mx-auto w-full max-w-2xl">
      <div className="text-center">
        <TabsList className="mx-auto">
          <TabsTrigger value={RecentActivityAndLeaderboardTabs.RECENT_ACTIVITY}>
            Recent activity
          </TabsTrigger>
          <TabsTrigger value={RecentActivityAndLeaderboardTabs.LEADERBOARD}>
            Top donations
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value={RecentActivityAndLeaderboardTabs.RECENT_ACTIVITY} className="space-y-7">
        <div className="mt-2 h-7" />
        {actions.map(action => (
          <RecentActivityRow locale={locale} action={action} key={action.id} />
        ))}
      </TabsContent>
      <TabsContent value={RecentActivityAndLeaderboardTabs.LEADERBOARD} className="space-y-7">
        <p className="mt-2 h-7 text-center text-xs text-gray-500">
          Donations to{' '}
          <ExternalLink
            href={'https://www.axios.com/2023/12/18/crypto-super-pac-fairshake-2024-elections'}
          >
            Fairshake
          </ExternalLink>
          , a pro-crypto Super PAC, are not included on the leaderboard.
        </p>
        {sumDonationsByUser.map((donor, index) => (
          <SumDonationsByUserRow
            key={index}
            index={offset + index}
            sumDonations={donor}
            locale={locale}
          />
        ))}
      </TabsContent>
    </Tabs>
  )
}
