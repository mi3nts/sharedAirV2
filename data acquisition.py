from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
from datetime import datetime

# Constants
INFLUXDB_URL = "http://mdash.circ.utdallas.edu:8086"
AUTH_TOKEN = "CnFz7L8cgPvnYW4n6-3MsaoAuVEMwgGcryKnPO6dcGH5MzASfGMiZqjcJcLo7rWQH144wumPE_rJu42MBt7AiQ=="
ORG = "MINTS"
BUCKET = "SharedAirDFW"

# Initialize the InfluxDB client
client = InfluxDBClient(url=INFLUXDB_URL, token=AUTH_TOKEN, org=ORG)
query_api = client.query_api()

def get_data_from_influxdb(start_time, end_time, device_names, measurements):
    """
    Retrieve data from InfluxDB for specified devices and measurements within a time range.

    :param start_time: Start time in ISO format (e.g., "2024-06-01T00:00:00Z")
    :param end_time: End time in ISO format (e.g., "2025-01-31T23:59:59Z")
    :param device_names: List of device names to filter (e.g., ["PoLo Node 13", "PoLo Node 16"])
    :param measurements: List of measurements to filter (e.g., ["BME688CNR", "GPGGAPL", "WIMDA"])
    :return: Query results in Flux table structure
    """
    # Construct the Flux query
    device_filter = " or ".join([f'r.device_name == "{name}"' for name in device_names])
    measurement_filter = " or ".join([f'r._measurement == "{measurement}"' for measurement in measurements])
    
    flux_query = f'''
        from(bucket: "{BUCKET}")
          |> range(start: {start_time}, stop: {end_time})
          |> filter(fn: (r) => {device_filter})
          |> filter(fn: (r) => {measurement_filter})
          |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
    '''

    # Execute the query
    result = query_api.query(flux_query)
    return result

def get_data_for_map(start_time, end_time):
    """
    Retrieve data for devices and measurements relevant to displaying on an interactive map.

    :param start_time: Start time in ISO format (e.g., "2024-06-01T00:00:00Z")
    :param end_time: End time in ISO format (e.g., "2025-01-31T23:59:59Z")
    :return: Query results in Flux table structure
    """
    # Define the devices and measurements relevant for the map
    device_names = ["PoLo Node 13", "PoLo Node 16"]
    measurements = ["BME688CNR", "GPGGAPL", "WIMDA", "IPS7100", "IPS7100CNR", "MBCLR001"]
    
    # Retrieve the data
    return get_data_from_influxdb(start_time, end_time, device_names, measurements)

# Example usage
if __name__ == "__main__":
    start_time = "2024-06-01T00:00:00Z"
    end_time = "2025-01-31T23:59:59Z"
    
    try:
        result = get_data_for_map(start_time, end_time)
        
        # Process and print the results
        for table in result:
            for record in table.records:
                print(f"Time: {record.get_time()}, Device: {record.values['device_name']}, Measurement: {record.get_measurement()}, Field: {record.get_field()}, Value: {record.get_value()}")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        # Close the client
        client.close()