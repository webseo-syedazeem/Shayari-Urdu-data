import { performance } from 'perf_hooks';

const BASE_URL = process.env.CACHE_VERIFY_BASE_URL || 'http://localhost:3002';

type Result = {
  cache: string;
  milliseconds: number;
  status: number;
};

async function timedGet(path: string): Promise<Result> {
  const start = performance.now();
  const response = await fetch(`${BASE_URL}${path}`);
  await response.arrayBuffer();

  return {
    cache: response.headers.get('x-cache') || 'MISSING',
    milliseconds: performance.now() - start,
    status: response.status
  };
}

async function verifyPair(label: string, path: string): Promise<boolean> {
  const first = await timedGet(path);
  // Cache fills are deliberately fire-and-forget; allow the REST write to settle.
  await new Promise((resolve) => setTimeout(resolve, 1_500));
  const second = await timedGet(path);
  const passed = first.status === 200
    && second.status === 200
    && second.cache.toUpperCase() === 'HIT'
    && second.milliseconds < first.milliseconds;

  console.log(`\n${label}`);
  console.log(`  first:  ${first.milliseconds.toFixed(2)}ms  X-Cache=${first.cache}  status=${first.status}`);
  console.log(`  second: ${second.milliseconds.toFixed(2)}ms  X-Cache=${second.cache}  status=${second.status}`);
  console.log(`  ${passed ? 'PASS' : 'FAIL'}`);
  return passed;
}

async function main() {
  console.log(`Verifying cache behavior against ${BASE_URL}`);
  const tagsPassed = await verifyPair('Tags list', '/api/tags?page=1&pageSize=20');
  const shayariPassed = await verifyPair('Shayari list', '/api/shayari?page=1&pageSize=20');
  const passed = tagsPassed && shayariPassed;

  console.log(`\nOverall: ${passed ? 'PASS' : 'FAIL'}`);
  if (!passed) process.exitCode = 1;
}

main().catch((error) => {
  console.error('\nFAIL: Could not complete cache verification.', error);
  process.exitCode = 1;
});
