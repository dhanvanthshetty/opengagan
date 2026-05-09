export function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface LatLon { lat: number; lng: number }

export function buildGreatCirclePath(
  origin: LatLon,
  dest: LatLon,
  segments = 64
): [number, number][] {
  const points: [number, number][] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    points.push([
      origin.lng + (dest.lng - origin.lng) * t,
      origin.lat + (dest.lat - origin.lat) * t,
    ])
  }
  return points
}

export function buildTimestamps(path: [number, number][]): number[] {
  return path.map((_, i) => Math.round((i / (path.length - 1)) * 1000))
}
