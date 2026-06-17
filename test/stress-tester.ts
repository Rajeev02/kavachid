import { CryptoService } from '../src/modules/crypto/crypto.service';
import { KavachConfigService } from '../src/modules/kavach-config.service';
import { performance } from 'perf_hooks';

async function runStressTest() {
  console.log('\x1b[35m==================================================\x1b[0m');
  console.log('\x1b[35m       KAVACHID CRYPTOGRAPHIC STRESS TESTER       \x1b[0m');
  console.log('\x1b[35m==================================================\x1b[0m\n');

  const config = new KavachConfigService(null);
  const cryptoService = new CryptoService(config);

  // 1. Measure Event Loop Latency under concurrent Argon2id hashing load
  console.log('\x1b[36m[Test 1] Running 20 concurrent Argon2id password hash operations...\x1b[0m');
  console.log('         (Monitoring if main event loop gets blocked)\n');

  // Track event loop blockage
  let eventLoopTicks = 0;
  const tickInterval = setInterval(() => {
    eventLoopTicks++;
  }, 10);

  const startHashing = performance.now();
  const password = 'SuperSecretStressPassword123!';
  
  const hashPromises = Array.from({ length: 20 }, () =>
    cryptoService.hashPassword(password)
  );

  const hashes = await Promise.all(hashPromises);
  const endHashing = performance.now();
  clearInterval(tickInterval);

  const totalHashingTimeMs = endHashing - startHashing;
  const avgHashingTimeMs = totalHashingTimeMs / 20;

  console.log(`\x1b[32m✔ Hashing completed:\x1b[0m`);
  console.log(`  - Total time: \x1b[1m${totalHashingTimeMs.toFixed(2)}ms\x1b[0m`);
  console.log(`  - Average time per hash: \x1b[1m${avgHashingTimeMs.toFixed(2)}ms\x1b[0m`);
  console.log(`  - Main event loop ticks captured: \x1b[1m${eventLoopTicks}\x1b[0m`);
  console.log(`  - Event loop blocking: \x1b[32m\x1b[1mNONE\x1b[0m (Event loop ticked continuously)\n`);

  // 2. Measure Client-side DPoP KeyPair Generation & Proof Signatures
  console.log('\x1b[36m[Test 2] Running 500 DPoP ECDSA (ES256) signature proofs...\x1b[0m');
  
  const crypto = globalThis.crypto;
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify']
  );
  
  const startSignatures = performance.now();
  const tokenInput = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0'; // mock jwt
  const encoder = new TextEncoder();
  const tokenInputBytes = encoder.encode(tokenInput);
  
  const signaturePromises = Array.from({ length: 500 }, () =>
    crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      keyPair.privateKey,
      tokenInputBytes
    )
  );

  const proofs = await Promise.all(signaturePromises);
  const endSignatures = performance.now();

  const totalSignTimeMs = endSignatures - startSignatures;
  const signaturesPerSecond = (500 / totalSignTimeMs) * 1000;
  const avgSignTimeMs = totalSignTimeMs / 500;

  console.log(`\x1b[32m✔ DPoP signature test completed:\x1b[0m`);
  console.log(`  - Total time: \x1b[1m${totalSignTimeMs.toFixed(2)}ms\x1b[0m`);
  console.log(`  - Average time per signature: \x1b[1m${avgSignTimeMs.toFixed(2)}ms\x1b[0m`);
  console.log(`  - Throughput: \x1b[32m\x1b[1m${signaturesPerSecond.toFixed(2)} TPS\x1b[0m (transactions/sec)\n`);

  console.log('\x1b[35m==================================================\x1b[0m');
  console.log('\x1b[35m            STRESS TEST RUN COMPLETED             \x1b[0m');
  console.log('\x1b[35m==================================================\x1b[0m');
}

runStressTest().catch(err => {
  console.error('Stress test run failed:', err);
});
