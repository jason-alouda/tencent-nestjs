module.exports = {
  scf: require('./client').ScfClient,
  cam: require('./client').CamClient,
  camv2: require('./client').CamV2Client,
  cns: require('./client').CnsClient,
  tag: require('./client').TagClient,
  apigw: require('./client').ApigwClient,
  domain: require('./client').DomainClient,
  cos: require('./client').CosClient,
  slsMonitor: require('./client').SlsMonitor,
  tcb: require('./client').TcbClient
}
