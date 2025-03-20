from flask import Flask, jsonify, request
import json
import os
import threading
import logging

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Path to our local JSON data file
DATA_FILE = 'lights_data.json'

# Lock for thread-safe file access
file_lock = threading.Lock()

# Default data structure
DEFAULT_DATA = {
    "wifi": {
        "enabled": 0,
        "one": 0,
        "two": 0,
        "three": 0,
        "blinky": 0
    }
}

def init_data_file():
    """Initialize the data file if it doesn't exist"""
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w') as f:
            json.dump(DEFAULT_DATA, f, indent=2)
        logger.info(f"Created new data file: {DATA_FILE}")
    else:
        logger.info(f"Using existing data file: {DATA_FILE}")

def read_data():
    """Read data from the JSON file"""
    with file_lock:
        try:
            with open(DATA_FILE, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            logger.error(f"Error reading {DATA_FILE}, resetting to default")
            data = DEFAULT_DATA
            with open(DATA_FILE, 'w') as f:
                json.dump(data, f, indent=2)
            return data

def write_data(data):
    """Write data to the JSON file"""
    with file_lock:
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        logger.debug(f"Updated data file: {data}")

# Routes for WiFi controls

@app.route('/wifi/enabled/<int:state>', methods=['GET', 'POST'])
def set_wifi_enabled(state):
    """Toggle WiFi on/off"""
    logger.info(f"Request to set WiFi enabled to: {state}")
    
    # Ensure state is either 0 or 1
    state = 1 if state == 1 else 0
    
    data = read_data()
    
    # If turning off WiFi, turn off all lights
    if state == 0:
        data["wifi"] = {
            "enabled": 0,
            "one": 0,
            "two": 0,
            "three": 0,
            "blinky": 0
        }
    else:
        # Just update the enabled state
        data["wifi"]["enabled"] = state
    
    write_data(data)
    logger.info(f"WiFi enabled set to: {state}")
    return jsonify({"success": True, "data": data["wifi"]})

@app.route('/wifi/<light>/<int:state>', methods=['GET', 'POST'])
def set_wifi_light(light, state):
    """Set WiFi light state"""
    logger.info(f"Request to set WiFi light {light} to: {state}")
    
    if light not in ['one', 'two', 'three', 'blinky']:
        logger.warning(f"Invalid light name: {light}")
        return jsonify({"success": False, "error": "Invalid light name"}), 400
    
    # Ensure state is either 0 or 1
    state = 1 if state == 1 else 0
    
    data = read_data()
    
    # Only proceed if WiFi is enabled
    if data["wifi"]["enabled"] != 1:
        logger.warning("Cannot set light state: WiFi is disabled")
        return jsonify({"success": False, "error": "WiFi is disabled"}), 400
    
    # Handle the blinky vs regular lights logic
    if light == 'blinky' and state == 1:
        # If turning on blinky, turn off other lights
        logger.info("Turning on blinky, turning off other lights")
        data["wifi"]["one"] = 0
        data["wifi"]["two"] = 0
        data["wifi"]["three"] = 0
        data["wifi"]["blinky"] = 1
    elif light != 'blinky' and state == 1 and data["wifi"]["blinky"] == 1:
        # If turning on a regular light while blinky is on, turn off blinky first
        logger.info(f"Turning on light {light}, turning off blinky")
        data["wifi"]["blinky"] = 0
        data["wifi"][light] = 1
    else:
        # Normal toggle for the specific light
        logger.info(f"Setting light {light} to {state}")
        data["wifi"][light] = state
    
    write_data(data)
    return jsonify({"success": True, "data": data["wifi"]})

# Direct control endpoints for hardware (ESP8266, Arduino, etc.)
@app.route('/<light>/<int:state>', methods=['GET'])
def control_light(light, state):
    """Direct control endpoint for physical light control"""
    logger.info(f"Direct hardware request: light {light} to state {state}")
    
    if light not in ['one', 'two', 'three', 'blinky']:
        return jsonify({"success": False, "error": "Invalid light name"}), 400
    
    # This endpoint would send commands to actual hardware
    # For this example, we'll just update our state file
    
    data = read_data()
    
    # Only update if WiFi is enabled (for consistency with the app logic)
    if data["wifi"]["enabled"] == 1:
        if light == 'blinky' and state == 1:
            # If turning on blinky, turn off others
            data["wifi"]["one"] = 0
            data["wifi"]["two"] = 0
            data["wifi"]["three"] = 0
            data["wifi"]["blinky"] = 1
        elif light != 'blinky' and state == 1 and data["wifi"]["blinky"] == 1:
            # If turning on a regular light while blinky is on, turn off blinky
            data["wifi"]["blinky"] = 0
            data["wifi"][light] = 1
        else:
            # Normal toggle
            data["wifi"][light] = state
        
        write_data(data)
    
    return jsonify({
        "success": True, 
        "light": light, 
        "state": state,
        "currentState": data["wifi"]
    })

# Data retrieval route
@app.route('/wifi', methods=['GET'])
def get_wifi_data():
    """Get WiFi data"""
    data = read_data()
    return jsonify(data["wifi"])

# Testing route - useful for checking the server is working
@app.route('/', methods=['GET'])
def index():
    """Server status and data"""
    return jsonify({
        "status": "running",
        "data": read_data()
    })

if __name__ == '__main__':
    # Initialize the data file
    init_data_file()
    
    # Run the Flask app - allowing connections from any device on the network
    logger.info("Starting WiFi Light Control Server on port 3000")
    app.run(host='0.0.0.0', port=3000, debug=True)