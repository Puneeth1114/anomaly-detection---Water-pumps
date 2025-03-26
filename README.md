# anomaly-detection---Water-pumps
# Pump Monitoring Dashboard

## Project Overview

This Pump Monitoring Dashboard is a web-based application designed to monitor and control multiple pumps in an industrial or water treatment setting. The system provides real-time status monitoring, historical data tracking, and remote control capabilities for three pumps.

## Features

- Real-time pump status monitoring
- State tracking for three pumps (Normal/Anomaly)
- Historical data visualization
- Manual pump control
- Data export functionality
- Auto-refresh toggle
- Modbus TCP communication

## Technology Stack

- Backend: Python Flask
- Frontend: JavaScript, HTML, Chart.js
- Communication: Modbus TCP
- Deployment: Local server

## Prerequisites

- Python 3.8+
- Flask
- pymodbus
- Flask-CORS
- Web browser with JavaScript support
- Modbus TCP server

## Installation

### Backend Setup

1. Clone the repository
```bash
git clone <repository-url>
cd pump-monitoring-dashboard
```

2. Create a virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
```

3. Install dependencies
```bash
pip install flask pymodbus flask-cors
```

### Frontend Setup

No additional setup required. The frontend is static HTML/JS.

## Configuration

### Modbus Configuration
Edit `app.py` to set your Modbus server details:
```python
MODBUS_HOST = '10.53.3.76'  # Your Modbus server IP
MODBUS_PORT = 502  # Modbus TCP port
```

### API Configuration
Update `dashboard.js` with your API endpoint:
```javascript
const API_BASE_URL = 'http://10.53.3.76:5001/api';
```

## Running the Application

1. Start the Modbus TCP server
2. Run the Flask backend
```bash
python app.py
```

3. Open `index.html` in your web browser

## Usage

- View real-time pump states
- Toggle auto-refresh
- Control individual pumps
- Export pump data as JSON
- View historical pump state chart

## API Endpoints

- `/api/device_states`: Get current pump states
- `/api/history/<pump_id>`: Retrieve pump history
- `/api/control/<pump_id>`: Control pump state
- `/api/export`: Export all pump data

## Troubleshooting

- Ensure Modbus server is running
- Check network connectivity
- Verify firewall settings
- Confirm correct IP and port configurations

## Security Considerations

- Use in controlled network environments
- Implement additional authentication for production
- Regularly update dependencies

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

[Specify your license here, e.g., MIT, Apache 2.0]

## Contact

[Your Name/Organization Contact Information]

## Acknowledgments

- Flask Framework
- Chart.js
- Pymodbus Library
