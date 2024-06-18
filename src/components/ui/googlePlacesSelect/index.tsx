import React, { useEffect } from 'react'
import { MapPin } from 'lucide-react'
import usePlacesAutocomplete from 'use-places-autocomplete'

import { Combobox } from '@/components/ui/combobox'
import { InputWithIcons } from '@/components/ui/inputWithIcons'
import { Spinner } from '@/components/ui/spinner'
import { useGoogleMapsScript } from '@/hooks/useGoogleMapsScript'
import { cn } from '@/utils/web/cn'
import { GooglePlaceAutocompletePrediction } from '@/utils/web/googlePlaceUtils'

export type GooglePlacesSelectProps = {
  value: GooglePlaceAutocompletePrediction | null
  onChange: (val: GooglePlaceAutocompletePrediction | null) => void
  showIcon?: boolean
  loading?: boolean
  disablePreventMobileKeyboardOffset?: boolean
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>

export const GooglePlacesSelect = React.forwardRef<
  React.ElementRef<'input'>,
  GooglePlacesSelectProps
>((props, ref) => {
  const {
    value: propsValue,
    onChange: propsOnChange,
    className,
    showIcon = true,
    loading,
    disablePreventMobileKeyboardOffset,
    ...inputProps
  } = props
  const [open, setOpen] = React.useState(false)
  const {
    ready,
    value,
    suggestions: { data },
    setValue,
    init,
  } = usePlacesAutocomplete({
    requestOptions: {
      locationBias: 'IP_BIAS',
      language: 'en',
      types: ['street_address', 'premise', 'postal_code', 'subpremise', 'route'],
    },
  })
  const scriptStatus = useGoogleMapsScript()

  useEffect(() => {
    if (scriptStatus === 'ready') {
      init()
    }
  }, [init, scriptStatus])

  return (
    <Combobox
      analytics={'Google Place Select'}
      disablePreventMobileKeyboardOffset={disablePreventMobileKeyboardOffset}
      formatPopoverTrigger={triggerProps => (
        <InputWithIcons
          className={cn(
            'text-muted-foreground',
            triggerProps.value && 'text-gray-500',
            'h-auto cursor-pointer whitespace-normal text-left',
            triggerProps.open && 'outline-none ring-2 ring-ring ring-offset-2',
            className,
          )}
          leftIcon={showIcon ? <MapPin className="h-4 w-4 text-gray-500" /> : undefined}
          placeholder="select a location"
          ref={ref}
          rightIcon={loading ? <Spinner /> : undefined}
          value={triggerProps.value?.description || inputProps.placeholder || 'select a location'}
          {...inputProps}
          readOnly
        />
      )}
      getOptionKey={val => val.place_id}
      getOptionLabel={val => val.description}
      inputValue={value}
      isLoading={!ready}
      onChange={propsOnChange}
      onChangeInputValue={setValue}
      open={open}
      options={data}
      placeholder="Type your address..."
      setOpen={setOpen}
      value={propsValue}
    />
  )
})
GooglePlacesSelect.displayName = 'GooglePlacesSelect'
