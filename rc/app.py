from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from pymodbus.client import ModbusTcpClient
import time
import threading
import json

from flask_cors import CORS
app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app, resources={r"/api/*": {"origins": "*"}})

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Modbus server configuration
MODBUS_HOST = '10.53.3.76' #mention the por url which the api calls will learn
MODBUS_PORT = 502

# Device register addresses
PUMP_REGISTERS = {
    'pump1': {
        'state': 40021,
        'control': 40061
    },
    'pump2': {
        'state': 40031,
        'control': 40071
    },
    'pump3': {
        'state': 40041,
        'control': 40081
    },
    'reset': 40051
}

# Store the latest pump data
pump_data = {
    'pump1': {'state': 1, 'value': 0, 'timestamp': time.time()},
    'pump2': {'state': 1, 'value': 0, 'timestamp': time.time()},
    'pump3': {'state': 1, 'value': 0, 'timestamp': time.time()}
}

# History of pump states for historical data
pump_history = {
    'pump1': [],
    'pump2': [],
    'pump3': []
}

def modbus_read(address):
    """Read a value from a Modbus register"""
    client = ModbusTcpClient(MODBUS_HOST, port=MODBUS_PORT)
    try:
        reg_address = address - 40001
        # Try with just one argument
        result = client.read_holding_registers(reg_address)
        client.close()
        if not result.isError():
            return result.registers[0]
        return None
    except Exception as e:
        print(f"Exception in modbus_read: {str(e)}")
        return None
    finally:
        if hasattr(client, 'is_socket_open') and client.is_socket_open():
            client.close()

def modbus_write(address, value):
    """Write a value to a Modbus register"""
    client = ModbusTcpClient(MODBUS_HOST, port=MODBUS_PORT)
    try:
        reg_address = address - 40001
        # Check the correct signature here too
        result = client.write_register(reg_address, value)
        client.close()
        return not result.isError()
    except Exception as e:
        print(f"Exception in modbus_write: {str(e)}")
        return False
    finally:
        if hasattr(client, 'is_socket_open') and client.is_socket_open():
            client.close()
            
def poll_pump_data():
    """Poll pump data regularly and store in memory"""
    while True:
        for pump, registers in PUMP_REGISTERS.items():
            if pump != 'reset':
                state = modbus_read(registers['state'])
                if state is not None:
                    # Update current state
                    pump_data[pump]['state'] = state
                    pump_data[pump]['timestamp'] = time.time()
                    
                    # Store in history (limit to 100 points)
                    pump_history[pump].append({
                        'state': state,
                        'timestamp': time.time()
                    })
                    if len(pump_history[pump]) > 100:
                        pump_history[pump].pop(0)
        
        # Poll every 2 seconds
        time.sleep(2)

# Start polling thread
polling_thread = threading.Thread(target=poll_pump_data, daemon=True)
polling_thread.start()

@app.route('/')
def index():
    """Serve the main dashboard page"""
    return render_template('index.html')

@app.route('/api/device_states', methods=['GET'])
def get_device_states():
    """Get current states of all pumps"""
    return jsonify(pump_data)

@app.route('/api/history/<pump_id>', methods=['GET'])
def get_history(pump_id):
    """Get historical data for a specific pump"""
    if pump_id in pump_history:
        return jsonify(pump_history[pump_id])
    return jsonify([])

@app.route('/api/control/<pump_id>', methods=['POST'])
def control_pump(pump_id):
    """Control a pump via Modbus"""
    try:
        if pump_id in PUMP_REGISTERS:
            if pump_id == 'reset':
                # Handle reset action
                success = modbus_write(PUMP_REGISTERS['reset'], 1)
            else:
                # Toggle pump state
                control_address = PUMP_REGISTERS[pump_id]['control']
                success = modbus_write(control_address, 2)  # Write value 2 to toggle
                
            if success:
                # Read back the new state after a brief delay
                time.sleep(0.5)
                for pump, registers in PUMP_REGISTERS.items():
                    if pump != 'reset':
                        state = modbus_read(registers['state'])
                        if state is not None:
                            pump_data[pump]['state'] = state
                
                return jsonify({"success": True, "message": f"{pump_id} controlled successfully"})
            
            return jsonify({"success": False, "message": "Modbus communication failed - could not write to register"}), 500
        
        return jsonify({"success": False, "message": "Invalid pump ID"}), 400
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500
    
@app.route('/api/export', methods=['GET'])
def export_data():
    """Export pump data as JSON"""
    return jsonify({
        "current": pump_data,
        "history": pump_history
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)