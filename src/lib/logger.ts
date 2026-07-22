/**
 * Minimal structured logger.
 *
 * Emits one JSON object per log line so downstream collectors (Docker
 * logs, Caddy access log, Sentry's log buffer, etc.) can parse them
 * without regex. Designed to be a drop-in replacement for ad-hoc
 * `console.log` / `console.error` calls — but we deliberately do NOT
 * rewrite every existing console call (too many, too risky); we just
 * provide this for new code and gradual migration.
 *
 * Why not pino / winston?
 *  - Both pull in ~100KB of deps + transports we don't need at this
 *    scale. This logger is ~30 lines and ships zero deps.
 *  - The Docker container already gets structured logs for free via
 *    Caddy's `log` directive on the reverse-proxy side; this is just
 *    the application-level complement.
 *
 * Level filtering:
 *  - In production: only `warn` and `error` are emitted. `info` and
 *    `debug` are silenced to keep the log volume sane (the app makes a
 *    LOT of `/api/*` calls; logging each one would drown the signal).
 *  - In dev: all four levels emit, so you can sprinkle `logger.debug`
 *    everywhere without worrying about prod noise.
 *
 * Note: `next.config.ts` already strips `console.debug` / `console.log`
 * in production builds via SWC's `removeConsole` (excluding `error` and
 * `warn`). That's a separate concern — it removes the call sites at
 * build time, while this logger's runtime filter is the safety net for
 * any calls that survive (e.g. `logger.info` is kept in the bundle but
 * becomes a no-op at runtime in prod).
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'production' && (level === 'debug' || level === 'info')) {
    return
  }
  const entry = { level, message, timestamp: new Date().toISOString(), ...meta }
  if (level === 'error') console.error(JSON.stringify(entry))
  else if (level === 'warn') console.warn(JSON.stringify(entry))
  // eslint-disable-next-line no-console -- this IS the logger; console.log is the sink.
  else console.log(JSON.stringify(entry))
}

export const logger = {
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
}
