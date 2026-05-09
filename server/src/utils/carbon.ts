import { DGCA } from '../../../shared/src/constants/dgca'

const TREE_ABSORB_KG_PER_YEAR = 21
const DRIVING_KM_CO2_KG = 0.15

export function calcCO2(distanceKm: number, pax: number) {
  const co2PerPax = distanceKm * (DGCA.CO2_G_PER_RPK / 1000)
  const co2Kg = co2PerPax * pax
  const treesNeeded = Math.ceil(co2Kg / TREE_ABSORB_KG_PER_YEAR)
  const drivingEquivalentKm = Math.round(co2Kg / DRIVING_KM_CO2_KG)
  return { co2Kg: Math.round(co2Kg), co2PerPax: Math.round(co2PerPax), treesNeeded, drivingEquivalentKm }
}
