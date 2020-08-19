const assign = require('object-assign')
const qs = require('querystring')
const dotQs = require('dot-qs')
const request = require('../lib/request/index')
const crypto = require('crypto')
const cos = require('../lib/cos/cos')
const _ = require('lodash')

var defaults = {
  signatureMethod: 'HmacSHA1',
  method: 'GET',
  Region: 'ap-guangzhou',
  protocol: 'https'
}

class TencentCloudClient {
  constructor(credentials = {}, service = {}, options = {}) {
    this.credentials = credentials
    this.service = service
    this.options = options
  }

  async cloudApiGenerateQueryString(data) {
    var param = assign(
      {
        Region: this.options.region || defaults.Region,
        SecretId: this.credentials.SecretId,
        Timestamp: Math.round(Date.now() / 1000),
        Nonce: Math.round(Math.random() * 65535),
        RequestClient: 'ServerlessFramework'
      },
      data
    )
    const token = this.credentials.token || this.credentials.Token
    if (token) {
      param.Token = token
    }
    if (this.credentials.token) {
      param.token = this.credentials.token
    }
    param.SignatureMethod = defaults.signatureMethod
    param = dotQs.flatten(param)
    const { host, path } = this.service
    var keys = Object.keys(param)
    var qstr = ''
    keys.sort()
    keys.forEach(function(key) {
      var val = param[key]
      if (key === '') {
        return
      }
      if (val === undefined || val === null || (typeof val === 'number' && isNaN(val))) {
        val = ''
      }
      qstr += '&' + (key.indexOf('_') ? key.replace(/_/g, '.') : key) + '=' + val
    })

    qstr = qstr.slice(1)

    const hmac = crypto.createHmac('sha1', this.credentials.SecretKey || '')
    param.Signature = hmac
      .update(new Buffer.from(defaults.method.toUpperCase() + host + path + '?' + qstr, 'utf8'))
      .digest('base64')

    return qs.stringify(param)
  }

  async doCloudApiRequest(data) {
    const httpBody = await this.cloudApiGenerateQueryString(data)

    // const options = {
    //   hostname: this.service.host,
    //   path: this.service.path + '?' + httpBody
    // }
    // return new Promise(function(resolve, reject) {
    //   const req = https.get(options, function(res) {
    //     res.setEncoding('utf8')
    //     res.on('data', function(chunk) {
    //       resolve(JSON.parse(chunk))
    //     })
    //   })
    //   req.on('error', function(e) {
    //     reject(e.message)
    //   })
    //   // req.write(httpBody)
    //   req.end()
    // })

    const url = `https://${this.service.host}${this.service.path}?${httpBody}`
    return new Promise(function(resolve, rejecte) {
      request(
        {
          url: url,
          method: 'GET'
        },
        function(error, response, body) {
          if (!error && response.statusCode == 200) {
            resolve(JSON.parse(body))
          }
          rejecte(error)
        }
      )
    })
  }
}

class ScfClient {
  constructor(credentials = {}) {
    this.credentials = credentials
  }
  async request(data) {
    return await new TencentCloudClient(this.credentials, {
      host: 'scf.tencentcloudapi.com',
      path: '/'
    }).doCloudApiRequest(data)
  }
}

class TagClient {
  constructor(credentials = {}) {
    this.credentials = credentials
  }
  async request(data) {
    return await new TencentCloudClient(this.credentials, {
      host: 'tag.tencentcloudapi.com',
      path: '/'
    }).doCloudApiRequest(data)
  }
}

class TcbClient {
  constructor(credentials = {}) {
    this.credentials = credentials
  }
  async request(data) {
    return await new TencentCloudClient(this.credentials, {
      host: 'tcb.tencentcloudapi.com',
      path: '/'
    }).doCloudApiRequest(data)
  }
}

class ApigwClient {
  constructor(credentials = {}) {
    this.credentials = credentials
  }
  async request(data) {
    return await new TencentCloudClient(this.credentials, {
      host: 'apigateway.api.qcloud.com',
      path: '/v2/index.php'
    }).doCloudApiRequest(data)
  }
}

class CamClient {
  constructor(credentials = {}) {
    this.credentials = credentials
  }
  async request(data) {
    return await new TencentCloudClient(this.credentials, {
      host: 'cam.tencentcloudapi.com',
      path: '/'
    }).doCloudApiRequest(data)
  }
}

class CamV2Client {
  constructor(credentials = {}) {
    this.credentials = credentials
  }
  async request(data) {
    return await new TencentCloudClient(this.credentials, {
      host: 'cam.api.qcloud.com',
      path: '/v2/index.php'
    }).doCloudApiRequest(data)
  }
}

class CnsClient {
  constructor(credentials = {}) {
    this.credentials = credentials
  }
  async request(data) {
    return await new TencentCloudClient(this.credentials, {
      host: 'cns.api.qcloud.com',
      path: '/v2/index.php'
    }).doCloudApiRequest(data)
  }
}

class DomainClient {
  constructor(credentials = {}) {
    this.credentials = credentials
  }
  async request(data) {
    return await new TencentCloudClient(this.credentials, {
      host: 'domain.tencentcloudapi.com',
      path: '/'
    }).doCloudApiRequest(data)
  }
}

class CosClient extends cos {}

class SlsMonitor {
  constructor(credentials = {}) {
    this.credentials = credentials
  }

  async request(data) {
    return await new TencentCloudClient(this.credentials, {
      host: 'monitor.tencentcloudapi.com',
      path: '/'
    }).doCloudApiRequest(data)
  }

  static sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, ms)
    })
  }

  mergeCustomByPeriod(datas, period) {
    const len = datas.length
    const newValues = []

    let val = 0
    for (var i = 0; i < len; i++) {
      const item = datas[i]
      if (i > 0 && !((i + 1) % period)) {
        let v = val + item.Value
        if (!(~~v == v)) {
          v = parseFloat(v.toFixed(2), 10)
        }
        newValues.push({
          Timestamp: datas[i + 1 - period].Timestamp,
          Value: v
        })
        val = 0
      } else {
        val += item.Value
      }
    }

    if (len % period) {
      newValues.push({
        Timestamp: datas[len - (len % period)].Timestamp,
        Value: val
      })
    }
    return newValues
  }

  mergeCustom5Min(datas) {
    return this.mergeCustomByPeriod(datas, 5)
  }

  mergeCustom5Min2Hours(datas) {
    return this.mergeCustomByPeriod(datas, 12)
  }

  mergeCustomHours2Day(datas) {
    return this.mergeCustomByPeriod(datas, 24)
  }

  mergeCustomHours(datas) {
    return this.mergeCustom5Min2Hours(this.mergeCustom5Min(datas))
  }

  mergeCustomDay(datas) {
    return this.mergeCustomHours2Day(this.mergeCustom5Min2Hours(this.mergeCustom5Min(datas)))
  }

  percentile(array, k) {
    const len = array.length
    if (len == 0) {
      return 0
    }

    if (len == 1) {
      return array[0]
    }

    const ret = (len - 1) * (k / 100)
    const i = Math.floor(ret)
    const j = ret % 1

    const val = (1 - j) * array[i] + j * array[i + 1]
    if (!(~~val == val)) {
      return parseFloat(val.toFixed(3), 10)
    }
    return val
  }

  aggrDurationP(responses, srcPeriod, dstPeriod) {
    if (srcPeriod == dstPeriod || srcPeriod > dstPeriod) {
      return
    }

    const threshold = dstPeriod / srcPeriod
    const len = responses.length
    const times = []
    for (var i = 0; i < len; i++) {
      const result = responses[i]
      if (result.Response.Error) {
        console.log(JSON.stringify(result.Response.Error), result.Response.RequestId)
        continue
      }

      if (result.Response.MetricName != 'Duration') {
        continue
      }

      const tlen = result.Response.DataPoints[0].Timestamps.length
      const values = result.Response.DataPoints[0].Values
      let total = []
      if (tlen == 0) {
        return
      }

      const p95 = []
      const p50 = []
      for (var n = 0; n < tlen; n++) {
        if (n > 0 && !((n + 1) % threshold)) {
          total.push(values[n])
          total.sort((v1, v2) => {
            return v1 - v2
          })
          times.push(result.Response.DataPoints[0].Timestamps[n + 1 - threshold])
          p95.push(this.percentile(total, 95))
          p50.push(this.percentile(total, 50))
          total = []
        } else {
          total.push(values[n])
        }
      }
      if (total.length > 0) {
        p95.push(this.percentile(total, 95))
        p50.push(this.percentile(total, 50))
        times.push(result.Response.DataPoints[0].Timestamps[tlen - (tlen % threshold)])
      }

      result.Response.MetricName = 'Duration-P50'
      result.Response.DataPoints[0].Timestamps = times
      result.Response.DataPoints[0].Values = p50
      result.Response.Period = dstPeriod

      // p95
      const p95Object = _.cloneDeep(result)
      result.Response.MetricName = 'Duration-P95'
      result.Response.DataPoints[0].Timestamps = times
      result.Response.DataPoints[0].Values = p95
      result.Response.Period = dstPeriod

      responses.push(p95Object)
    }
  }

  aggrLatencyP(datas, srcPeriod, dstPeriod) {
    if (srcPeriod == dstPeriod || srcPeriod > dstPeriod) {
      return
    }

    const len = datas.length
    const threshold = dstPeriod / srcPeriod

    let vals = []
    let timestamp = 0

    const times = []
    const p95 = []
    const p50 = []
    for (var n = 0; n < len; n++) {
      const item = datas[n]
      if (n > 0 && !((n + 1) % threshold)) {
        vals.push(item.Value)
        vals.sort((v1, v2) => {
          return v1 - v2
        })
        times.push(timestamp)
        p95.push(this.percentile(vals, 95))
        p50.push(this.percentile(vals, 50))
        timestamp = 0
        vals = []
      } else {
        vals.push(item.Value)
        if (timestamp == 0) {
          timestamp = item.Timestamp
        }
      }
    }

    return {
      Timestamps: times,
      P95: p95,
      P50: p50
    }
  }

  aggrCustomDatas(responses, period, metricAttributeHash) {
    const len = responses.length

    let latencyIdx = -1
    let latencyDatas = null
    for (let i = 0; i < len; i++) {
      const response = responses[i]
      if (!response.Response.Data || response.Response.Data.length == 0) {
        continue
      }

      const attribute = metricAttributeHash[response.Response.Data[0].AttributeId]
      let newValues = response.Response.Data[0].Values
      if (attribute.AttributeName == 'latency') {
        responses[i].Response.Data[0].AttributeName = 'latency'
        latencyIdx = i
        latencyDatas = this.aggrLatencyP(newValues, 60, period)
        continue
      }

      switch (period) {
        case 300:
          newValues = this.mergeCustom5Min(response.Response.Data[0].Values)
          break
        case 3600:
          newValues = this.mergeCustomHours(response.Response.Data[0].Values)
          break
        case 86400:
          newValues = this.mergeCustomDay(response.Response.Data[0].Values)
          break
      }
      response.Response.Data[0].Values = newValues
      response.Response.Data[0].Period = period
      response.Response.Data[0].AttributeName = attribute.AttributeName
    }

    if (!(latencyIdx != -1 && latencyDatas != null)) {
      return
    }

    const newP95Vals = []
    const newP50Vals = []
    const tlen = latencyDatas.Timestamps.length
    for (let n = 0; n < tlen; n++) {
      newP95Vals.push({
        Timestamp: latencyDatas.Timestamps[n],
        Value: latencyDatas.P95[n]
      })
      newP50Vals.push({
        Timestamp: latencyDatas.Timestamps[n],
        Value: latencyDatas.P50[n]
      })
    }

    responses[latencyIdx].Response.Data[0].Period = period
    responses[latencyIdx].Response.Data[0].AttributeName = 'latency-P95'
    responses[latencyIdx].Response.Data[0].Values = newP95Vals

    const newP50 = _.cloneDeep(responses[latencyIdx])
    newP50.Response.Data[0].AttributeName = 'latency-P50'
    newP50.Response.Data[0].Values = newP50Vals

    responses.push(newP50)
  }

  async describeCCMInstanceDatas(id, instances, startTime, endTime) {
    const client = new TencentCloudClient(this.credentials, {
      host: 'monitor.tencentcloudapi.com',
      path: '/'
    })
    const req = {
      Action: 'DescribeCCMInstanceDatas',
      Version: '2018-07-24',
      AttributeId: id,
      InstanceName: instances,
      StartTime: startTime,
      EndTime: endTime,
      TypeId: 'SCF'
    }
    return client.doCloudApiRequest(req)
  }

  async describeAttributes(offset, limit) {
    const client = new TencentCloudClient(this.credentials, {
      host: 'monitor.tencentcloudapi.com',
      path: '/'
    })
    const req = {
      Action: 'DescribeAttributes',
      Version: '2018-07-24',
      Offset: offset || 0,
      Limit: limit || 10
    }

    return await client.doCloudApiRequest(req)
  }

  async getCustomMetrics(region, announceInstance, rangeTime, period) {
    const apiQPSLimit = 100
    const metricsRule = [
      /^(GET|POST|DEL|DELETE|PUT|OPTIONS|HEAD)_([a-zA-Z0-9]+)_latency$/i,
      /^(GET|POST|DEL|DELETE|PUT|OPTIONS|HEAD)_([a-zA-Z0-9]+)_(\d+)$/i,
      /^(GET|POST|DEL|DELETE|PUT|OPTIONS|HEAD)_([a-zA-Z0-9]+)$/i,
      /^request$/i,
      /^latency$/i,
      /^error$/i,
      /^4xx$/i,
      /^5xx$/i
    ]

    const getMetricsResponse = (promiseHandlers) => {
      return new Promise((resolve, reject) => {
        Promise.all(promiseHandlers)
          .then((results) => {
            resolve(results)
          })
          .catch((error) => {
            reject(error)
          })
      })
    }

    const filterAttributeName = function(name, mRule) {
      const len = mRule.length
      for (var i = 0; i < len; i++) {
        if (name.match(mRule[i])) {
          return true
        }
      }
      return false
    }

    const metricAttributeHash = {}
    let requestHandlers = []
    let responses = []
    let results
    let firstRequestFlag = true
    const attributes = await this.describeAttributes(0, 200)
    for (var i = 0; i < attributes.Response.Data.TotalCount; i++) {
      const metricAttribute = attributes.Response.Data.Data[i]

      if (!filterAttributeName(metricAttribute.AttributeName, metricsRule)) {
        continue
      }
      metricAttributeHash[metricAttribute.AttributeId] = metricAttribute
      requestHandlers.push(
        this.describeCCMInstanceDatas(
          metricAttribute.AttributeId,
          announceInstance,
          rangeTime.rangeStart,
          rangeTime.rangeEnd
        )
      )

      if (!((i + 1) % apiQPSLimit)) {
        if (i + 1 != apiQPSLimit) {
          await SlsMonitor.sleep(1000)
        }
        firstRequestFlag = false
        results = await getMetricsResponse(requestHandlers)
        responses = responses.concat(results)
        requestHandlers = []
      }
    }
    if (requestHandlers.length === 0) {
      responses = this.cleanEmptyMetric(responses, metricAttributeHash)
      this.aggrCustomDatas(responses, period, metricAttributeHash)
      return responses
    }
    if (!firstRequestFlag) {
      await SlsMonitor.sleep(1000)
    }
    results = await getMetricsResponse(requestHandlers)
    results = this.cleanEmptyMetric(results, metricAttributeHash)
    responses = responses.concat(results)
    this.aggrCustomDatas(responses, period, metricAttributeHash)
    return responses
  }

  cleanEmptyMetric(datas, metricAttributeHash) {
    const metrics = []
    const rule = /^(GET|POST|DEL|DELETE|PUT|OPTIONS|HEAD)_(.*)$/i
    for (var i = 0; datas && i < datas.length; i++) {
      const item = datas[i]
      if (item.Response.Data.length === 0) {
        continue
      }
      const name = metricAttributeHash[item.Response.Data[0].AttributeId].AttributeName
      if (!name.match(rule)) {
        metrics.push(item)
        continue
      }
      for (var n = 0; n < item.Response.Data[0].Values.length; n++) {
        const val = item.Response.Data[0].Values[n]
        if (val.Value !== 0) {
          metrics.push(item)
          break
        }
      }
    }
    return metrics
  }

  async getScfMetrics(region, rangeTime, period, funcName, ns, version) {
    const client = new TencentCloudClient(
      this.credentials,
      {
        host: 'monitor.tencentcloudapi.com',
        path: '/'
      },
      {
        region: region
      }
    )
    const req = {
      Action: 'GetMonitorData',
      Version: '2018-07-24'
    }

    const metrics = ['Invocation', 'Error', 'Duration']

    const diffDay =
      (new Date(rangeTime.rangeEnd) - new Date(rangeTime.rangeStart)) / 1000 / 3600 / 24
    let reqPeriod = 60
    // cloud api limit
    if (diffDay >= 3) {
      reqPeriod = 3600
    }
    const requestHandlers = []
    for (var i = 0; i < metrics.length; i++) {
      req.Namespace = 'qce/scf_v2'
      req.MetricName = metrics[i]
      req.Period = reqPeriod
      req.StartTime = rangeTime.rangeStart
      req.EndTime = rangeTime.rangeEnd
      req.Instances = [
        {
          Dimensions: [
            {
              Name: 'functionName',
              Value: funcName
            },
            {
              Name: 'version',
              Value: version || '$latest'
            },
            {
              Name: 'namespace',
              Value: ns
            }
          ]
        }
      ]
      requestHandlers.push(client.doCloudApiRequest(req))
    }
    return new Promise((resolve, reject) => {
      Promise.all(requestHandlers)
        .then((results) => {
          this.aggrDatas(results, reqPeriod, period)
          resolve(results)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  // scf response timestamp data discontinuous
  padContent(dataPoints, period) {
    const times = []
    const values = []

    const len = dataPoints.Timestamps.length
    for (var i = 0; i < len; i++) {
      let timestamp = dataPoints.Timestamps[i]
      const value = dataPoints.Values[i]
      times.push(timestamp)
      values.push(value)

      if (i < len - 1) {
        const nextTimestamp = dataPoints.Timestamps[i + 1]
        while (nextTimestamp - timestamp > period) {
          timestamp += period
          times.push(timestamp)
          values.push(0)
        }
      }
    }
    return {
      times: times,
      values: values
    }
  }

  mergeByPeriod(datas, srcPeriod, dstPeriod) {
    if (srcPeriod == dstPeriod || srcPeriod > dstPeriod) {
      return null
    }

    const tlen = datas.Timestamps.length
    const period = dstPeriod / srcPeriod
    const values = []
    const times = []
    if (tlen == 0) {
      return null
    }

    let val = 0
    for (var n = 0; n < tlen; n++) {
      if (n > 0 && !((n + 1) % period)) {
        let v = val + datas.Values[n]
        if (!(~~v == v)) {
          v = parseFloat(v.toFixed(2), 10)
        }
        times.push(datas.Timestamps[n + 1 - period])
        values.push(v)
        val = 0
      } else {
        val += datas.Values[n]
      }
    }

    if (tlen % period) {
      times.push(datas.Timestamps[tlen - (tlen % period)])
      values.push(val)
    }
    return {
      times: times,
      values: values
    }
  }

  padPart(startTime, endTime, period) {
    const padTimes = []
    const padValues = []

    while (startTime < endTime) {
      padTimes.push(startTime)
      padValues.push(0)
      startTime += period
    }
    return { timestamp: padTimes, values: padValues }
  }

  aggrDatas(responses, srcPeriod, dstPeriod) {
    const len = responses.length

    let startTime, endTime, startTimestamp, endTimestamp
    for (var i = 0; i < len; i++) {
      const response = responses[i].Response
      if (response.Error) {
        console.log(JSON.stringify(response.Error), response.RequestId)
        continue
      }
      if (response.DataPoints[0].Timestamps.length == 0) {
        continue
      }
      const dataPoints = this.padContent(response.DataPoints[0], srcPeriod)
      response.DataPoints[0].Timestamps = dataPoints.times
      response.DataPoints[0].Values = dataPoints.values

      // response timestamp is tz +08:00
      startTime = new Date(response.StartTime)
      endTime = new Date(response.EndTime)

      let offset = 0
      if (startTime.getTimezoneOffset() == 0) {
        offset = 8 * 60 * 60
      }
      startTimestamp = startTime.getTime() / 1000 - offset
      endTimestamp = endTime.getTime() / 1000 - offset

      const startPads = this.padPart(
        startTimestamp,
        response.DataPoints[0].Timestamps[0],
        response.Period
      )
      if (startPads.timestamp.length > 0) {
        response.DataPoints[0].Timestamps = startPads.timestamp.concat(
          response.DataPoints[0].Timestamps
        )
      }
      if (startPads.values.length > 0) {
        response.DataPoints[0].Values = startPads.values.concat(response.DataPoints[0].Values)
      }

      const endPads = this.padPart(
        response.DataPoints[0].Timestamps[response.DataPoints[0].Timestamps.length - 1],
        endTimestamp + response.Period,
        response.Period
      )
      if (endPads.timestamp.length > 0) {
        endPads.timestamp.shift()
        response.DataPoints[0].Timestamps = response.DataPoints[0].Timestamps.concat(
          endPads.timestamp
        )
      }
      if (endPads.values.length > 0) {
        endPads.values.shift()
        response.DataPoints[0].Values = response.DataPoints[0].Values.concat(endPads.values)
      }

      if (response.MetricName == 'Duration') {
        this.aggrDurationP(responses, srcPeriod, dstPeriod)
        continue
      }

      let result
      switch (dstPeriod) {
        case 300:
          result = this.mergeByPeriod(response.DataPoints[0], srcPeriod, dstPeriod)
          break
        case 3600:
          result = this.mergeByPeriod(response.DataPoints[0], srcPeriod, dstPeriod)
          break
        case 86400:
          result = this.mergeByPeriod(response.DataPoints[0], srcPeriod, dstPeriod)
          break
      }
      if (result) {
        response.DataPoints[0].Timestamps = result.times
        response.DataPoints[0].Values = result.values
      }
    }
  }

  async createService() {
    const client = new TencentCloudClient(this.credentials, {
      host: 'monitor.tencentcloudapi.com',
      path: '/'
    })
    const req = {
      Action: 'CreateService',
      Version: '2018-07-24'
    }
    return client.doCloudApiRequest(req)
  }
}

module.exports = {
  ScfClient,
  TagClient,
  CamClient,
  CamV2Client,
  CnsClient,
  ApigwClient,
  DomainClient,
  CosClient,
  SlsMonitor,
  TcbClient
}
