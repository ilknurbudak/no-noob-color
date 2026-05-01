import type { CapacitorConfig } from "@capacitor/cli";

// Capacitor wraps the built Vue app into iOS + Android.
// Setup (once you decide to ship mobile):
//   npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
//   npm run build
//   npx cap add ios && npx cap add android
//   npx cap copy
//   npx cap open ios
//
// Native features pinned for #97-101:
//   @capacitor/camera         direct photo capture from the ref-image zone
//   @capacitor/filesystem     read photo library
//   @capacitor/share          iOS share extension (Send to no noob)
//   @capacitor/push-notifications  weekly inspiration push
//   @capacitor/keyboard, @capacitor/status-bar  basic platform hygiene

const config: CapacitorConfig = {
  appId: "com.nonoob.color",
  appName: "no noob color",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#FAFAFA",
  },
  android: {
    backgroundColor: "#FAFAFA",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#FAFAFA",
      showSpinner: false,
    },
  },
};

export default config;
