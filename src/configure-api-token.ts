import * as core from '@actions/core'
import * as io from '@actions/io'
import {readFile, writeFile} from 'fs/promises'
import {homedir} from 'os'
import {join} from 'path'
import YAML from 'yaml'

export async function configureApiToken(
  apiToken: string,
  server: string
): Promise<void> {
  if (!apiToken) throw new Error('Empty apiToken is not supported')

  core.exportVariable('RUBYGEMS_API_KEY', apiToken)
  core.exportVariable('BUNDLE_GEM__PUSH_KEY', apiToken)
  core.exportVariable('GEM_HOST_API_KEY', apiToken)
  core.setSecret(apiToken)

  const gemDir = join(homedir(), '.gem')
  await io.mkdirP(gemDir)
  const credentialsFile = join(gemDir, 'credentials')

  let key: string
  if (server === 'https://rubygems.org') {
    key = ':rubygems_api_key'
  } else {
    key = `${server}`
  }

  await addCredentialToFile(credentialsFile, key, apiToken)
}

async function addCredentialToFile(
  path: string,
  key: string,
  value: string
): Promise<void> {
  const credentials = await readCredentials(path)

  credentials.add({key, value: new YAML.Scalar(value)})
  await writeFile(path, credentials.toString(), {
    encoding: 'utf8',
    mode: 0o600,
    flag: 'w'
  })
}

async function readCredentials(
  path: string
): Promise<YAML.Document<YAML.Node, true>> {
  try {
    const contents = await readFile(path, 'utf8')
    return YAML.parseDocument(contents)
  } catch (error) {
    return new YAML.Document(
      new YAML.YAMLMap(
        new YAML.Schema({toStringDefaults: {collectionStyle: 'block'}})
      )
    )
  }
}
