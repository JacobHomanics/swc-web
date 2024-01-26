'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import useSWR from 'swr'

import type { UserActionFormCallCongresspersonProps } from '@/components/app/userActionFormCallCongressperson'
import { UserActionFormCallCongresspersonLayout } from '@/components/app/userActionFormCallCongressperson/tabs/layout'
import { TabNames } from '@/components/app/userActionFormCallCongressperson/userActionFormCallCongressperson.types'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormErrorMessage,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { GooglePlacesSelect } from '@/components/ui/googlePlacesSelect'
import { InternalLink } from '@/components/ui/link'
import {
  formatGetDTSIPeopleFromAddressNotFoundReason,
  getDTSIPeopleFromAddress,
} from '@/hooks/useGetDTSIPeopleFromAddress'
import { useIntlUrls } from '@/hooks/useIntlUrls'
import { getGoogleCivicDataFromAddress } from '@/utils/shared/googleCivicInfo'
import { trackFormSubmissionSyncErrors } from '@/utils/web/formUtils'
import { convertGooglePlaceAutoPredictionToAddressSchema } from '@/utils/web/googlePlaceUtils'

import {
  FORM_NAME,
  findRepresentativeCallFormValidationSchema,
  getDefaultValues,
  type FindRepresentativeCallFormValues,
} from './formConfig'

interface AddressProps
  extends Pick<UserActionFormCallCongresspersonProps, 'user' | 'onFindCongressperson' | 'gotoTab'> {
  congressPersonData?: UserActionFormCallCongresspersonProps['congressPersonData']
}

export function Address({ user, onFindCongressperson, congressPersonData, gotoTab }: AddressProps) {
  const urls = useIntlUrls()

  const form = useForm<FindRepresentativeCallFormValues>({
    defaultValues: getDefaultValues({ user }),
    resolver: zodResolver(findRepresentativeCallFormValidationSchema),
  })
  const address = useWatch({
    control: form.control,
    name: 'address',
  })
  const { data: liveCongressPersonData, isLoading: isLoadingLiveCongressPersonData } =
    useCongresspersonData({ address })

  React.useEffect(() => {
    if (!liveCongressPersonData) {
      return
    }

    const { dtsiPerson } = liveCongressPersonData
    if (!dtsiPerson || 'notFoundReason' in dtsiPerson) {
      form.setError('address', {
        type: 'manual',
        message: formatGetDTSIPeopleFromAddressNotFoundReason(dtsiPerson),
      })
      return
    }

    onFindCongressperson({ ...liveCongressPersonData, dtsiPerson })
  }, [liveCongressPersonData, onFindCongressperson, form])

  return (
    <UserActionFormCallCongresspersonLayout onBack={() => gotoTab(TabNames.INTRO)}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(
            () => gotoTab(TabNames.SUGGESTED_SCRIPT),
            trackFormSubmissionSyncErrors(FORM_NAME),
          )}
        >
          <UserActionFormCallCongresspersonLayout.Container>
            <UserActionFormCallCongresspersonLayout.Heading
              title="Find your representative"
              subtitle="Your address will be used to connect you with your representative. Stand With Crypto will never share your data with any third-parties."
            />

            <div className="pb-64">
              <FormField
                control={form.control}
                name="address"
                render={({ field: { ref: _ref, ...field } }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <GooglePlacesSelect
                        {...field}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Your full address"
                      />
                    </FormControl>
                    <FormErrorMessage />
                  </FormItem>
                )}
              />
            </div>

            <UserActionFormCallCongresspersonLayout.Footer>
              <SubmitButton
                isLoading={form.formState.isSubmitting || isLoadingLiveCongressPersonData}
                disabled={!congressPersonData}
              />

              <p className="text-sm">
                Learn more about our{' '}
                <InternalLink href={urls.privacyPolicy()} className="underline">
                  privacy policy
                </InternalLink>
              </p>
            </UserActionFormCallCongresspersonLayout.Footer>
          </UserActionFormCallCongresspersonLayout.Container>
        </form>
      </Form>
    </UserActionFormCallCongresspersonLayout>
  )
}

function SubmitButton({ isLoading, disabled }: { isLoading: boolean; disabled: boolean }) {
  return (
    <Button type="submit" disabled={isLoading || disabled}>
      {isLoading ? 'Loading...' : 'Continue'}
    </Button>
  )
}

function useCongresspersonData({ address }: FindRepresentativeCallFormValues) {
  return useSWR(address ? `useCongresspersonData-${address.description}` : null, async () => {
    const dtsiPerson = await getDTSIPeopleFromAddress(address.description)
    const civicData = await getGoogleCivicDataFromAddress(address.description)
    const addressSchema = await convertGooglePlaceAutoPredictionToAddressSchema(address)

    return { dtsiPerson, civicData, addressSchema }
  })
}
