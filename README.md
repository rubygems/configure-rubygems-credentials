<p align="center">
  <a href="https://github.com/rubygems/configure-rubygems-credentials/actions">
  <img alt="configure-rubygems-credentials-action status" src="https://github.com/rubygems/configure-rubygems-credentials/workflows/build-test/badge.svg">
  </a>
</p>

## Configure RubyGems Credentials for GitHub Actions

Configure your RubyGems credentials and for use in other
GitHub Actions. This action implements OIDC support, writes gem credentials files,
and exports environment variables used by both `rubygems` and
`bundler` for your other Actions to use.

### Table of Contents

<!-- toc -->

- [Usage](#usage)
  - [Examples](#examples)
    - [OIDC (recommended)](#oidc-recommended)
    - [Static API token in repository secrets](#static-api-token-in-repository-secrets)
  - [Use with the RubyGems CLI](#use-with-the-rubygems-cli)
- [License Summary](#license-summary)
- [Security Disclosures](#security-disclosures)

<!-- tocstop -->

## Usage

We recommend that
you use GitHub's OIDC provider in conjunction with a configured
RubyGems OIDC API Key Role.

To do that, you would add the following step to your workflow:

```yaml
- name: Configure RubyGems Credentials
  uses: rubygems/configure-rubygems-credentials@main
  with:
    role-to-assume: 3
```

You can use this action with the `rubygems` or `bundler` command line tools,
or run this action multiple times
to use different RubyGems.org accounts or OIDC API Key roles in the same GitHub Actions
workflow. As an example, here is a complete workflow file that pushes a gem release.

```yaml
on:
  - push

jobs:
  job:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: rubygems/configure-rubygems-credentials@main
        with:
          role-to-assume: 2
          gem-server: 'https://oidc-api-token.rubygems.org'
          audience: 'https://oidc-api-token.rubygems.org'
      - uses: actions/checkout@v3
      - name: Set remote URL
        run: |
          git config --global user.email "$(git log -1 --pretty=format:'%ae')"
          git config --global user.name "$(git log -1 --pretty=format:'%an')"
          git remote set-url origin "https://x-access-token:${{ secrets.GITHUB_TOKEN }}@github.com/$GITHUB_REPOSITORY"
      - name: Set up Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.2.1'
          bundler-cache: true
      - name: Release
        run: bundle exec rake release
```

See [action.yml](action.yml) for the full documentation for this action's inputs
and outputs.

### Examples

#### OIDC (recommended)

```yaml
- name: Configure RubyGems Credentials
  uses: rubygems/configure-rubygems-credentials@main
  with:
    role-to-assume: 3
```

In this example, the Action will load the OIDC token from the GitHub-provided environment variable and use it to assume the role `3`.

#### Static API token in repository secrets

```yaml
- name: Configure RubyGems Credentials
  uses: rubygems/configure-rubygems-credentials@main
  with:
    api-token: ${{ secrets.RUBYGEMS_API_TOKEN }}
```

In this example, the secret `RUBYGEMS_API_TOKEN` contains a string like `rubygems_1a072a969ecdd84bb190c3c218e13e3c6f5d419f3f0f5b22`.

### Use with the RubyGems CLI

This workflow does _not_ install the rubygems
into your environment.

## License Summary

This code is made available under the MIT license.

## Security Disclosures

If you would like to report a potential security issue in this project, please do not create a GitHub issue. Instead, please follow the instructions [here](https://rubygems.org/pages/security) or [email the RubyGems security team](mailto:security@rubygems.org).
