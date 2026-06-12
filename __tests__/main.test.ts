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
import {homedir} from 'os'
import {join} from 'path'
import YAML from 'yaml'

// Module namespaces are immutable under Jest's ESM runtime, so
// @actions/core has to be replaced as a whole module instead of having
// individual exports spied upon.
jest.unstable_mockModule('@actions/core', () => ({
  getIDToken: jest.fn<() => Promise<string>>(),
  exportVariable: jest.fn(),
  setSecret: jest.fn()
}))

const core = await import('@actions/core')
const {configureApiToken} = await import('../src/configure-api-token')
const {assumeRole} = await import('../src/oidc/assumeRole')
const {exchangeToken} = await import('../src/oidc/trustedPublisher')

const credentialsFile = join(homedir(), '.gem', 'credentials')

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
    mockFS({})

    await configureApiToken('token', 'https://rubygems.org')

    await expect(
      readFile(credentialsFile, 'utf8').then(YAML.parse)
    ).resolves.toEqual({':rubygems_api_key': 'token'})
    expect(exportedVariables).toEqual({
      BUNDLE_GEM__PUSH_KEY: 'token',
      GEM_HOST_API_KEY: 'token',
      RUBYGEMS_API_KEY: 'token'
    })
  })

  test('adding custom token', async () => {
    mockFS({})

    await configureApiToken('token', 'https://oidc-api-token.rubygems.org')

    await expect(
      readFile(credentialsFile, 'utf8').then(YAML.parse)
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
    jest.mocked(core.getIDToken).mockResolvedValue('ID_TOKEN')

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

  test('works when scoped to a gem', async () => {
    jest.mocked(core.getIDToken).mockResolvedValue('ID_TOKEN')

    nock('https://rubygems.org')
      .post('/api/v1/oidc/api_key_roles/1/assume_role', {
        jwt: 'ID_TOKEN'
      })
      .reply(201, {
        name: 'role name',
        rubygems_api_key: 'API_KEY',
        expires_at: '2021-01-01T00:00:00Z',
        gem: {name: 'rubygem0', version: '1.0.0'},
        scopes: ['push_rubygem']
      })

    await expect(
      assumeRole('1', 'rubygems.org', 'https://rubygems.org')
    ).resolves.toEqual({
      expiresAt: '2021-01-01T00:00:00Z',
      gem: {name: 'rubygem0'},
      name: 'role name',
      rubygemsApiKey: 'API_KEY',
      scopes: ['push_rubygem']
    })
  })
})

describe('exchangeToken', () => {
  test('works', async () => {
    jest.mocked(core.getIDToken).mockResolvedValue('ID_TOKEN')

    nock('https://rubygems.org')
      .post('/api/v1/oidc/trusted_publisher/exchange_token', {
        jwt: 'ID_TOKEN'
      })
      .reply(201, {
        name: 'role name',
        rubygems_api_key: 'API_KEY',
        expires_at: '2021-01-01T00:00:00Z',
        scopes: ['push_rubygem']
      })

    await expect(
      exchangeToken('rubygems.org', 'https://rubygems.org')
    ).resolves.toEqual({
      expiresAt: '2021-01-01T00:00:00Z',
      gem: undefined,
      name: 'role name',
      rubygemsApiKey: 'API_KEY',
      scopes: ['push_rubygem']
    })
  })

  test('handles a 404', async () => {
    jest.mocked(core.getIDToken).mockResolvedValue('ID_TOKEN')

    nock('https://rubygems.org')
      .post('/api/v1/oidc/trusted_publisher/exchange_token', {
        jwt: 'ID_TOKEN'
      })
      .reply(404, '')

    await expect(
      exchangeToken('rubygems.org', 'https://rubygems.org')
    ).rejects.toEqual(
      new Error(
        'No trusted publisher configured for this workflow found on https://rubygems.org for audience rubygems.org'
      )
    )
  })
})

let exportedVariables: Record<string, string>
let secrets: string[]

beforeEach(() => {
  if (!nock.isActive()) {
    nock.activate()
  }
  nock.disableNetConnect()

  exportedVariables = {}
  secrets = []
  jest.mocked(core.exportVariable).mockImplementation((name, value) => {
    exportedVariables[name] = value
  })
  jest.mocked(core.setSecret).mockImplementation(value => {
    secrets.push(value)
  })
})

afterEach(() => {
  mockFS.restore()
  nock.restore()
})
