from flask import Flask, jsonify
import json
import os

app = Flask(__name__)

# File to store the light state
LIGHT_STATE_FILE = 'light_state.json'

# Initialize the JSON file if it doesn't exist
def initialize_light_state():
    if not os.path.exists(LIGHT_STATE_FILE):
        with open(LIGHT_STATE_FILE, 'w') as file:
            json.dump({"light": {"state": 0}}, file)

# Helper function to update the light state
def update_light_state(state):
    with open(LIGHT_STATE_FILE, 'w') as file:
        json.dump({"light": {"state": state}}, file)

# Helper function to read the light state
def read_light_state():
    try:
        with open(LIGHT_STATE_FILE, 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        initialize_light_state()
        return {"light": {"state": 0}}

@app.route('/')
def index():
    current_state = read_light_state()
    return jsonify({
        "status": "running",
        "current_state": current_state
    })

@app.route('/on')
def turn_on():
    update_light_state(1)
    return jsonify({
        "status": "success",
        "message": "Light turned ON",
        "state": 1
    })

@app.route('/off')
def turn_off():
    update_light_state(0)
    return jsonify({
        "status": "success",
        "message": "Light turned OFF",
        "state": 0
    })

@app.route('/state')
def get_state():
    state = read_light_state()
    return jsonify(state)

if __name__ == '__main__':
    # Initialize the light state file
    initialize_light_state()
    
    # Run the Flask app on port 3000
    app.run(host='0.0.0.0', port=3000, debug=True)