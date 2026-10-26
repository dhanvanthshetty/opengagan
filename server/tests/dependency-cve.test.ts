describe('dependency security fixes', () => {
  test('body-parser and zod are pinned to patched versions', () => {
    const bodyParserPkg = require('body-parser/package.json')
    const zodPkg = require('zod/package.json')

    // GHSA-27r3-jxmh-p828: body-parser < 2.4.0 is vulnerable.
    expect(bodyParserPkg.version).toBe('2.4.0')
    // GHSA-mrhx-c7xc-m3w5: zod < 4.6.6 is vulnerable.
    expect(zodPkg.version).toBe('4.6.6')
  })
})
