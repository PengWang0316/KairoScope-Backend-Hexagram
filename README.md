# KairoScope Backend Journal Service

One of the microservice for KairoScope. This service is in charge of hexagram's operations.

[[![Build Status](https://travis-ci.org/PengWang0316/KairoScope-Backend-Hexagram.svg?branch=master)](https://travis-ci.org/PengWang0316/KairoScope-Backend-Hexagram) [![Coverage Status](https://coveralls.io/repos/github/PengWang0316/KairoScope-Backend-Hexagram/badge.svg?branch=master)](https://coveralls.io/github/PengWang0316/KairoScope-Backend-Hexagram?branch=master)

## Functions are hosting on AWS lambda function

### Some explainations

- The wrapper middleware wrappers sample-logging and function-shield for all of the function who uses wrapper.js to wrapper its handler.
- The flush-metrics middleware will be in charge of flush the metrics as batch for a function. (If the function definds async_metrics: true in the serverless.yml, this middleware does not have to apply due to the metrics will be sent asynchronously)
- log.js in the libs folder can be used to perform logs with different levels (debug, info, warn, error).
- cloudwatch.js in the libs folder has several methods to collect metrics for a function.

### Test :tada: :tada:

Test code is under the __tests__ folder
- Unit test: npm run unitTest
- Unit test with coverage report: npm run unitTestCoverage
- Integration test: npm run integrationTest
- Acceptance test: npm run acceptanceTest

### Living website
https://kairoscope.resonancepath.com
