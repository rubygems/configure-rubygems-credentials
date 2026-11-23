import {z} from 'zod'

const RubygemSchema = z.object({
  name: z.string()
})

export const IdTokenSchema = z
  .object({
    rubygems_api_key: z.string(),
    name: z.string(),
    scopes: z.array(z.string()),
    gem: RubygemSchema.optional(),
    expires_at: z.union([
      z.iso.datetime({offset: true}),
      z.iso.datetime({offset: true, precision: -1})
    ])
  })
  .transform(({rubygems_api_key, expires_at, ...rest}) => {
    return {
      rubygemsApiKey: rubygems_api_key,
      expiresAt: expires_at,
      ...rest
    }
  })

export type IdToken = z.infer<typeof IdTokenSchema>
