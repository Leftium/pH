# pH

- [ph.leftium.com](https://ph.leftium.com/) makes a unique password for each site from one master password.
- Runs entirely in your browser: nothing is stored or sent to a server.
- Based on the original [PwdHash](http://www.pwdhash.com/).

## Usage

1. Enter the site's address. pH uses the same password realm for its subdomains.
2. Enter your master password.
3. Copy the generated password.

_Optional:_ Drag the `pH` bookmarklet from the footer to the bookmarks bar to prefill the current site's address.

## Develop

Install dependencies and start the development server:

```sh
pnpm install
pnpm dev
```

Useful commands:

```sh
pnpm check
pnpm test
pnpm build
pnpm preview
```

## Deploy to GitHub Pages

The included GitHub Actions workflow checks, tests, builds, and deploys pushes to `main`.

<details>
<summary>GitHub Pages setup</summary>

1. Fork or push this repository to GitHub.
2. In the repository's Settings, open Pages and select **GitHub Actions** as the publishing source.
3. Push to `main`. The workflow deploys the static `build/` output after checks and tests pass.
4. Serve the site at a domain root, either with a custom domain or a user/organization Pages repository. For a project URL such as `username.github.io/repository`, configure the matching SvelteKit base path before deploying.

</details>

## License

[MIT](LICENSE)
