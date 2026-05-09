const CO2_G_PER_RPK = 90
const ROUTING_UPLIFT = 1.08
const TREE_ABSORB_KG_PER_YEAR = 21
const DRIVING_CO2_KG_PER_KM = 0.15

export function calcCO2(distanceKm: number, pax = 1) {
  const adjustedKm = distanceKm * ROUTING_UPLIFT
  const co2PerPax = adjustedKm * (CO2_G_PER_RPK / 1000)
  const co2Kg = co2PerPax * pax
  return {
    distanceKm: Math.round(distanceKm),
    co2Kg: Math.round(co2Kg),
    co2PerPax: Math.round(co2PerPax),
    treesNeeded: Math.ceil(co2Kg / TREE_ABSORB_KG_PER_YEAR),
    drivingEquivalentKm: Math.round(co2Kg / DRIVING_CO2_KG_PER_KM),
  }
}
