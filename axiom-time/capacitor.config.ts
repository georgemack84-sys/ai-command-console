/// <reference types="@capacitor/local-notifications" />

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.axiom.time",
  appName: "Axiom Time",
  webDir: "out",
  plugins: {
    LocalNotifications: {
      presentationOptions: ["badge", "sound", "banner", "list"],
    },
  },
};

export default config;
