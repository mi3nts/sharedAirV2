from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from influxdb_client import InfluxDBClient
import time

app = Flask(__name__)
CORS(app)  # Enable cross-origin requests for frontend
socketio = SocketIO(app, cors_allowed_origins="*")  # Enable WebSockets

# InfluxDB Configuration
INFLUXDB_URL = "http://localhost:8086"
INFLUXDB_TOKEN = "5-6qZMPiZeG6biXsU960XjMccOsiTLEC3vH1Se26vNKJmJ-oUev_JeDiIQr05_zktF3PyAz9-R3G62k17F5VhA=="
ORG = "MINTS"
BUCKET = "mints-bucket"


client = InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=ORG)
query_api = client.query_api()

# REST API: Fetch initial sensor data
@app.route('/sensors', methods=['GET'])
def get_sensors():
    query = f'from(bucket: "{BUCKET}") |> range(start: -10m)'
    tables = query_api.query(query, org=ORG)
    
    sensors = []
    for table in tables:
        for record in table.records:
            sensors.append({
                "lat": record.values.get("latitude"),
                "lng": record.values.get("longitude"),
                "value": record.values.get("sensor_value"),
                "time": record.get_time()
            })
    
    return jsonify(sensors)

# WebSocket: Stream real-time sensor updates
def stream_sensor_data():
    while True:
        query = f'from(bucket: "{BUCKET}") |> range(start: -1m)'
        tables = query_api.query(query, org=ORG)
        
        sensors = []
        for table in tables:
            for record in table.records:
                sensors.append({
                    "lat": record.values.get("latitude"),
                    "lng": record.values.get("longitude"),
                    "value": record.values.get("sensor_value"),
                    "time": record.get_time()
                })

        socketio.emit("sensor_update", sensors)  # Send data to frontend
        time.sleep(5)  # Adjust update interval as needed

@socketio.on("connect")
def on_connect():
    print("Client connected!")
    socketio.start_background_task(target=stream_sensor_data)

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)
