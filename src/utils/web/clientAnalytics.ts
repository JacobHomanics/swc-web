import mixpanel, { Callback, RequestOptions } from 'mixpanel-browser'

import { isCypress, isStorybook } from '@/utils/shared/executionEnvironment'
import { mapPersistedLocalUserToExperimentAnalyticsProperties } from '@/utils/shared/localUser'
import { customLogger } from '@/utils/shared/logger'
import { requiredEnv } from '@/utils/shared/requiredEnv'
import { AnalyticProperties } from '@/utils/shared/sharedAnalytics'
import { getClientCookieConsent } from '@/utils/web/clientCookieConsent'
import { getLocalUser } from '@/utils/web/clientLocalUser'

const NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN = requiredEnv(
  process.env.NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN,
  'NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN',
)!

const environmentHasAnalyticsEnabled =
  !isStorybook && !isCypress && !!NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN

const hasTargetingEnabled = getClientCookieConsent().targeting

let init = false
export function maybeInitClientAnalytics() {
  if (!init) {
    mixpanel.init(NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN, {
      track_pageview: false,
      persistence: 'localStorage',
    })
    init = true
  }
}
export function identifyClientAnalyticsUser(userId: string) {
  if (environmentHasAnalyticsEnabled && hasTargetingEnabled) {
    maybeInitClientAnalytics()
    mixpanel.identify(userId)
  }
}

let experimentProperties: AnalyticProperties | null = null
function getExperimentProperties() {
  if (experimentProperties) {
    return experimentProperties
  }
  experimentProperties = mapPersistedLocalUserToExperimentAnalyticsProperties(
    getLocalUser().persisted,
  )
  return experimentProperties
}

export function trackClientAnalytic(
  eventName: string,
  _eventProperties?: AnalyticProperties,
  optionsOrCallback?: RequestOptions | Callback,
) {
  const eventProperties = { ...getExperimentProperties(), ..._eventProperties }
  customLogger(
    {
      category: 'analytics',
      formattedMessage: `%canalytics - %c ${eventName}`,
      originalMessage: eventName,
    },
    ['color: #00aaff', 'color: #FCFDFB'],
    eventProperties,
  )

  maybeInitClientAnalytics()

  if (environmentHasAnalyticsEnabled && hasTargetingEnabled) {
    mixpanel.track(eventName, eventProperties, optionsOrCallback)
  }
}

export function trackFormSubmitted(formName: string, other?: AnalyticProperties) {
  trackClientAnalytic('Form Submitted', { 'Form Name': formName, ...other })
}

export function trackFormSubmitSucceeded(formName: string, other?: AnalyticProperties) {
  trackClientAnalytic('Form Submit Succeeded', { 'Form Name': formName, ...other })
}

export function trackFormSubmitErrored(formName: string, other?: AnalyticProperties) {
  trackClientAnalytic('Form Submit Errored', { 'Form Name': formName, ...other })
}

export function trackExternalLink(eventProperties?: AnalyticProperties) {
  trackClientAnalytic('External Link clicked', { ...eventProperties })
}

export function trackSectionVisible(
  { section, sectionGroup }: { section: string; sectionGroup: string },
  eventProperties?: AnalyticProperties,
) {
  trackClientAnalytic(`New Section Visible`, {
    Section: section,
    'Section Group': sectionGroup,
    ...eventProperties,
  })
}
