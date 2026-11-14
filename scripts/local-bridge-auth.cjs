function isLocalBridgeRequest(req) {
  const host=req.headers.host || ''
  return ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress) && /^localhost(?::\d+)?$/.test(host) && req.headers.origin === `http://${host}` && req.headers['x-aipros-bridge']==='1'
}
module.exports={isLocalBridgeRequest}
