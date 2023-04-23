import * as core from '@actions/core'
import {configureApiToken} from './configureApiToken'
import {assumeRole} from './oidc/assumeRole'

async function run(): Promise<void> {
  try {
    const gemServer = core.getInput('gem-server')
    const audience = core.getInput('audience')
    const roleRoleToAssume = core.getInput('role-to-assume')
    const apiToken = core.getInput('api-token')

    if (!gemServer) throw new Error('Missing gem-server input')

    if (apiToken) {
      if (audience)
        throw new Error('Cannot specify audience when using api-token')
      if (roleRoleToAssume)
        throw new Error('Cannot specify role-to-assume when using api-token')

      await configureApiToken(apiToken, gemServer)
    } else if (roleRoleToAssume) {
      if (!audience) throw new Error('Missing audience input')

      const oidcIdToken = await assumeRole(
        roleRoleToAssume,
        audience,
        gemServer
      )
      await configureApiToken(oidcIdToken.rubygemsApiKey, gemServer)
    } else {
      throw new Error('Missing api-token or role-to-assume input')
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
