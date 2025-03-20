from flask import Flask, jsonify, request
import json
import os
import threading
import time

app = Flask(__name__)

# File to store the light states
LIGHT_STATE_FILE = 'light_state.json'

# Global variables for blinky control
blinky_active = False
blinky_thread = None
blinky_interval = 0.5  # half-second blink interval

# Initialize the JSON file if it doesn't exist
def initialize_light_state():
    if not os.path.exists(LIGHT_STATE_FILE):
        with open(LIGHT_STATE_FILE, 'w') as file:
            json.dump({
                "one": 0,
                "two": 0,
                "three": 0,
                "blinky": 0
            }, file)

# Helper function to update a specific light state
def update_light_state(light_id, state):
    current_state = read_light_state()
    current_state[light_id] = state
    
    with open(LIGHT_STATE_FILE, 'w') as file:
        json.dump(current_state, file)
    
    return current_state

# Helper function to read all light states
def read_light_state():
    try:
        with open(LIGHT_STATE_FILE, 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        initialize_light_state()
        return {"one": 0, "two": 0, "three": 0, "blinky": 0}

# Blinky function that will run in a separate thread
def blinky_function():
    global blinky_active
    blinky_status = 1  # Start with ON state
    
    while blinky_active:
        # Toggle between 0 and 1
        blinky_status = 1 - blinky_status
        
        # Read the current state
        current_state = read_light_state()
        
        # Only update if blinky is still enabled
        if current_state["blinky"] == 1:
            # Update all three lights to the same state
            update_light_state("one", blinky_status)
            update_light_state("two", blinky_status)
            update_light_state("three", blinky_status)
            
            # Sleep for the blink interval
            time.sleep(blinky_interval)
        else:
            # Exit if blinky was disabled
            break

# Route for the root endpoint
@app.route('/')
def index():
    current_state = read_light_state()
    return jsonify({
        "status": "running",
        "current_state": current_state
    })

# Routes for individual lights with dynamic state
@app.route('/<light_id>/<int:state>')
def control_light(light_id, state):
    global blinky_active, blinky_thread
    
    # Validate light_id
    if light_id not in ["one", "two", "three", "blinky"]:
        return jsonify({
            "status": "error",
            "message": "Invalid light ID. Use 'one', 'two', 'three', or 'blinky'."
        }), 400
    
    # Validate state
    if state not in [0, 1]:
        return jsonify({
            "status": "error",
            "message": "Invalid state value. Use 0 or 1."
        }), 400
    
    # Handle blinky functionality
    if light_id == "blinky":
        if state == 1:
            # Start blinking
            blinky_active = True
            update_light_state("blinky", 1)
            
            # Start a new thread for blinking if not already running
            if blinky_thread is None or not blinky_thread.is_alive():
                blinky_thread = threading.Thread(target=blinky_function)
                blinky_thread.daemon = True  # Thread will exit when the main program exits
                blinky_thread.start()
        else:
            # Stop blinking
            blinky_active = False
            update_light_state("blinky", 0)
            
            # Wait for thread to finish if it's running
            if blinky_thread and blinky_thread.is_alive():
                blinky_thread.join(timeout=1.0)
                blinky_thread = None
    else:
        # If turning on a regular light while blinky is active, stop blinky
        if state == 1 and read_light_state()["blinky"] == 1:
            blinky_active = False
            update_light_state("blinky", 0)
            if blinky_thread and blinky_thread.is_alive():
                blinky_thread.join(timeout=1.0)
                blinky_thread = None
        
        # Update the light state
        update_light_state(light_id, state)
    
    return jsonify({
        "status": "success",
        "message": f"{light_id.capitalize()} turned {'ON' if state == 1 else 'OFF'}",
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
    if light_id not in ["one", "two", "three", "blinky"]:
        return jsonify({
            "status": "error",
            "message": "Invalid light ID. Use 'one', 'two', 'three', or 'blinky'."
        }), 400
    
    state = read_light_state()
    return jsonify({
        "status": "success",
        "light": light_id,
        "state": state[light_id]
    })

# Debug route to set the blink interval
@app.route('/blinky/interval/<float:seconds>')
def set_blinky_interval(seconds):
    global blinky_interval
    
    # Validate interval
    if seconds < 0.1 or seconds > 5.0:
        return jsonify({
            "status": "error",
            "message": "Interval must be between 0.1 and 5.0 seconds."
        }), 400
    
    blinky_interval = seconds
    return jsonify({
        "status": "success",
        "message": f"Blinky interval set to {seconds} seconds"
    })

if __name__ == '__main__':
    # Initialize the light state file
    initialize_light_state()
    
    # Run the Flask app on port 3000
    app.run(host='0.0.0.0', port=3000, debug=True)