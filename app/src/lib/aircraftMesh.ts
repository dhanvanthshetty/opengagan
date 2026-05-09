type Vec2 = [number, number]

function polygon(
  pos: number[], nrm: number[], idx: number[],
  base: number, verts: Vec2[],
): number {
  for (const [x, y] of verts) {
    pos.push(x, y, 0)
    nrm.push(0, 0, 1)
  }
  for (let i = 1; i < verts.length - 1; i++) {
    idx.push(base, base + i, base + i + 1)
  }
  return base + verts.length
}

export function buildAircraftMesh() {
  const pos: number[] = []
  const nrm: number[] = []
  const idx: number[] = []
  let b = 0

  b = polygon(pos, nrm, idx, b, [
    [ 0.000,  0.92],
    [ 0.048,  0.80],
    [ 0.085,  0.60],
    [ 0.105,  0.30],
    [ 0.100,  0.00],
    [ 0.088, -0.25],
    [ 0.068, -0.50],
    [ 0.042, -0.66],
    [ 0.000, -0.78],
    [-0.042, -0.66],
    [-0.068, -0.50],
    [-0.088, -0.25],
    [-0.100,  0.00],
    [-0.105,  0.30],
    [-0.085,  0.60],
    [-0.048,  0.80],
  ])

  b = polygon(pos, nrm, idx, b, [
    [-0.105,  0.18],
    [-0.105, -0.06],
    [-0.90,  -0.28],
    [-0.96,   0.02],
  ])

  b = polygon(pos, nrm, idx, b, [
    [ 0.105,  0.18],
    [ 0.96,   0.02],
    [ 0.90,  -0.28],
    [ 0.105, -0.06],
  ])

  b = polygon(pos, nrm, idx, b, [
    [-0.96,  0.02],
    [-0.90, -0.28],
    [-1.14, -0.12],
  ])

  b = polygon(pos, nrm, idx, b, [
    [ 0.96,  0.02],
    [ 1.14, -0.12],
    [ 0.90, -0.28],
  ])

  b = polygon(pos, nrm, idx, b, [
    [-0.36,  0.16],
    [-0.34,  0.20],
    [-0.54,  0.08],
    [-0.60, -0.06],
    [-0.58, -0.10],
    [-0.38, -0.02],
  ])

  b = polygon(pos, nrm, idx, b, [
    [ 0.36,  0.16],
    [ 0.38, -0.02],
    [ 0.58, -0.10],
    [ 0.60, -0.06],
    [ 0.54,  0.08],
    [ 0.34,  0.20],
  ])

  b = polygon(pos, nrm, idx, b, [
    [-0.096, -0.58],
    [-0.096, -0.70],
    [-0.50,  -0.76],
    [-0.52,  -0.64],
  ])

  b = polygon(pos, nrm, idx, b, [
    [ 0.096, -0.58],
    [ 0.52,  -0.64],
    [ 0.50,  -0.76],
    [ 0.096, -0.70],
  ])

  b = polygon(pos, nrm, idx, b, [
    [ 0.000, -0.56],
    [ 0.028, -0.60],
    [ 0.022, -0.74],
    [ 0.000, -0.78],
    [-0.022, -0.74],
    [-0.028, -0.60],
  ])

  void b

  return {
    attributes: {
      positions: { value: new Float32Array(pos), size: 3 },
      normals:   { value: new Float32Array(nrm), size: 3 },
    },
    indices: { value: new Uint16Array(idx), size: 1 },
  }
}

export const AIRCRAFT_MESH = buildAircraftMesh()
