import { UserActionType } from '@prisma/client'

import { HomepageDialogDeeplinkLayout } from '@/components/app/homepageDialogDeeplinkLayout'
import { UserActionFormEmailDebateDeeplinkWrapper } from '@/components/app/userActionFormEmailDebate/homepageDialogDeeplinkWrapper'
import { PageProps } from '@/types'
import { SECONDS_DURATION } from '@/utils/shared/seconds'
import { UserActionEmailCampaignName } from '@/utils/shared/userActionCampaigns'
import { ErrorBoundary } from '@/utils/web/errorBoundary'

export const revalidate = SECONDS_DURATION.HOUR
export const dynamic = 'error'

export default function UserActionEmailDebateDeepLink({ params }: PageProps) {
  return (
    <ErrorBoundary
      extras={{
        action: {
          isDeeplink: true,
          actionType: UserActionType.EMAIL,
          campaignName: UserActionEmailCampaignName.ABC_PRESIDENTIAL_DEBATE_2024,
        },
      }}
      severityLevel="error"
      tags={{
        domain: 'UserActionEmailDebateDeepLink',
      }}
    >
      <HomepageDialogDeeplinkLayout pageParams={params}>
        <UserActionFormEmailDebateDeeplinkWrapper />
      </HomepageDialogDeeplinkLayout>
    </ErrorBoundary>
  )
}
