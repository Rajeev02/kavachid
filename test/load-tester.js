const autocannon = require('autocannon');

async function runLoadTest() {
  console.log('🚀 Starting KavachID Load Test...');
  
  const instance = autocannon({
    url: 'http://localhost:3000',
    connections: 100, // Number of concurrent connections
    duration: 10, // Test duration in seconds
    requests: [
      {
        method: 'POST',
        path: '/api/v1/auth/login',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@kavachid.local',
          password: 'SuperSecretPassword123!',
          tenantId: 'kavach-store'
        })
      }
    ]
  }, (err, result) => {
    if (err) {
      console.error('Error running load test:', err);
      return;
    }
    console.log('\n📊 Load Test Results:');
    console.log(`- Requests Per Second (Avg): ${result.requests.average}`);
    console.log(`- Latency (Avg): ${result.latency.average}ms`);
    console.log(`- Total Requests: ${result.requests.total}`);
    console.log(`- Errors: ${result.errors}`);
    console.log(`- Timeouts: ${result.timeouts}`);
  });

  autocannon.track(instance, { renderProgressBar: true });
}

runLoadTest();
