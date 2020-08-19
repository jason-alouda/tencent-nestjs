# Tencent Cloud SDK

[![npm](https://img.shields.io/npm/v/tencent-cloud-sdk)](http://www.npmtrends.com/tencent-cloud-sdk)
[![NPM downloads](http://img.shields.io/npm/dm/tencent-cloud-sdk.svg?style=flat-square)](http://www.npmtrends.com/tencent-cloud-sdk)
[![Build Status](https://travis-ci.com/serverless-tencent/tencent-cloud-sdk.svg?branch=master)](https://travis-ci.com/serverless-tencent/tencent-cloud-sdk)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

## How to using Cloud API?

```
const { apigw } = require('../lib/index')

const secret = {
  SecretId: '',
  SecretKey: ''
}

const apigwClient = new apigw(secret)

const data = {
    Action: 'DescribeServicesStatus'
}

apigwClient.request(data)

```

Refer to: https://cloud.tencent.com/document/api

## How to use COS?

```
const { cos } = require('../lib/index')

const secret = {
  SecretId: '',
  SecretKey: ''
}

const cosClient = new cos(secret)

cosClient.getService(function(err, data) {
    console.log(err || data);
});
```

Refer to: https://cloud.tencent.com/document/product/436/8629

## Monitor for SCF

```
const { slsMonitor } = require('./src/index')

const slsClient = new slsMonitor(secret)

const rangeTime = {
    rangeStart: 'begin Time string rfc3339 format', // 2018-09-22T19:51:23+08:00
    rangeEnd: 'end Time string rfc3339 format' // 2018-09-22T19:51:23+08:00
}
const period = 3600
const ret = await slsClient.getScfMetrics('ap-guangzhou', rangeTime, period, 'funcName', 'default', '$latest')
console.log(ret)
```

Refer to: https://cloud.tencent.com/document/product/248/31649

## Development

All `git commit` mesage must follow below syntax:

```bash
type(scope?): subject  #scope is optional
```

support type：

- **feat**: add new feature
- **fix**: fix bug or patch feature
- **ci**: CI
- **chore**: modify config, nothing to do with production code
- **docs**: create or modifiy documents
- **refactor**: refactor project
- **revert**: revert
- **test**: test

Most of time, we just use `feat` and `fix`.

## License

Copyright (c) 2019-present Tencent Cloud, Inc.
