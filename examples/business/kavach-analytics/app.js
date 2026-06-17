import { KavachAuthHelper } from '../../shared/auth-helper.js';

new KavachAuthHelper({
  appName: 'Kavach Analytics',
  onAuthSuccess: async (client) => {
    // 1. Fetch active sessions using the SDK
    try {
      const res = await client.authenticatedFetch('/auth/sessions');
      if (res.ok) {
        const data = await res.json();
        renderSessions(data.sessions);
      } else {
        document.getElementById('sessions-list').innerHTML = `<p style="color: var(--danger-color);">Failed to load sessions</p>`;
      }
    } catch (err) {
      document.getElementById('sessions-list').innerHTML = `<p style="color: var(--danger-color);">${err.message}</p>`;
    }

    // 2. Setup Chart.js visualizations
    setupChart();

    const refreshBtn = document.getElementById('refresh-chart-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        setupChart();
      });
    }
  }
});

let myChart = null;
function setupChart() {
  const ctx = document.getElementById('analytics-canvas')?.getContext('2d');
  if (!ctx) return;

  if (myChart) {
    myChart.destroy();
  }

  // Generate mock traffic data
  const labels = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const dpopData = Array.from({ length: 9 }, () => Math.floor(Math.random() * 400) + 100);
  const legacyData = Array.from({ length: 9 }, () => Math.floor(Math.random() * 80) + 20);

  myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'DPoP Secure Logins',
          data: dpopData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Standard Bearer Logins',
          data: legacyData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#f3f4f6' }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af' }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af' }
        }
      }
    }
  });
}

function renderSessions(sessions) {
  const container = document.getElementById('sessions-list');
  if (!sessions || sessions.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">No active sessions found.</p>`;
    return;
  }
  
  container.innerHTML = sessions.map(session => `
    <div class="session-info">
      <div class="session-details">
        <div style="font-weight: 600; font-size: 0.85rem;">IP: ${session.ipAddress}</div>
        <div class="session-meta">${session.userAgent.substring(0, 50)}...</div>
      </div>
      <div style="font-size: 0.75rem; font-family: monospace; color: var(--accent-color);">${session.id.substring(0, 8)}...</div>
    </div>
  `).join('');
}
