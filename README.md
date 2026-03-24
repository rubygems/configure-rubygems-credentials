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
  - [Trusted Publisher (recommended)](#trusted-publisher-recommended)
  - [OIDC API Key Role](#oidc-api-key-role)
  - [Static API token in repository secrets](#static-api-token-in-repository-secrets)
  - [Use with the RubyGems CLI](#use-with-the-rubygems-cli)
- [License Summary](#license-summary)
- [Security Disclosures](#security-disclosures)

<!-- tocstop -->

## Usage

There are three ways to configure RubyGems credentials:

1. **Trusted Publisher (recommended)**: Uses OIDC without any API tokens or secrets.
2. **OIDC API Key Role**: Uses OIDC with a pre-configured API Key Role on RubyGems.org.
3. **Static API token**: Uses a RubyGems API token stored in repository secrets.

> **Note**: The OIDC-based configurations (**Trusted Publisher** and **OIDC API Key Role**) require the `id-token: write` permission in your workflow, for example:
>
> ```yaml
> permissions:
>   id-token: write
>   contents: read
> ```

### Trusted Publisher (recommended)

The simplest approach is to use [Trusted Publishing](https://guides.rubygems.org/trusted-publishing/).
Configure a trusted publisher for your gem on RubyGems.org, then use:

```yaml
- name: Configure RubyGems Credentials
  uses: rubygems/configure-rubygems-credentials@main
```

No additional inputs are required. The action will automatically use OIDC to authenticate
with RubyGems.org as a trusted publisher.

### OIDC API Key Role

Alternatively, you can create an OIDC API Key Role on RubyGems.org and reference it
with the `role-to-assume` input. The value is the **OIDC API Key Role token**
(a string starting with `rg_oidc_akr_`), which you can find on the
"OIDC: Create" page of your gem on RubyGems.org.

```yaml
- name: Configure RubyGems Credentials
  uses: rubygems/configure-rubygems-credentials@main
  with:
    role-to-assume: rg_oidc_akr_f55fe1127adjkkcn8ty6
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
          role-to-assume: rg_oidc_akr_f55fe1127adjkkcn8ty6
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

### Static API token in repository secrets

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
