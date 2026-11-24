import fs from 'fs'
import path from 'path'
import { io } from 'socket.io-client'

const repoRoot = path.resolve(__dirname, '../..')

function readJson(relativePath: string): any {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
}

function versionAtLeast(actual: string, minimum: string): boolean {
  const a = actual.split('.').map(Number)
  const b = minimum.split('.').map(Number)
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const left = a[i] ?? 0
    const right = b[i] ?? 0
    if (left !== right) return left > right
  }
  return true
}

describe('socket.io-client dependency', () => {
  test('the app manifest and lockfile resolve socket.io-client >= 4.8.4', () => {
    const manifest = readJson('app/package.json')
    const lockfile = readJson('package-lock.json')

    const spec: string = manifest.dependencies['socket.io-client']
    const pinned = spec.replace(/^[^\d]*/, '')
    expect(versionAtLeast(pinned, '4.8.4')).toBe(true)

    const resolved: string =
      lockfile.packages['node_modules/socket.io-client'].version
    expect(versionAtLeast(resolved, '4.8.4')).toBe(true)
  })

  test('the client still accepts the websocket and polling transports', () => {
    const socket = io('http://localhost:4000', {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    })

    expect(typeof socket.on).toBe('function')
    expect(typeof socket.emit).toBe('function')
    expect(socket.io.opts.transports).toEqual(['websocket', 'polling'])

    socket.disconnect()
  })
})
