// Configuration
// Change this line in dashboard.js
const API_BASE_URL = 'http://127.0.0.1:5000/api';
const REFRESH_INTERVAL = 2000; // 2 seconds

// Chart configuration
let historyChart;
const chartColors = {
    pump1: 'rgba(75, 192, 192, 1)',
    pump2: 'rgba(255, 159, 64, 1)',
    pump3: 'rgba(153, 102, 255, 1)'
};

// State tracking
let autoRefresh = true;
let refreshInterval;

// DOM elements
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the dashboard
    initializeDashboard();
    
    // Set up event listeners
    setupEventListeners();
    
    // Start auto-refresh
    startAutoRefresh();
    
    // Initialize chart
    initializeChart();
});

function initializeDashboard() {
    // Initial data fetch
    fetchDeviceStates();
    
    // Update connection status
    document.getElementById('connection-status').textContent = 'Connected';
    document.getElementById('connection-status').style.color = '#28a745';
    
    // Update last updated time
    updateLastUpdated();
}

function setupEventListeners() {
    // Pump control buttons
    document.getElementById('pump1-control').addEventListener('click', () => controlPump('pump1'));
    document.getElementById('pump2-control').addEventListener('click', () => controlPump('pump2'));
    document.getElementById('pump3-control').addEventListener('click', () => controlPump('pump3'));
    
    // Reset button
    document.getElementById('reset-control').addEventListener('click', () => controlPump('reset'));
    
    // Export data button
    document.getElementById('export-data').addEventListener('click', exportData);
    
    // Auto-refresh toggle
    document.getElementById('auto-refresh').addEventListener('change', (e) => {
        autoRefresh = e.target.checked;
        if (autoRefresh) {
            startAutoRefresh();
        } else {
            stopAutoRefresh();
        }
    });
}

function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    refreshInterval = setInterval(() => {
        fetchDeviceStates();
    }, REFRESH_INTERVAL);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
}

function fetchDeviceStates() {
    fetch(`${API_BASE_URL}/device_states`)
        .then(response => response.json())
        .then(data => {
            updatePumpDisplay(data);
            updateLastUpdated();
            
            // Count active devices
            const activeDevices = Object.values(data).filter(pump => pump.state === 1).length;
            document.getElementById('active-devices').textContent = `${activeDevices}/3`;
        })
        .catch(error => {
            console.error('Error fetching device states:', error);
            document.getElementById('connection-status').textContent = 'Disconnected';
            document.getElementById('connection-status').style.color = '#dc3545';
        });
    
    // Also update history data for the chart
    updateHistoryData();
}

function updatePumpDisplay(data) {
    // Update each pump's display
    Object.keys(data).forEach(pumpId => {
        const pump = data[pumpId];
        const pumpElement = document.getElementById(`${pumpId}-container`);
        const statusElement = document.getElementById(`${pumpId}-status`);
        const imageElement = document.getElementById(`${pumpId}-image`);
        
        if (pump.state === 1) {
            // Normal state
            statusElement.textContent = 'Normal';
            statusElement.className = 'status-indicator';
            imageElement.className = 'pump-image active';
            imageElement.querySelector('circle').setAttribute('fill', '#28a745');  // Green
        } else if (pump.state === 2) {
            // Anomaly state
            statusElement.textContent = 'Anomaly';
            statusElement.className = 'status-indicator anomaly';
            imageElement.className = 'pump-image anomaly';
            imageElement.querySelector('circle').setAttribute('fill', '#dc3545');  // Red
        }
    });
}

function controlPump(pumpId) {
    fetch(`${API_BASE_URL}/control/${pumpId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Immediately fetch updated states
            fetchDeviceStates();
        } else {
            alert(`Failed to control ${pumpId}: ${data.message}`);
        }
    })
    .catch(error => {
        console.error(`Error controlling ${pumpId}:`, error);
        alert(`Failed to communicate with the server`);
    });
}

function updateLastUpdated() {
    const now = new Date();
    document.getElementById('last-update').textContent = now.toLocaleTimeString();
}

function initializeChart() {
    const ctx = document.getElementById('historyChart').getContext('2d');
    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // Will be populated with timestamps
            datasets: [
                {
                    label: 'Water Pump',
                    data: [],
                    borderColor: chartColors.pump1,
                    backgroundColor: chartColors.pump1 + '33',
                    tension: 0.2
                },
                {
                    label: 'Lime Dosing Pump',
                    data: [],
                    borderColor: chartColors.pump2,
                    backgroundColor: chartColors.pump2 + '33',
                    tension: 0.2
                },
                {
                    label: 'Pump 3',
                    data: [],
                    borderColor: chartColors.pump3,
                    backgroundColor: chartColors.pump3 + '33',
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'State'
                    },
                    min: 0.8,
                    max: 2.2,
                    ticks: {
                        callback: function(value) {
                            if (value === 1) return 'Normal';
                            if (value === 2) return 'Anomaly';
                            return '';
                        }
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Pump States Over Time'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            return value === 1 ? 'Normal' : 'Anomaly';
                        }
                    }
                }
            }
        }
    });
}

function updateHistoryData() {
    // Get history data for all pumps
    Promise.all([
        fetch(`${API_BASE_URL}/history/pump1`).then(res => res.json()),
        fetch(`${API_BASE_URL}/history/pump2`).then(res => res.json()),
        fetch(`${API_BASE_URL}/history/pump3`).then(res => res.json())
    ])
    .then(([pump1History, pump2History, pump3History]) => {
        // Create labels from timestamps (using the first pump's timestamps)
        const labels = pump1History.map(point => {
            const date = new Date(point.timestamp * 1000);
            return date.toLocaleTimeString();
        });
        
        // Update chart data
        historyChart.data.labels = labels;
        historyChart.data.datasets[0].data = pump1History.map(point => point.state);
        historyChart.data.datasets[1].data = pump2History.map(point => point.state);
        historyChart.data.datasets[2].data = pump3History.map(point => point.state);
        
        // Update chart
        historyChart.update();
    })
    .catch(error => {
        console.error('Error fetching history data:', error);
    });
}

function exportData() {
    fetch(`${API_BASE_URL}/export`)
        .then(response => response.json())
        .then(data => {
            // Create a JSON blob and download it
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `pump_data_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);
        })
        .catch(error => {
            console.error('Error exporting data:', error);
            alert('Failed to export data');
        });
}