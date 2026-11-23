import {z} from 'zod'

const RubygemSchema = z.object({
  name: z.string()
})

const DatetimeSchema = z.iso.datetime({offset: true})
const MinutePrecisionDatetimeSchema = z.iso.datetime({
  offset: true,
  precision: -1
})

const ExpiresAtSchema = z.string().check(ctx => {
  if (MinutePrecisionDatetimeSchema.safeParse(ctx.value).success) return
  const result = DatetimeSchema.safeParse(ctx.value)
  if (!result.success)
    for (const issue of result.error.issues)
      ctx.issues.push({...issue, input: ctx.value} as z.core.$ZodRawIssue)
})

export const IdTokenSchema = z
  .object({
    rubygems_api_key: z.string(),
    name: z.string(),
    scopes: z.array(z.string()),
    gem: RubygemSchema.optional(),
    owner: z.string().optional(),
    expires_at: ExpiresAtSchema
  })
  .transform(({rubygems_api_key, expires_at, ...rest}) => {
    return {
      rubygemsApiKey: rubygems_api_key,
      expiresAt: expires_at,
      ...rest
    }
  })

export type IdToken = z.infer<typeof IdTokenSchema>
