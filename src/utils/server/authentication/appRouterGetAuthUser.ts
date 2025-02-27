import 'server-only'

import { getAuthUser } from '@/utils/server/authentication/getAuthUser'
import { getThirdwebAuthUser } from '@/utils/server/thirdweb/getThirdwebAuthUser'

export async function appRouterGetAuthUser() {
  const thirdwebAuthData = await getThirdwebAuthUser()

  if (thirdwebAuthData) {
    return thirdwebAuthData
  }

  return getAuthUser()
}
