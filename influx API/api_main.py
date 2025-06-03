from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from getData import InfluxDBHelper
from typing import Optional

app = FastAPI()

# Enable CORS for all origins for development/testing (adjust as needed for prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = InfluxDBHelper()

@app.get("/sensors/list")
def get_sensors_list():
    result = db.get_device_list()
    # Convert result to a simple list of sensor IDs or names (depends on DB query result structure)
    # Here assuming result is a list of records with a "device_name" attribute:
    sensors = []
    try:
        for table in result:
            for record in table.records:
                sensors.append(record.get_value())
    except Exception as e:
        sensors = []
    return {"sensors": sensors}

@app.get("/latest/all/main")
def get_main_sensor_data():
    # You might define main sensors as a fixed list or a DB query
    main_sensors = ["PoLo Node 13", "PoLo Node 16"]
    # Specify the main measurements if needed
    measurements = ["BME688CNR", "IPS7100", "MBCLR001"]  # Example
    data = db.get_latest_data(main_sensors, measurements)
    # Process to expected shape, e.g., list of dicts
    return {"data": serialize_query_result(data)}

@app.get("/sensors/{sensorID}/latest")
def get_sensor_latest(sensorID: str):
    # Specify measurements if needed
    measurements = None  # or a list of main measurements
    data = db.get_latest_data([sensorID], measurements)
    return {"data": serialize_query_result(data)}

@app.get("/latest/average/{type}/{sensorID}/{interval}")
def get_sensor_past_hour_average(sensorID: str, type: str, interval: str):
    # Example: Use db.get_data with a time range for 'interval'
    # interval can be '1h', '24h', etc. You'll need to convert to InfluxDB's time range
    # Assume 'type' is a measurement name
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    # Convert interval string to timedelta 
    if interval.endswith("h"):
        delta = timedelta(hours=int(interval[:-1]))
    elif interval.endswith("d"):
        delta = timedelta(days=int(interval[:-1]))
    else:
        delta = timedelta(hours=1)
    start_time = (now - delta).isoformat() + "Z"
    end_time = now.isoformat() + "Z"
    data = db.get_data(start_time, end_time, [sensorID], [type])
    # Compute average from data result
    avg = compute_average(data)  # You need to implement this
    return {"average": avg}

@app.get("/data/pm2_5/{sensorID}/{start}/{end}")
@app.get("/data/pm2_5/{sensorID}/{start}/{end}/{interval}")
def get_chart_data(sensorID: str, start: str, end: str, interval: Optional[str] = None):
    # PM2.5 measurement is assumed to be "pm2_5" (change as needed)
    measurement = "pm2_5"
    # If interval is specified, use aggregateWindow in your Flux query
    data = db.get_data(start, end, [sensorID], [measurement])
    # Optionally, aggregate data by interval (e.g., average per X minutes)
    chart_data = serialize_query_result(data)
    return {"data": chart_data}

# Helper: serialize InfluxDB query result into JSON-serializable list
def serialize_query_result(result):
    out = []
    try:
        for table in result:
            for record in table.records:
                out.append(record.values)
    except Exception:
        return []
    return out

# Helper: compute average value from InfluxDB query result
def compute_average(result):
    # Example: average "_value" field
    values = []
    try:
        for table in result:
            for record in table.records:
                v = record.get_value()
                if v is not None:
                    values.append(float(v))
    except Exception:
        return None
    return sum(values) / len(values) if values else None
