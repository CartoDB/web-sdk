# 1. Set up

To build the project you just need Node JS. We include a `.nvmrc` file with the current node version (so if you use *Node Version Manager* just run `nvm use`).

Starting from scratch
```bash
    git clone https://github.com/CartoDB/web-sdk
    cd web-sdk
    # [optional] nvm use
    npm install
    npm run build
```
and you will get a `dist` folder with a `umd` bundle (the one deployed to the cdn) + `cjs` (*CommonJS*) and `esm` (*ES Modules*) distributions.

To test the project
```bash
    npm run test
```

And, to get the examples up and running in a local web server:
```bash
    npm run serve
```
and you then can navigate to the `examples` folder in watch mode


# 2. Workflow and Releases

The library is deployed to a CDN, for direct conpsumtion from the browser, and at the NPM registry (as `@carto/web-sdk` package), and it follows [Semantic Versioning](http://semver.org/spec/v2.0.0.html). This is the common workflow.


## 2.1. Workflow

Our main branch is `master`. This branch is stable and has the same content as the last published version. The branch with the new changes for the next **major** or **minor** release is `develop`. This procedure is inspired on *gitflow-workflow*.

We try to follow this convention when naming branches:
- Features: `feature/<description>` (i.e: feature/new-histogram-mode)
- Fixes: `fix/<description>`  (i.e: fix/icon-in-firefox)
- Hotfix: `hotfix/<description>` (i.e: hotfix/fix-style)
- Release (minor & major): `release/<version>` (i.e: release/v1.2.5). Notice the pattern is `vM.m.p`, and it might contain a pre-release suffix, like `vM.m.p-alpha.0`.

And these procedures:
- _Features_ and _Fixes_ are created from `develop`, so common PRs must be against `develop` (and that's the way it is configured by default in Github).
- _Hotfix_ are created from `master`. They contain small changes that imply a *patch* release. So a hotfix PR should be opened against `master`.
- _Release_ branches must be created from `develop` branch.

Use cases:
1. When releasing a common version
    - create a `release` branch from `develop` (eg. `release/v1.0.0`)
    - launch the release process (which includes the version bump and npm publication). For example, from a previous `v0.0.1`, you will set the bump to the desired `v1.0.0`
    - merge the `release` branch to `master`
    - merge `master` back to `develop`, because it always have to be updated with `master`.
2. When a hotfix PR is merged into `master` for a patch release, also we must merge `master` back into `develop`.

> Note: The next sections, about releases, are for internal use at CARTO and they require the proper permissions (with a `secrets.json`).


## 2.1. Development releases to CDN

The CDN is used for official releases, but also for "work in progress" versions.

During **development**, it might be interesting to deploy some arbitrary branch to the CDN for testing (for example to check its documentation in the Developer Center), and you can get that by running:

```bash
    npm run publish:cdn-branch
```
If you're not sure, you can test it before with `npm run publish:cdn-branch -- --dry-run`. If your branch is named `my-branch`, you will get a deployment like `https://libs.cartocdn.com/web-sdk/branches/my-branch/index.min.js`.

> Note: Beware of valid branch names (eg. `feature/ch1/xyz` will be sanitized to `featurech1xyz`).


## 2.1. Publication to NPM

The library is available at NPM registry as [@carto/web-sdk](https://www.npmjs.com/package/@carto/web-sdk).

The procedure for a release uses `release-it` npm tool. That command will take care of the whole process: npm credentials check, type of release selection (major, minor, patch), bump version (it can be ommitted), tag creation in github and npm publication.

It can be invoked as
```bash
    npm run make-release
```
and an interactive CLI will require confirmation / inputs on the desired parameters.

In case of a prerelease, the naming should be `version-alpha.x` or `version-beta.x` (for example `1.0.0-alpha.2` or `1.1.0-beta.1`).

You can first try the publication without hitting the real npm registry using `npm run make-release -- --dry-run` mode (note that this creates a commit, tag and push to github though).

Once the publication has finished, you can check its status at npm with:
```bash
    npm view @carto/web-sdk
```

The release script also launches the proper CDN deployment, so with any published release you will have also the corresponding files deployed to *cartocdn*.

> After the publication, remember to manually merged the `release|fix` branch to `master`, and then `master` back to `develop`.

