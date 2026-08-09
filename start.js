import { spawn } from 'node:child_process';
import { appendFileSync, mkdirSync } from 'node:fs';

const LOG_DIR = 'logs';
const LOG_FILE = `${LOG_DIR}/bot.log`;
const MAX_RESTARTS = 10;
const RESET_AFTER_MS = 10 * 60 * 1000;
const BASE_DELAY_MS = 3000;
const MAX_DELAY_MS = 30000;

mkdirSync(LOG_DIR, { recursive: true });

let restartCount = 0;
let firstCrashAt = 0;
let stopping = false;
let child = null;

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, `${line}\n`); } catch {}
}

function startBot() {
  if (stopping) return;

  child = spawn(process.execPath, ['src/index.js'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env
  });

  child.stdout.on('data', data => process.stdout.write(data));
  child.stderr.on('data', data => {
    process.stderr.write(data);
    try { appendFileSync(LOG_FILE, data.toString()); } catch {}
  });

  child.on('error', error => log(`Bot process error: ${error.stack || error.message}`));

  child.on('exit', (code, signal) => {
    child = null;
    if (stopping) return;

    const now = Date.now();
    if (!firstCrashAt || now - firstCrashAt > RESET_AFTER_MS) {
      firstCrashAt = now;
      restartCount = 0;
    }

    restartCount += 1;
    log(`Bot stopped. code=${code ?? 'null'} signal=${signal ?? 'none'} restart=${restartCount}/${MAX_RESTARTS}`);

    if (restartCount > MAX_RESTARTS) {
      log('Too many crashes. Restart protection stopped the bot to prevent an infinite crash loop.');
      process.exit(1);
    }

    const delay = Math.min(BASE_DELAY_MS * 2 ** (restartCount - 1), MAX_DELAY_MS);
    log(`Restarting Infinity Manager in ${delay / 1000}s...`);
    setTimeout(startBot, delay);
  });
}

function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  log(`Received ${signal}. Shutting down Infinity Manager...`);
  if (child) child.kill('SIGTERM');
  setTimeout(() => process.exit(0), 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', error => {
  log(`Launcher uncaught exception: ${error.stack || error.message}`);
  if (child) child.kill('SIGTERM');
});

process.on('unhandledRejection', reason => {
  log(`Launcher unhandled rejection: ${reason?.stack || reason}`);
});

log('Infinity Manager process supervisor started.');
startBot();
