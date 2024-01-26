'use server'
import { appRouterGetAuthUser } from '@/utils/server/thirdweb/appRouterGetAuthUser'
import { prismaClient } from '@/utils/server/prismaClient'
import { parseLocalUserFromCookies } from '@/utils/server/serverLocalUser'
import { getServerPeopleAnalytics } from '@/utils/server/serverAnalytics'
import { convertAddressToAnalyticsProperties } from '@/utils/shared/sharedAnalytics'
import { zodUpdateUserProfileFormAction } from '@/validation/forms/zodUpdateUserProfile'
import { UserEmailAddressSource } from '@prisma/client'
import 'server-only'
import { z } from 'zod'
import { getClientUser } from '@/clientModels/clientUser/clientUser'
import { userFullName } from '@/utils/shared/userFullName'

export async function actionUpdateUserProfile(
  data: z.infer<typeof zodUpdateUserProfileFormAction>,
) {
  const authUser = await appRouterGetAuthUser()
  if (!authUser) {
    throw new Error('Unauthenticated')
  }
  const validatedFields = zodUpdateUserProfileFormAction.safeParse(data)
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }
  const user = await prismaClient.user.findFirstOrThrow({
    where: {
      id: authUser.userId,
    },
    include: {
      userEmailAddresses: true,
    },
  })
  const existingUserEmailAddress = validatedFields.data.emailAddress
    ? user.userEmailAddresses.find(
        ({ emailAddress }) => emailAddress === validatedFields.data.emailAddress,
      )
    : null
  const primaryUserEmailAddress =
    validatedFields.data.emailAddress && !existingUserEmailAddress
      ? await prismaClient.userEmailAddress.create({
          data: {
            emailAddress: validatedFields.data.emailAddress,
            source: UserEmailAddressSource.USER_ENTERED,
            isVerified: false,
            user: {
              connect: {
                id: user.id,
              },
            },
          },
        })
      : existingUserEmailAddress
  const address = validatedFields.data.address
    ? await prismaClient.address.upsert({
        where: {
          googlePlaceId: validatedFields.data.address.googlePlaceId,
        },
        create: {
          ...validatedFields.data.address,
        },
        update: {},
      })
    : null
  const localUser = parseLocalUserFromCookies()
  const peopleAnalytics = getServerPeopleAnalytics({ userId: authUser.userId, localUser })
  peopleAnalytics.set({
    ...(validatedFields.data.address
      ? convertAddressToAnalyticsProperties(validatedFields.data.address)
      : {}),
    // https://docs.mixpanel.com/docs/data-structure/user-profiles#reserved-user-properties
    $email: validatedFields.data.emailAddress,
    $phone: validatedFields.data.phoneNumber,
    $name: userFullName(validatedFields.data),
  })

  const updatedUser = await prismaClient.user.update({
    where: {
      id: user.id,
    },
    data: {
      firstName: validatedFields.data.firstName,
      lastName: validatedFields.data.lastName,
      phoneNumber: validatedFields.data.phoneNumber,
      informationVisibility: validatedFields.data.informationVisibility,
      addressId: address?.id || null,
      primaryUserEmailAddressId: primaryUserEmailAddress?.id || null,
    },
    include: {
      primaryUserCryptoAddress: true,
    },
  })

  return {
    user: getClientUser(updatedUser),
  }
}
