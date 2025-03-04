'use server'
import 'server-only'

import * as Sentry from '@sentry/nextjs'
import { waitUntil } from 'node_modules/@vercel/functions/wait-until'
import { z } from 'zod'

import { appRouterGetAuthUser } from '@/utils/server/authentication/appRouterGetAuthUser'
import { prismaClient } from '@/utils/server/prismaClient'
import { throwIfRateLimited } from '@/utils/server/ratelimit/throwIfRateLimited'
import { getServerPeopleAnalytics } from '@/utils/server/serverAnalytics/serverPeopleAnalytics'
import { parseLocalUserFromCookies } from '@/utils/server/serverLocalUser'
import { getUserSessionId } from '@/utils/server/serverUserSessionId'
import { withServerActionMiddleware } from '@/utils/server/serverWrappers/withServerActionMiddleware'
import { getLogger } from '@/utils/shared/logger'
import { convertAddressToAnalyticsProperties } from '@/utils/shared/sharedAnalytics'
import { zodSupportedCountryCode } from '@/validation/fields/zodSupportedCountryCode'

export const actionUpdateUserCountryCode = withServerActionMiddleware(
  'actionUpdateUserCountryCode',
  actionUpdateUserCountryCodeWithoutMiddleware,
)

const logger = getLogger(`actionUpdateUserCountryCode`)

export async function actionUpdateUserCountryCodeWithoutMiddleware(
  countryCode: z.infer<typeof zodSupportedCountryCode>,
) {
  const sessionId = await getUserSessionId()
  const authUser = await appRouterGetAuthUser()

  if (!authUser) {
    const error = new Error("User's Country Code update failed - Not authenticated")

    logger.error(error.message)

    Sentry.captureException(error, {
      tags: { domain: 'actionUpdateUserCountryCode' },
      extra: {
        sessionId,
      },
    })

    return {
      errors: {
        countryCode: [error.message],
      },
    }
  }

  const validatedFields = zodSupportedCountryCode.safeParse(countryCode)
  if (!validatedFields.success) {
    const error = new Error("User's Country Code update failed - Country code is not supported")

    logger.error(error.message)

    Sentry.captureException(error, {
      tags: { domain: 'actionUpdateUserCountryCode' },
      extra: {
        sessionId,
        countryCode,
      },
    })

    return {
      errors: {
        countryCode: [error.message],
      },
    }
  }

  await throwIfRateLimited({ context: 'authenticated' })

  const user = await prismaClient.user.findFirstOrThrow({
    where: {
      id: authUser.userId,
    },
    select: {
      countryCode: true,
      address: true,
    },
  })

  if (user.countryCode === validatedFields.data) {
    logger.info("User's Country Code update skipped - Country code is the same.")

    return {
      errors: {
        countryCode: ["User's Country Code update skipped - Country code is the same."],
      },
    }
  }

  await prismaClient.user.update({
    where: {
      id: authUser.userId,
    },
    data: {
      countryCode: validatedFields.data,
    },
  })

  const localUser = await parseLocalUserFromCookies()

  waitUntil(
    getServerPeopleAnalytics({
      userId: authUser.userId,
      localUser,
    })
      .set({
        ...(user?.address ? convertAddressToAnalyticsProperties(user.address) : {}),
        'Address Country Code Is': user.address?.countryCode,
        'User Country Code Was': user.countryCode,
      })
      .flush(),
  )

  logger.info("User's Country Code updated")

  return {
    countryCode: validatedFields.data,
  }
}
