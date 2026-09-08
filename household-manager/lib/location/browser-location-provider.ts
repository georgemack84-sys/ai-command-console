import type { DeviceLocation } from "./types";

export interface DeviceLocationProvider {
  getCurrentLocation(): Promise<DeviceLocation>;
}

export class BrowserLocationProvider implements DeviceLocationProvider {
  getCurrentLocation(): Promise<DeviceLocation> {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return Promise.reject(new Error("Location is not available in this browser."));
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          capturedAt: new Date().toISOString()
        }),
        (error) => reject(new Error(error.message || "Location permission was not granted.")),
        { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 }
      );
    });
  }
}
