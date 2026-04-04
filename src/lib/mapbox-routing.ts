import type { RouteAlternative, RouteEstimate, SavedRoute } from "@/src/lib/types";

const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export function hasMapboxRouting() {
  return Boolean(mapboxToken);
}

function summarizeAlternative(extraMinutes: number) {
  if (extraMinutes <= 2) {
    return "Nearly as fast as the main route and useful if you want a cleaner-feeling option.";
  }

  if (extraMinutes <= 6) {
    return "Slightly slower than the fastest path, but still realistic if congestion spreads.";
  }

  return "Noticeably slower than the main route right now and best used only if conditions deteriorate.";
}

async function geocode(query: string) {
  if (!mapboxToken) {
    return null;
  }

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?limit=1&access_token=${mapboxToken}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    features?: Array<{ center?: [number, number] }>;
  };
  return payload.features?.[0]?.center ?? null;
}

export async function getRealRouteGeometry(origin: string, destination: string) {
  if (!mapboxToken) {
    return null;
  }

  const [originCoordinate, destinationCoordinate] = await Promise.all([
    geocode(origin),
    geocode(destination),
  ]);

  if (!originCoordinate || !destinationCoordinate) {
    return null;
  }

  const response = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoordinate[0]},${originCoordinate[1]};${destinationCoordinate[0]},${destinationCoordinate[1]}?alternatives=true&geometries=geojson&overview=full&steps=false&access_token=${mapboxToken}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    routes?: Array<{
      duration?: number;
      geometry?: { coordinates?: [number, number][] };
    }>;
  };
  const route = payload.routes?.[0];
  if (!route?.geometry?.coordinates?.length || !route.duration) {
    return null;
  }

  const fastestDurationMinutes = Math.max(1, Math.round(route.duration / 60));
  const alternatives: RouteAlternative[] = (payload.routes ?? [])
    .slice(1, 4)
    .map((candidate, index) => {
      const durationMinutes = Math.max(1, Math.round((candidate.duration ?? route.duration ?? 60) / 60));
      const normalTimeMinutes = Math.max(1, Math.round(durationMinutes * 0.82));
      const delayMinutes = Math.max(0, durationMinutes - normalTimeMinutes);

      return {
        id: `alt-${index + 1}`,
        label: `Alternate ${index + 1}`,
        currentTimeMinutes: durationMinutes,
        normalTimeMinutes,
        delayMinutes,
        routeGeometry: candidate.geometry?.coordinates ?? [],
        originCoordinate,
        destinationCoordinate,
        provider: "mapbox" as const,
        summary: summarizeAlternative(durationMinutes - fastestDurationMinutes),
      };
    })
    .filter((candidate) => candidate.routeGeometry.length > 1);

  return {
    originCoordinate,
    destinationCoordinate,
    routeGeometry: route.geometry.coordinates,
    durationMinutes: fastestDurationMinutes,
    alternatives,
  };
}

export async function hydrateRoutesWithRealGeometry(savedRoutes: SavedRoute[]) {
  if (!hasMapboxRouting() || !savedRoutes.length) {
    return { routes: savedRoutes, changed: false };
  }

  let changed = false;

  const routes = await Promise.all(
    savedRoutes.map(async (route) => {
      if (route.routeGeometry?.length && route.originCoordinate && route.destinationCoordinate) {
        return route;
      }

      const geometry = await getRealRouteGeometry(route.origin, route.destination);
      if (!geometry) {
        return route;
      }

      changed = true;
      return {
        ...route,
        routeGeometry: geometry.routeGeometry,
        originCoordinate: geometry.originCoordinate,
        destinationCoordinate: geometry.destinationCoordinate,
      };
    }),
  );

  return { routes, changed };
}

export function mergeEstimateWithRealGeometry(
  estimate: RouteEstimate,
  geometry: {
    originCoordinate: [number, number];
    destinationCoordinate: [number, number];
    routeGeometry: [number, number][];
    durationMinutes: number;
    alternatives?: RouteAlternative[];
  } | null,
): RouteEstimate {
  if (!geometry) {
    return estimate;
  }

  const normalTimeMinutes = Math.max(1, Math.round(geometry.durationMinutes * 0.82));
  const delayMinutes = Math.max(0, geometry.durationMinutes - normalTimeMinutes);

  return {
    ...estimate,
    currentTimeMinutes: geometry.durationMinutes,
    normalTimeMinutes,
    delayMinutes,
    status: delayMinutes > 10 ? "heavy" : delayMinutes > 4 ? "moderate" : "light",
    routeGeometry: geometry.routeGeometry,
    originCoordinate: geometry.originCoordinate,
    destinationCoordinate: geometry.destinationCoordinate,
    usedRealGeometry: true,
    alternativeRoutes: geometry.alternatives ?? [],
  };
}
