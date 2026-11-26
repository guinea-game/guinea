// Expo config plugin: Play Console blocks releases because `android:screenOrientation="portrait"`
// on MainActivity makes AAPT auto-add an implied `<uses-feature android:name=
// "android.hardware.screen.portrait" android:required="true"/>`, which excludes devices (some
// tablets, Desktop/PC Google Play Games, Android XR) that don't support a fixed portrait screen.
// Declaring the feature ourselves with required="false" overrides the implied one.
const { withAndroidManifest } = require("expo/config-plugins");

module.exports = function withOptionalPortraitFeature(config) {
  return withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;
    if (!manifest["uses-feature"]) manifest["uses-feature"] = [];
    const already = manifest["uses-feature"].some(
      (f) => f.$ && f.$["android:name"] === "android.hardware.screen.portrait",
    );
    if (!already) {
      manifest["uses-feature"].push({
        $: { "android:name": "android.hardware.screen.portrait", "android:required": "false" },
      });
    }
    return modConfig;
  });
};
