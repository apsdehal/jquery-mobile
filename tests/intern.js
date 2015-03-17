define({
  proxyPort: 9000,
  proxyUrl: 'http://localhost:9000/',
  capabilities: {},
  environments: [
    { browserName: 'chrome' },
    { browserName: 'internet explorer', version: [ '11', '10', '9' ] },
    { browserName: 'firefox', version: '34' }
  ],
  maxConcurrency: 2,
  tunnel: 'BrowserStackTunnel',
  loader: {
    packages: [
      { name: 'tests', location: 'tests' }
    ]
  },
  suites: [
    'tests/unit/all'
  ],
  functionalSuites: [],
  excludeInstrumentation: /^(?:node_modules|tests)\//
});