import { notFound } from 'next/navigation'

import { PageHome } from '@/components/app/pageHome'
import { getAdvocatesMapData } from '@/data/pageSpecific/getAdvocatesMapData'
import { getHomepageData } from '@/data/pageSpecific/getHomepageData'
import { PageProps } from '@/types'
import { getPartners } from '@/utils/server/builder/models/data/partners'
import { ORDERED_SUPPORTED_COUNTRIES } from '@/utils/shared/supportedCountries'

export const revalidate = 60 // 1 minute
export const dynamic = 'error'

export default async function Home(props: PageProps) {
  const params = await props.params
  const asyncProps = await getHomepageData({
    recentActivityLimit: 30,
    restrictToUS: true,
  })
  const advocatePerStateDataProps = await getAdvocatesMapData()
  const partners = await getPartners()

  /*
  the country code check in layout works for most cases, but for some reason if we hit
  a path that includes a "." like /requestProvider.js.map nextjs will try to render the page with that as the locality
  Adding this check here fixes that issue
  */
  if (!ORDERED_SUPPORTED_COUNTRIES.includes(params.countryCode)) {
    notFound()
  }

  return (
    <PageHome
      advocatePerStateDataProps={advocatePerStateDataProps}
      params={params}
      partners={partners}
      {...asyncProps}
    />
  )
}
