import { DGCA } from '../../../shared/src/constants/dgca'

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

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function haversineWithUplift(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  return haversineKm(lat1, lon1, lat2, lon2) * DGCA.ROUTING_UPLIFT
}
