import 'server-only'

import pRetry from 'p-retry'

import { API_ENDPOINT } from '@/data/decisionDesk/constants'
import { GetRacesParams, GetRacesParamsSchema } from '@/data/decisionDesk/schemas'
import { GetBearerTokenResponse, GetRacesResponse } from '@/data/decisionDesk/types'
import { redis } from '@/utils/server/redis'
import { fetchReq } from '@/utils/shared/fetchReq'
import { getLogger } from '@/utils/shared/logger'
import { requiredEnv } from '@/utils/shared/requiredEnv'

const DECISION_DESK_CLIENT_ID = requiredEnv(
  process.env.DECISION_DESK_CLIENT_ID,
  'DECISION_DESK_CLIENT_ID',
)
const DECISION_DESK_SECRET = requiredEnv(process.env.DECISION_DESK_SECRET, 'DECISION_DESK_SECRET')

const logger = getLogger('decisionDesk services')

export async function fetchBearerToken() {
  logger.debug('fetchBearerToken called')

  if (!DECISION_DESK_CLIENT_ID || !DECISION_DESK_SECRET) {
    throw new Error('DECISION_DESK_CLIENT_ID or DECISION_DESK_SECRET not set')
  }

  const response = await pRetry(
    attemptCount =>
      fetchReq(
        `${API_ENDPOINT}/oauth/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'client_credentials',
            client_id: DECISION_DESK_CLIENT_ID,
            client_secret: DECISION_DESK_SECRET,
          }),
        },
        {
          withScope: scope => {
            const name = `fetchBearerToken attempt #${attemptCount}`
            scope.setFingerprint([name])
            scope.setTags({ domain: 'fetchBearerToken' })
            scope.setTag('attemptCount', attemptCount)
            scope.setTransactionName(name)
          },
        },
      ),
    {
      retries: 1,
      minTimeout: 4000,
    },
  )

  logger.debug(`fetchBearerToken returned with status ${response.status}`)

  const json = (await response.json()) as GetBearerTokenResponse | { errors: any[] }

  if ('errors' in json) {
    throw new Error(`fetchBearerToken threw with ${JSON.stringify(json.errors)}`)
  }

  return json
}

export async function fetchRacesData(params?: GetRacesParams) {
  logger.debug('fetchRacesData called')

  const endpointURL = new URL(`${API_ENDPOINT}/races`)

  if (params) {
    logger.debug('fetchRacesData received params', params)

    const validationResult = GetRacesParamsSchema.safeParse(params)

    if (!validationResult.success) {
      throw new Error(
        `fetchRacesData received invalid params ${JSON.stringify(validationResult.error)}`,
      )
    }

    const URLParams = new URLSearchParams(
      Object.entries(params).reduce(
        (acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = value
          }
          return acc
        },
        {} as Record<string, any>,
      ),
    )

    endpointURL.search = URLParams.toString()
  }

  const bearerToken = await getBearerToken()

  if (!bearerToken) {
    throw new Error('Bearer key not found')
  }

  console.log('endpointURL', endpointURL)

  const response = await pRetry(
    attemptCount =>
      fetchReq(
        endpointURL.href,
        {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        },
        {
          withScope: scope => {
            const name = `fetchRacesData attempt #${attemptCount}`
            scope.setFingerprint([name])
            scope.setTags({ domain: 'fetchRacesData' })
            scope.setTag('attemptCount', attemptCount)
            scope.setTransactionName(name)
          },
        },
      ),
    {
      retries: 1,
      minTimeout: 4000,
    },
  )

  logger.debug(`fetchRacesData returned with status ${response.status}`)

  const json = (await response.json()) as { data: GetRacesResponse } | { errors: any[] }

  if ('errors' in json) {
    throw new Error(`fetchRacesData threw with ${JSON.stringify(json.errors)}`)
  }

  return json.data
}

export async function getBearerToken() {
  logger.debug('getBearerToken called')

  const hasCachedBearerToken = await redis.get<GetBearerTokenResponse>('decisionDeskBearerToken')

  if (hasCachedBearerToken) {
    logger.debug('getBearerToken found cached token')
    return hasCachedBearerToken.access_token
  }

  logger.debug('getBearerToken did not find cached token')

  const bearerToken = await fetchBearerToken()

  await redis.set('decisionDeskBearerToken', bearerToken, {
    ex: bearerToken.expires_in,
  })

  logger.debug('getBearerToken set new token in cache')

  return bearerToken.access_token
}
