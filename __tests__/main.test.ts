import nock from 'nock'
import {
  beforeEach,
  afterEach,
  expect,
  jest,
  test,
  describe
} from '@jest/globals'
import {readFile} from 'fs/promises'
import mockFS from 'mock-fs'
import * as os from 'os'
import YAML from 'yaml'
import * as core from '@actions/core'

import {configureApiToken} from '../src/configure-api-token'
import {assumeRole} from '../src/oidc/assumeRole'

jest.mock('os', () => {
  const originalModule = jest.requireActual('os') as any

  return {
    __esModule: true, // Use it when dealing with esModules
    ...originalModule,
    homedir: jest.fn()
  }
})

describe('configureApiToken', () => {
  test('throws no token', async () => {
    await expect(configureApiToken(undefined as any, '')).rejects.toThrow(
      'Empty apiToken is not supported'
    )
  })

  test('throws empty token', async () => {
    await expect(configureApiToken(undefined as any, '')).rejects.toThrow(
      'Empty apiToken is not supported'
    )
  })

  test('adding default token', async () => {
    mockHomedir('/home/runner')
    mockFS({})

    await configureApiToken('token', 'https://rubygems.org')

    await expect(
      readFile('/home/runner/.gem/credentials', 'utf8').then(YAML.parse)
    ).resolves.toEqual({':rubygems_api_key': 'token'})
    expect(exportedVariables).toEqual({
      BUNDLE_GEM__PUSH_KEY: 'token',
      GEM_HOST_API_KEY: 'token',
      RUBYGEMS_API_KEY: 'token'
    })
  })

  test('adding custom token', async () => {
    mockHomedir('/home/runner')
    mockFS({})

    await configureApiToken('token', 'https://oidc-api-token.rubygems.org')

    await expect(
      readFile('/home/runner/.gem/credentials', 'utf8').then(YAML.parse)
    ).resolves.toEqual({'https://oidc-api-token.rubygems.org': 'token'})
    expect(exportedVariables).toEqual({
      BUNDLE_GEM__PUSH_KEY: 'token',
      GEM_HOST_API_KEY: 'token',
      RUBYGEMS_API_KEY: 'token'
    })
  })
})

describe('assumeRole', () => {
  test('works', async () => {
    jest.spyOn(core, 'getIDToken').mockReturnValue(Promise.resolve('ID_TOKEN'))

    nock('https://rubygems.org')
      .post('/api/v1/oidc/api_key_roles/1/assume_role', {
        jwt: 'ID_TOKEN'
      })
      .reply(201, {
        name: 'role name',
        rubygems_api_key: 'API_KEY',
        expires_at: '2021-01-01T00:00:00Z',
        scopes: ['push_rubygem']
      })

    await expect(
      assumeRole('1', 'rubygems.org', 'https://rubygems.org')
    ).resolves.toEqual({
      expiresAt: '2021-01-01T00:00:00Z',
      gem: undefined,
      name: 'role name',
      rubygemsApiKey: 'API_KEY',
      scopes: ['push_rubygem']
    })
  })
})

function mockHomedir(homedir: string) {
  mockOf(os.homedir).mockReturnValue(homedir)
}

function mockOf<T extends (...args: any) => any>(dep: T): jest.Mock<T> {
  return <jest.Mock<T>>(<unknown>dep)
}

let exportedVariables: Record<string, string>
let secrets: string[]

beforeEach(() => {
  if (!nock.isActive()) {
    nock.activate()
  }
  nock.disableNetConnect()

  exportedVariables = {}
  secrets = []
  jest.spyOn(core, 'exportVariable').mockImplementation((name, value) => {
    exportedVariables[name] = value
  })
  jest.spyOn(core, 'setSecret').mockImplementation(value => {
    secrets.push(value)
  })
})

afterEach(() => {
  mockFS.restore()
  nock.restore()
})
