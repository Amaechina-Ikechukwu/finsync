// Expo config plugin to:
// 1) Remove android:screenOrientation from ML Kit's GmsBarcodeScanningDelegateActivity to avoid orientation restrictions on large screens (Android 16+ behavior changes).
// 2) Optionally ensure edge-to-edge defaults without setting deprecated status/navigation bar colors.

/** @type {import('@expo/config-plugins').ConfigPlugin} */
module.exports = function withAndroidEdgeToEdgeAndOrientationFixes(config) {
  const { withAndroidManifest } = require('@expo/config-plugins');

  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    if (!manifest || !manifest.manifest || !manifest.manifest.application) return config;

    const app = manifest.manifest.application.find(() => true);
    if (!app || !app.activity) return config;

    // Remove screenOrientation attribute from the ML Kit internal activity if present
    for (const activity of app.activity) {
      if (
        activity['$']?.['android:name'] ===
        'com.google.mlkit.vision.codescanner.internal.GmsBarcodeScanningDelegateActivity'
      ) {
        if (activity['$'] && activity['$']['android:screenOrientation']) {
          delete activity['$']['android:screenOrientation'];
        }
      }
    }

    // Nothing else to change in manifest for edge-to-edge; Expo and libraries will handle insets.
    return config;
  });
};
