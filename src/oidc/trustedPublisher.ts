import * as core from '@actions/core'
import {HttpClient} from '@actions/http-client'
import {IdToken, IdTokenSchema} from './responses'

export async function exchangeToken(
  audience: string,
  server: string
): Promise<IdToken> {
  const webIdentityToken = await core.getIDToken(audience)
  if (!webIdentityToken)
    throw new Error(`Unable to get ID Token for audience ${audience}`)
  const http = new HttpClient('rubygems-oidc-action')
  const url = `${server}/api/v1/oidc/trusted_publisher/exchange_token`
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
      `No trusted publisher configured for this workflow found on ${server} for audience ${audience}`
    )

  return IdTokenSchema.parse(res.result)
}
