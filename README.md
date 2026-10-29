# Website

## PDF manuals

`npm run build` builds both Docusaurus locales and generates static manuals in
`build/downloads/tier0-enterprise-manual-{en,zh}.pdf` and copies them to
`static/downloads/` so the development server can serve them too. The website's **PDF**
navigation item opens a dialog to download either language. Run `npm run pdf`
to rebuild the site and PDFs after documentation changes, or
`node scripts/export-manual.mjs --from-build --locale=zh` to regenerate one
language from an existing site build.

The exporter follows `sidebars.js`, uses Docusaurus's built document routes,
and reports missing translations and image resources. It requires Playwright's
Chromium browser (`npx playwright install chromium` if it is not installed).

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH:

```
$ USE_SSH=true yarn deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
