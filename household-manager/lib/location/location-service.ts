import { BrowserLocationProvider, type DeviceLocationProvider } from "./browser-location-provider";
import type { DeviceLocation, EffectiveLocation, HouseholdLocation, LocationDraft, LocationMode } from "./types";
import { createClient } from "../supabase/client";
import { isSupabaseConfigured } from "../supabase/env";
import { notifyContextChanged } from "../context/client-events";

const householdLocationKey = "household-manager:household-location";

type GeocodedPlace = Pick<HouseholdLocation, "latitude" | "longitude" | "timezone">;

export interface LocationService {
  getHouseholdLocation(): Promise<HouseholdLocation | null>;
  saveHouseholdLocation(draft: LocationDraft): Promise<HouseholdLocation>;
  getCurrentDeviceLocation(): Promise<DeviceLocation>;
  getEffectiveLocation(mode: LocationMode): Promise<EffectiveLocation>;
}

export class LocalLocationService implements LocationService {
  constructor(private readonly deviceProvider: DeviceLocationProvider = new BrowserLocationProvider()) {}

  async getHouseholdLocation(): Promise<HouseholdLocation | null> {
    const stored = window.localStorage.getItem(householdLocationKey);
    return stored ? (JSON.parse(stored) as HouseholdLocation) : null;
  }

  async saveHouseholdLocation(draft: LocationDraft): Promise<HouseholdLocation> {
    const geocoded = await geocodeLocation(draft);
    const now = new Date().toISOString();
    const existing = await this.getHouseholdLocation();
    const location: HouseholdLocation = {
      id: existing?.id ?? crypto.randomUUID(),
      householdId: "local-household",
      ...draft,
      ...geocoded,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };
    window.localStorage.setItem(householdLocationKey, JSON.stringify(location));
    return location;
  }

  getCurrentDeviceLocation(): Promise<DeviceLocation> {
    return this.deviceProvider.getCurrentLocation();
  }

  async getEffectiveLocation(mode: LocationMode): Promise<EffectiveLocation> {
    if (mode === "CURRENT_DEVICE") {
      const device = await this.getCurrentDeviceLocation();
      return { ...device, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, label: "Current device", source: "CURRENT_DEVICE" };
    }
    const household = await this.getHouseholdLocation();
    if (!household) throw new Error("Set a household location before using household weather.");
    return { ...household, source: "HOUSEHOLD" };
  }
}

class SelfHostedLocationService implements LocationService {
  constructor(private readonly deviceProvider: DeviceLocationProvider = new BrowserLocationProvider()) {}

  private async request<T>(method: "GET" | "POST", body?: Record<string, unknown>): Promise<T> {
    const response = await fetch(method === "GET" ? "/api/household?resource=location" : "/api/household", { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const result = await response.json() as T & { error?: string };
    if (!response.ok) throw new Error(result.error ?? "Unable to save household location.");
    return result;
  }

  private map(data: Record<string, unknown>): HouseholdLocation {
    return { id: data.id as string, householdId: "self-hosted-household", label: data.label as string, city: data.city as string, state: data.state as string, postalCode: data.postal_code as string, country: data.country as string, latitude: Number(data.latitude), longitude: Number(data.longitude), timezone: data.timezone as string, createdAt: data.created_at as string, updatedAt: data.updated_at as string };
  }

  async getHouseholdLocation(): Promise<HouseholdLocation | null> {
    const data = await this.request<Record<string, unknown> | null>("GET");
    return data ? this.map(data) : null;
  }

  async saveHouseholdLocation(draft: LocationDraft): Promise<HouseholdLocation> {
    const geocoded = await geocodeLocation(draft);
    return this.map(await this.request<Record<string, unknown>>("POST", { resource: "location", ...draft, ...geocoded }));
  }

  getCurrentDeviceLocation(): Promise<DeviceLocation> { return this.deviceProvider.getCurrentLocation(); }

  async getEffectiveLocation(mode: LocationMode): Promise<EffectiveLocation> {
    if (mode === "CURRENT_DEVICE") { const device = await this.getCurrentDeviceLocation(); return { ...device, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, label: "Current device", source: "CURRENT_DEVICE" }; }
    const household = await this.getHouseholdLocation();
    if (!household) throw new Error("Set a household location before using household weather.");
    return { ...household, source: "HOUSEHOLD" };
  }
}

class SupabaseLocationService implements LocationService {
  constructor(private readonly deviceProvider: DeviceLocationProvider = new BrowserLocationProvider()) {}

  private async householdId(): Promise<string> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sign in to save household data.");
    const { data, error } = await supabase.from("household_members").select("household_id").eq("user_id", user.id).maybeSingle();
    if (error || !data) throw new Error("No household is associated with this account yet.");
    return data.household_id as string;
  }

  async getHouseholdLocation(): Promise<HouseholdLocation | null> {
    const householdId = await this.householdId();
    const { data, error } = await createClient().from("household_locations").select("*").eq("household_id", householdId).maybeSingle();
    if (error) throw new Error("Unable to load the household location.");
    if (!data) return null;
    return { id: data.id, householdId: data.household_id, label: data.label, city: data.city, state: data.state, postalCode: data.postal_code ?? "", country: data.country, latitude: data.latitude, longitude: data.longitude, timezone: data.timezone, createdAt: data.created_at, updatedAt: data.updated_at };
  }

  async saveHouseholdLocation(draft: LocationDraft): Promise<HouseholdLocation> {
    const householdId = await this.householdId();
    const geocoded = await geocodeLocation(draft);
    const { data, error } = await createClient().from("household_locations").upsert({ household_id: householdId, label: draft.label, city: draft.city, state: draft.state, postal_code: draft.postalCode || null, country: draft.country, latitude: geocoded.latitude, longitude: geocoded.longitude, timezone: geocoded.timezone, updated_at: new Date().toISOString() }, { onConflict: "household_id" }).select().single();
    if (error) throw new Error("Unable to save the household location.");
    notifyContextChanged();
    return { id: data.id, householdId: data.household_id, label: data.label, city: data.city, state: data.state, postalCode: data.postal_code ?? "", country: data.country, latitude: data.latitude, longitude: data.longitude, timezone: data.timezone, createdAt: data.created_at, updatedAt: data.updated_at };
  }

  getCurrentDeviceLocation(): Promise<DeviceLocation> { return this.deviceProvider.getCurrentLocation(); }

  async getEffectiveLocation(mode: LocationMode): Promise<EffectiveLocation> {
    if (mode === "CURRENT_DEVICE") {
      const device = await this.getCurrentDeviceLocation();
      return { ...device, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, label: "Current device", source: "CURRENT_DEVICE" };
    }
    const household = await this.getHouseholdLocation();
    if (!household) throw new Error("Set a household location before using household weather.");
    return { ...household, source: "HOUSEHOLD" };
  }
}

export function createLocationService(): LocationService {
  const storage = process.env.NEXT_PUBLIC_HOUSEHOLD_STORAGE;
  if (storage === "local") return new LocalLocationService();
  if (storage === "supabase" && isSupabaseConfigured()) return new SupabaseLocationService();
  return new SelfHostedLocationService();
}

async function geocodeLocation(draft: LocationDraft): Promise<GeocodedPlace> {
  const query = new URLSearchParams(draft);
  const response = await fetch(`/api/geocode?${query}`);
  const result = (await response.json()) as GeocodedPlace & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "We could not find that location. Check the city, state, and postal code.");
  return result;
}
