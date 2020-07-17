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

And to get the examples up and running in a local web server:
```bash
    npm run serve
```
and you then can navigate to the `examples` folder in watch mode


# 2. Workflow and releases

The library is deployed to a CDN, for direct consumption from the browser, and to the NPM registry (as `@carto/web-sdk` package), and it follows [Semantic Versioning](http://semver.org/spec/v2.0.0.html). This is the common workflow.


## 2.1. Workflow

Our main branch is `master`. This branch is stable and has the same content as the last published version. The branch with the new changes for the next **major** or **minor** release is `develop`. This procedure is inspired on *gitflow-workflow*.

We try to follow this convention when naming branches:
- Features: `feature/<description>` (i.e: feature/new-histogram-mode)
- Fixes: `fix/<description>`  (i.e: fix/icon-in-firefox)
- Hotfix: `hotfix/<description>` (i.e: hotfix/fix-style)
- Release: `release/<version>` (i.e: release/v1.2.5). Notice the pattern is `vM.m.p`, and it might contain a pre-release suffix, like `vM.m.p-alpha.0`.

Origin of the branches:
- _Features_ and _Fixes_ are created from `develop`, so common PRs must be against `develop` (and that's the way it is configured by default in Github).
- _Hotfixes_ are created from `master`. They contain small changes that imply a *patch* release. So a hotfix PR should be opened against `master`.
- _Release_ branches must be created from `develop` branch.

Steps for a release:
1. create a new branch, either from `develop` (if it's a common release, eg. `release/v1.0.0`) or from `master` (if it is a hotfix, like `hotfix/legend-1`).
2. pass all the checks on it (build, test, lint, doc...).
3. update the `CHANGELOG`, adding the current date, expected version and its notes, and then a new *Unreleased* section. Commit it to the branch.
4. set up the upstream branch (eg. `git push --set-upstream origin release/v1.0.0`).
5. create a PR, in draft mode, for some previous revision from your mates. Name the PR after the release, eg `release/v1.0.0`. Don't start the release process without that feedback.
6. launch the release process (which includes the version bump aand the npm & cdn publication) and specify the desired version, eg. `v1.0.0`. See section 2.3 to know more details about this step.
7. after a succesful release, merge the `release` or `hotfix` branch to `master`
8. merge `master` back to `develop`, because it always have to be updated with `master`.

> Note: The next sections, about releases, are just for internal use at CARTO and they require the proper permissions (with a `secrets.json`).


## 2.2. Development releases to CDN

The CDN is used for official releases, but also for "work in progress" versions. For any official release to npm, the CDN publication will be launched automatically after it (see the 2.3 section for more details).

But during development, it can be also interesting to deploy some arbitrary branch to the CDN for testing (just to the cdn, not to the npm), for example to check its documentation in the Developer Center. And you can get that by running this from the desired branch:

```bash
    npm run release:cdn:branch
```
If you're not sure, you can test it before with `npm run release:cdn:branch -- --dry-run`, and it will just emulate the procedure, giving some feedback in your console. If your branch is named `my-branch`, you will get a deployment like `https://libs.cartocdn.com/web-sdk/branches/my-branch/index.min.js`.

> Note: Beware of valid branch names (eg. `feature/ch1/xyz` will be sanitized to `featurech1xyz`).


## 2.3. Publication to NPM

The library is available at NPM registry as [@carto/web-sdk](https://www.npmjs.com/package/@carto/web-sdk).

The procedure for a release uses internally `release-it`. That tool will take care of several relevant steps: npm credentials check, type of release selection (major, minor, patch), bump version (it can be ommitted), tag creation in github and npm publication.

And for the proper CDN deployment, there is also a `release:cdn` script but you don't need to call it explicitly, it will be included in this invokation for a whole release (NPM + CDN) with:

```bash
    npm run release
```
and an interactive CLI will require inputs & confirmation on the desired parameters.

In case of a prerelease, the naming must be `version-alpha.x` or `version-beta.x` (for example `1.0.0-alpha.0` or `1.1.0-beta.2`).

You can try first the publication procedure without hitting the real npm registry using `npm run release:dry-run` mode (note that this would still create a commit, tag and push to github though, if you follow the standard path and push Y to all the options).

**NPM**
Once the publication has finished, you can check the project status at npm with:
```bash
    npm view @carto/web-sdk
```

**CDN**
The release script also launches the proper CDN deployment, so with any published release you will have also the corresponding files deployed to *cartocdn*. 

If a release is, for example `v2.1.0`, it will be deployed to:
- `https://libs.cartocdn.com/web-sdk/v2/index.min.js`
- `https://libs.cartocdn.com/web-sdk/v2.1/index.min.js`
- `https://libs.cartocdn.com/web-sdk/v2.1.0/index.min.js`

> Note, this triple deployment does not apply if using a pre-release (eg `4.2.0-alpha.0`). In that case it gets deployed to: 
- `https://libs.cartocdn.com/web-sdk/4.2.0-alpha/index.min.js`
- `https://libs.cartocdn.com/web-sdk/4.2.0-alpha.0/index.min.js`


> After the publication, remember to manually merged the `release|fix` branch to `master`, and then `master` back to `develop`.

