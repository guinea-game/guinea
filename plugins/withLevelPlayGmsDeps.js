const { withAppBuildGradle } = require("expo/config-plugins");

// unity-levelplay-mediation's README says these two Play Services deps aren't pulled in
// automatically and must be added by the app: https://docs.unity.com/en-us/grow/levelplay/sdk/react/plugin-integration
const DEPENDENCIES = [
  "implementation 'com.google.android.gms:play-services-appset:16.0.2'",
  "implementation 'com.google.android.gms:play-services-ads-identifier:18.0.1'",
];

module.exports = function withLevelPlayGmsDeps(config) {
  return withAppBuildGradle(config, (config) => {
    const { contents } = config.modResults;
    const missing = DEPENDENCIES.filter((line) => !contents.includes(line));
    if (missing.length === 0) return config;

    config.modResults.contents = contents.replace(
      /dependencies\s*\{/,
      (match) => `${match}\n    ${missing.join("\n    ")}`,
    );
    return config;
  });
};
