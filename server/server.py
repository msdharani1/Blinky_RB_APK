from flask import Flask, jsonify, request
import json
import os

app = Flask(__name__)

# File to store light states
DATA_FILE = 'light_states.json'

# Initialize the data file if it doesn't exist
if not os.path.exists(DATA_FILE):
    initial_data = {
        "lights": {
            "1": 0,
            "2": 0,
            "3": 0,
            "blink": 0
        }
    }
    with open(DATA_FILE, 'w') as f:
        json.dump(initial_data, f)

def read_states():
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading states: {e}")
        return {"lights": {"1": 0, "2": 0, "3": 0, "blink": 0}}

def write_states(data):
    try:
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f)
            return True
    except Exception as e:
        print(f"Error writing states: {e}")
        return False

@app.route('/test', methods=['GET'])
def test_connection():
    return jsonify({"status": "success", "message": "Server is running"}), 200

@app.route('/on/<light>', methods=['GET'])
def turn_on(light):
    valid_lights = ['1', '2', '3', 'blink']
    if light not in valid_lights:
        return jsonify({"status": "error", "message": f"Invalid light: {light}. Valid options are: 1, 2, 3, blink"}), 400
    
    states = read_states()
    states["lights"][light] = 1
    if write_states(states):
        return jsonify({"status": "success", "light": light, "state": "on"}), 200
    else:
        return jsonify({"status": "error", "message": "Failed to update light state"}), 500

@app.route('/off/<light>', methods=['GET'])
def turn_off(light):
    valid_lights = ['1', '2', '3', 'blink']
    if light not in valid_lights:
        return jsonify({"status": "error", "message": f"Invalid light: {light}. Valid options are: 1, 2, 3, blink"}), 400
    
    states = read_states()
    states["lights"][light] = 0
    if write_states(states):
        return jsonify({"status": "success", "light": light, "state": "off"}), 200
    else:
        return jsonify({"status": "error", "message": "Failed to update light state"}), 500

@app.route('/status', methods=['GET'])
def get_status():
    states = read_states()
    return jsonify({"status": "success", "lights": states["lights"]}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=True)