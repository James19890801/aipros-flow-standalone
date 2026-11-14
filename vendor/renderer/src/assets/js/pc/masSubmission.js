export function isMasSubmissionLite(config) {
  const cfg = config || {}
  return cfg.CHANNELTYPE === 'mas' && cfg.MAS_SUBMISSION_LITE !== false
}

export function masUnsupportedToast(Toast) {
  new Toast({ type: 'warning', msg: '暂不支持' })
}
