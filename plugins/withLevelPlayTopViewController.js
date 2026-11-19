// Expo config plugin: makes Unity LevelPlay present its full-screen ads from the TOPMOST view
// controller instead of the window's root one.
//
// The RN bridge (unity-levelplay-mediation/ios) hands the SDK `keyWindow.rootViewController`.
// Whenever a React Native <Modal> is up (offline reward, attendance, first clear, cooking —
// every "watch an ad" prompt lives inside one) or is still animating away, the root is already
// presenting, so iOS refuses: "Attempt to present <ISNProductViewController> ... while a
// presentation is in progress". The ad never appears, LevelPlay times out ("Screen visible
// timeout"), and its half-attached ad view is left over the app swallowing every touch.
//
// Runs during `expo prebuild` (locally and on Codemagic, which runs `npm ci` then prebuild),
// patching the package's two helpers in node_modules before CocoaPods compiles them.
const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("expo/config-plugins");

const TOPMOST = `UIViewController *presenter = rootViewController;
    while (presenter.presentedViewController && !presenter.presentedViewController.isBeingDismissed) {
        presenter = presenter.presentedViewController;
    }
    return presenter;`;

function patch(file, from, to) {
  if (!fs.existsSync(file)) return;
  const source = fs.readFileSync(file, "utf8");
  if (source.includes("presenter.presentedViewController")) return; // already patched
  if (!source.includes(from)) throw new Error(`withLevelPlayTopViewController: pattern not found in ${file}`);
  fs.writeFileSync(file, source.replace(from, to));
}

module.exports = function withLevelPlayTopViewController(config) {
  return withDangerousMod(config, [
    "ios",
    (modConfig) => {
      const dir = path.join(modConfig.modRequest.projectRoot, "node_modules", "unity-levelplay-mediation", "ios");
      patch(
        path.join(dir, "LevelPlayUtils.mm"),
        `    NSAssert(rootViewController != nil, @"Root view controller should not be nil");

    return rootViewController;`,
        `    NSAssert(rootViewController != nil, @"Root view controller should not be nil");

    ${TOPMOST}`,
      );
      patch(
        path.join(dir, "LevelPlayMediation.mm"),
        `- (UIViewController *)getRootViewController {
    return [UIApplication sharedApplication].keyWindow.rootViewController;
}`,
        `- (UIViewController *)getRootViewController {
    UIViewController *rootViewController = [UIApplication sharedApplication].keyWindow.rootViewController;
    ${TOPMOST}
}`,
      );
      return modConfig;
    },
  ]);
};
