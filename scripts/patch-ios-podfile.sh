#!/bin/bash
# Codemagic's iOS workflow runs `expo prebuild --platform ios` fresh on every build (ios/ is
# gitignored/CNG-generated, never committed), so a manual edit to ios/Podfile can't persist —
# this has to run as its own codemagic.yaml step, between "Generate iOS project" and
# "Install CocoaPods dependencies", every time.
#
# Adds the Unity Ads network adapter pod. Without it, unity-levelplay-mediation's core
# IronSourceSDK pod only carries ironSource's own in-house bidding demand — Unity Ads shows as
# configured/bidding-enabled in the LevelPlay dashboard but never actually places a bid.
# No version pin, matching the plugin's own example app
# (ironsource-mobile/react-native-SDK/example/ios/Podfile).
set -euo pipefail

PODFILE="ios/Podfile"

if [ ! -f "$PODFILE" ]; then
  echo "error: $PODFILE not found (expected to run after expo prebuild)" >&2
  exit 1
fi

if grep -q "IronSourceUnityAdsAdapter" "$PODFILE"; then
  echo "IronSourceUnityAdsAdapter already present in $PODFILE, skipping"
  exit 0
fi

if ! grep -q "use_expo_modules!" "$PODFILE"; then
  echo "error: could not find 'use_expo_modules!' anchor in $PODFILE" >&2
  exit 1
fi

perl -0pi -e "s/^([ \t]*use_expo_modules!\s*\n)/\$1  pod 'IronSourceUnityAdsAdapter'\n/m" "$PODFILE"

grep -q "IronSourceUnityAdsAdapter" "$PODFILE" || { echo "error: patch did not apply" >&2; exit 1; }
echo "Added IronSourceUnityAdsAdapter to $PODFILE"
