import * as core from '@actions/core'
import {HttpClient} from '@actions/http-client'

type IdToken = {
  rubygemsApiKey: string
  name: string
  scopes: [string]
  gem: string | undefined
  expiresAt: string
}

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
  const res = await http.postJson<{
    rubygems_api_key: string
    gem: string | undefined
    name: string
    scopes: [string]
    expires_at: string
  }>(
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

  const idToken = res.result

  if (typeof idToken.rubygems_api_key !== 'string')
    throw new Error('rubygems_api_key is not a string')

  return {
    rubygemsApiKey: idToken.rubygems_api_key,
    gem: idToken.gem,
    name: idToken.name,
    scopes: idToken.scopes,
    expiresAt: idToken.expires_at
  }
}
