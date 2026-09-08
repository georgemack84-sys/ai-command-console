export type LocationMode = "HOUSEHOLD" | "CURRENT_DEVICE";

export type HouseholdLocation = {
  id: string;
  householdId: string;
  label: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  createdAt: string;
  updatedAt: string;
};

export type DeviceLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: string;
};

export type EffectiveLocation = {
  latitude: number;
  longitude: number;
  timezone: string;
  label: string;
  source: "HOUSEHOLD" | "CURRENT_DEVICE";
};

export type LocationDraft = Pick<HouseholdLocation, "label" | "city" | "state" | "postalCode" | "country">;
