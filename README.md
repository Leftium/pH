# pH

- [ph.leftium.com](https://ph.leftium.com/) makes a unique password for every domain from one master password.
- Runs entirely in your browser: nothing is stored or sent to a server.
- Based on the original [PwdHash](http://www.pwdhash.com/).

## Usage

1. Enter a site address: a domain or a complete `http://` or `https://` URL. pH detects the domain automatically.
2. Enter your master password.
3. Copy the generated password.

_Optional:_ Drag the `pH` bookmarklet from the footer to the bookmarks bar to prefill the current site's domain.

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

<details>
<summary>Original Svelte scaffold notes</summary>

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

### Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
pnpm dlx sv@1.0.0-next.7 create --template minimal --types ts --add prettier eslint vitest="usages:unit" ai-tools="ide:other,opencode" --install pnpm .
```

### Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

### Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

</details>
