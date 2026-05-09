// AircraftLayer.tsx
// Factory function called by react-globe.gl objectThreeObject prop
// Returns a THREE.Object3D shaped like an aircraft, oriented to its heading

import * as THREE from 'three'
import type { AircraftState } from '../../types'

// Material cache to avoid creating new materials per frame
const _matCache: Record<string, THREE.MeshStandardMaterial> = {}

function getMat(key: string, color: number, emissive: number, emissiveIntensity: number) {
  if (!_matCache[key]) {
    _matCache[key] = new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity,
      metalness: 0.5,
      roughness: 0.45,
    })
  }
  return _matCache[key]
}

export function createAircraftObject(stateRaw: unknown): THREE.Object3D {
  const state = stateRaw as AircraftState
  const isGround = state.onGround

  const mat = isGround
    ? getMat('ground', 0x94a3b8, 0x334155, 0.2)
    : getMat('air', 0x3b82f6, 0x1e40af, 0.55)

  const group = new THREE.Group()

  // --- Fuselage: elongated box along Z (nose=+Z, tail=-Z) ---
  const fuselage = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 2.4), mat)
  group.add(fuselage)

  // --- Nose cone: small tapered box at front ---
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.5, 6), mat)
  nose.rotation.x = Math.PI / 2   // cone tip → +Z
  nose.position.z = 1.45
  group.add(nose)

  // --- Main wings: wide flat box slightly forward of centre ---
  const wings = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 0.72), mat)
  wings.position.z = 0.2
  group.add(wings)

  // --- Horizontal tail stabilisers ---
  const tailH = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.07, 0.38), mat)
  tailH.position.z = -0.98
  group.add(tailH)

  // --- Vertical tail fin ---
  const tailV = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.58, 0.42), mat)
  tailV.position.set(0, 0.33, -0.98)
  group.add(tailV)

  // The plane body lies in the XZ plane (wings=X, fuselage=Z).
  // react-globe.gl places objects with local +Y pointing outward from the globe,
  // so the XZ plane is already the surface-tangent plane — no extra tilt needed.

  // Rotate the group so the nose faces the flight heading.
  // heading 0°=North, 90°=East; rotation around outward Y-axis.
  const headingRad = THREE.MathUtils.degToRad(state.trueTrack ?? 0)
  group.rotation.y = headingRad

  group.scale.setScalar(isGround ? 0.48 : 0.7)

  return group
}
