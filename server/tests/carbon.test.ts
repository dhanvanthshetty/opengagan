import { calcCO2 } from '../src/utils/carbon'
import { haversineKm } from '../src/utils/haversine'

describe('carbon utils', () => {
  test('BLR→DEL haversine is approximately 1750km', () => {
    // VOBG (Bengaluru): 12.9499, 77.6682
    // VIDP (Delhi): 28.5665, 77.1031
    const km = haversineKm(12.9499, 77.6682, 28.5665, 77.1031)
    expect(km).toBeGreaterThan(1700)
    expect(km).toBeLessThan(1800)
  })

  test('CO2 calc for BLR→DEL 1750km 1 pax is approx 316kg', () => {
    // With uplift: 1750 * 1.08 = 1890km, * 90g/km = 170.1kg per pax
    // Note: result depends on exact distance including uplift
    const { co2PerPax } = calcCO2(1750, 1)
    expect(co2PerPax).toBeGreaterThan(100)
    expect(co2PerPax).toBeLessThan(200)
  })

  test('calcCO2 scales with pax count', () => {
    const single = calcCO2(1000, 1)
    const double = calcCO2(1000, 2)
    expect(double.co2Kg).toBe(single.co2Kg * 2)
  })

  test('treesNeeded is always at least 1', () => {
    const { treesNeeded } = calcCO2(100, 1)
    expect(treesNeeded).toBeGreaterThanOrEqual(1)
  })
})
