// Dynamic Expo config.
//
// experiments.baseUrl ("/tether") is required ONLY for the GitHub Pages web
// build, where the app is served from username.github.io/tether/ and assets
// must resolve under that sub-path.
//
// On native (EAS iOS/Android) a baseUrl leaks into the embedded asset paths
// — assets get written to Tether.app/tether/assets/... and the archive step
// fails with "ENOTDIR: not a directory, mkdir .../tether/assets/...". baseUrl
// is a web-only concern, so we gate it behind WEB_DEPLOY, which is set ONLY
// in the GitHub Pages deploy workflow. Everywhere else (EAS builds, local
// dev) baseUrl is omitted and native asset bundling works normally.
//
// Expo reads the static app.json first and passes its contents here as
// `config`; we spread it through and override only experiments.baseUrl.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.WEB_DEPLOY === '1' ? '/tether' : undefined,
  },
});
