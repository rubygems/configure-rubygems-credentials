module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': [
      '@swc/jest',
      {
        jsc: {parser: {syntax: 'typescript'}, target: 'es2024'},
        module: {type: 'es6'}
      }
    ]
  },
  verbose: true,
  setupFiles: ['./jest.setup.js']
}
