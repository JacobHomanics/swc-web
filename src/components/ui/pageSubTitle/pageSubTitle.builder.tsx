import { Builder, withChildren } from '@builder.io/react'
import { VariantProps } from 'class-variance-authority'

import { AsVariantsConfig, PageSubTitle, pageSubTitleVariants } from '@/components/ui/pageSubTitle'
import type { BuilderComponentBaseProps } from '@/utils/web/builder'

type BuilderPageSubtitleProps = BuilderComponentBaseProps &
  VariantProps<typeof pageSubTitleVariants> &
  React.HTMLAttributes<HTMLHeadingElement> & {
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p'
    withoutBalancer?: boolean
  }

Builder.registerComponent(
  withChildren((props: BuilderPageSubtitleProps) => (
    <PageSubTitle
      as={props.as}
      size={props.size}
      withoutBalancer={props.withoutBalancer}
      {...props.attributes}
    >
      {props.children}
    </PageSubTitle>
  )),
  {
    name: 'PageSubTitle',
    canHaveChildren: true,
    inputs: [
      {
        name: 'as',
        type: 'enum',
        defaultValue: 'h2',
        enum: AsVariantsConfig,
      },
      {
        name: 'withoutBalancer',
        type: 'boolean',
        defaultValue: true,
      },
    ],
    defaultChildren: [
      {
        '@type': '@builder.io/sdk:Element',
        component: {
          name: 'Text',
          options: {
            text: 'I am a page subtitle',
          },
        },
      },
    ],
  },
)
