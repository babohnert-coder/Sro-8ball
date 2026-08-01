import { OracleRuntime } from '../src/runtime.js';
let runtime;
export default async function handler(_req, res) {
  try {
    runtime ??= new OracleRuntime();
    const health = await runtime.health();
    res.statusCode = health.ok ? 200 : 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(health));
  } catch (error) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: false, error: error.message }));
  }
}
