import log from 'loglevel'

// In production builds Vite replaces import.meta.env.DEV with false,
// so the level is set to WARN and below at runtime.
log.setDefaultLevel(import.meta.env.DEV ? log.levels.DEBUG : log.levels.WARN)

export default log

