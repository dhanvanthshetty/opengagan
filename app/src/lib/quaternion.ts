import * as THREE from 'three'

export function headingToQuaternion(headingDeg: number): THREE.Quaternion {
  const headingRad = THREE.MathUtils.degToRad(headingDeg)
  return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -headingRad)
}

export function applyHeading(obj: THREE.Object3D, headingDeg: number): THREE.Object3D {
  obj.quaternion.copy(headingToQuaternion(headingDeg))
  return obj
}
