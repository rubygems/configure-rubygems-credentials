import * as core from '@actions/core'
import {HttpClient} from '@actions/http-client'
import {z} from 'zod'

const RubygemSchema = z.object({
  name: z.string()
})

const IdTokenSchema = z
  .object({
    rubygems_api_key: z.string(),
    name: z.string(),
    scopes: z.array(z.string()),
    gem: RubygemSchema.optional(),
    expires_at: z.string().datetime({offset: true})
  })
  .transform(({rubygems_api_key, expires_at, ...rest}) => {
    return {
      rubygemsApiKey: rubygems_api_key,
      expiresAt: expires_at,
      ...rest
    }
  })

type IdToken = z.infer<typeof IdTokenSchema>

export async function assumeRole(
  roleToAssume: string,
  audience: string,
  server: string
): Promise<IdToken> {
  const webIdentityToken = await core.getIDToken(audience)
  if (!webIdentityToken)
    throw new Error(`Unable to get ID Token for audience ${audience}`)
  const http = new HttpClient('rubygems-oidc-action')
  const url = `${server}/api/v1/oidc/api_key_roles/${roleToAssume}/assume_role`
  const res = await http.postJson<IdToken>(
    url,
    {jwt: webIdentityToken},
    {
      'content-type': 'application/json',
      accept: 'application/json'
    }
  )

  if (!res.result)
    throw new Error(
      `No valid role ${roleToAssume} found on ${server} for audience ${audience}`
    )

  return IdTokenSchema.parse(res.result)
}
