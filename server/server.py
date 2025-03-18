from flask import Flask, jsonify
import json
import os

app = Flask(__name__)

# File to store the light states
LIGHT_STATE_FILE = 'light_state.json'

# Initialize the JSON file if it doesn't exist
def initialize_light_state():
    if not os.path.exists(LIGHT_STATE_FILE):
        with open(LIGHT_STATE_FILE, 'w') as file:
            json.dump({
                "one": 0,
                "two": 0,
                "three": 0
            }, file)

# Helper function to update a specific light state
def update_light_state(light_id, state):
    current_state = read_light_state()
    current_state[light_id] = state
    
    with open(LIGHT_STATE_FILE, 'w') as file:
        json.dump(current_state, file)

# Helper function to read all light states
def read_light_state():
    try:
        with open(LIGHT_STATE_FILE, 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        initialize_light_state()
        return {"one": 0, "two": 0, "three": 0}

@app.route('/')
def index():
    current_state = read_light_state()
    return jsonify({
        "status": "running",
        "current_state": current_state
    })

# Routes for individual lights with dynamic state
@app.route('/one/<int:state>')
def light_one(state):
    if state not in [0, 1]:
        return jsonify({
            "status": "error",
            "message": "Invalid state value. Use 0 or 1."
        }), 400
    
    update_light_state("one", state)
    return jsonify({
        "status": "success",
        "message": f"Light 1 turned {'ON' if state == 1 else 'OFF'}",
        "state": state
    })

@app.route('/two/<int:state>')
def light_two(state):
    if state not in [0, 1]:
        return jsonify({
            "status": "error",
            "message": "Invalid state value. Use 0 or 1."
        }), 400
    
    update_light_state("two", state)
    return jsonify({
        "status": "success",
        "message": f"Light 2 turned {'ON' if state == 1 else 'OFF'}",
        "state": state
    })

@app.route('/three/<int:state>')
def light_three(state):
    if state not in [0, 1]:
        return jsonify({
            "status": "error",
            "message": "Invalid state value. Use 0 or 1."
        }), 400
    
    update_light_state("three", state)
    return jsonify({
        "status": "success",
        "message": f"Light 3 turned {'ON' if state == 1 else 'OFF'}",
        "state": state
    })

# Get the current state of all lights
@app.route('/state')
def get_state():
    state = read_light_state()
    return jsonify(state)

# Get the state of a specific light
@app.route('/<light_id>/state')
def get_light_state(light_id):
    if light_id not in ["one", "two", "three"]:
        return jsonify({
            "status": "error",
            "message": "Invalid light ID. Use 'one', 'two', or 'three'."
        }), 400
    
    state = read_light_state()
    return jsonify({
        "status": "success",
        "light": light_id,
        "state": state[light_id]
    })

if __name__ == '__main__':
    # Initialize the light state file
    initialize_light_state()
    
    # Run the Flask app on port 3000
    app.run(host='0.0.0.0', port=3000, debug=True)