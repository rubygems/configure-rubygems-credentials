import * as core from '@actions/core'
import {configureApiToken} from './configure-api-token'
import {assumeRole} from './oidc/assumeRole'
import {exchangeToken} from './oidc/trustedPublisher'

async function run(): Promise<void> {
  try {
    const gemServer = core.getInput('gem-server')
    const audience = core.getInput('audience')
    const roleToAssume = core.getInput('role-to-assume')
    const apiToken = core.getInput('api-token')
    const trustedPublisher: boolean = (() => {
      const trustedPublisherConfigured = !!core.getInput('trusted-publisher')
      if (!trustedPublisherConfigured && !apiToken && !roleToAssume) {
        // default to trusted publishing if no api-token or role-to-assume is specified and trusted-publisher is not configured
        return true
      } else if (trustedPublisherConfigured) {
        return core.getBooleanInput('trusted-publisher')
      } else {
        return false
      }
    })()

    if (!gemServer) throw new Error('Missing gem-server input')

    if (apiToken) {
      if (audience)
        throw new Error('Cannot specify audience when using api-token')
      if (roleToAssume)
        throw new Error('Cannot specify role-to-assume when using api-token')
      if (trustedPublisher)
        throw new Error('Cannot specify trusted-publisher when using api-token')

      await configureApiToken(apiToken, gemServer)
    } else if (roleToAssume) {
      if (!audience) throw new Error('Missing audience input')
      if (trustedPublisher)
        throw new Error(
          'Cannot specify trusted-publisher when using role-to-assume'
        )

      const oidcIdToken = await assumeRole(roleToAssume, audience, gemServer)
      await configureApiToken(oidcIdToken.rubygemsApiKey, gemServer)
    } else if (trustedPublisher) {
      if (!audience) throw new Error('Missing audience input')

      const oidcIdToken = await exchangeToken(audience, gemServer)
      await configureApiToken(oidcIdToken.rubygemsApiKey, gemServer)
    } else {
      throw new Error('Missing api-token or role-to-assume input')
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
