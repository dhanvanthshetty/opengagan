import { INDIA_BBOX } from '../../../shared/src/constants/india'

export const INDIA_BOX = {
  lamin: INDIA_BBOX.latMin,
  lomin: INDIA_BBOX.lonMin,
  lamax: INDIA_BBOX.latMax,
  lomax: INDIA_BBOX.lonMax,
}

export function estimateCreditCost(lamin: number, lomin: number, lamax: number, lomax: number): number {
  const area = (lamax - lamin) * (lomax - lomin)
  if (area < 1600) return 1
  if (area < 25600) return 2
  if (area < 102400) return 3
  return 4
}
