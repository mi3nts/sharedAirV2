import logging
from influxdb_client import InfluxDBClient
from influxdb_client.client.write_api import SYNCHRONOUS
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Constants
INFLUXDB_URL = "http://mdash.circ.utdallas.edu:8086"
AUTH_TOKEN = os.getenv("AUTH_TOKEN")  # Now fetched from env
ORG = "MINTS"
BUCKET = "SharedAirDFW"

# Configure logging
logging.basicConfig(level=logging.INFO)

class InfluxDBHelper:
    def __init__(self):
        self.client = InfluxDBClient(url=INFLUXDB_URL, token=AUTH_TOKEN, org=ORG)
        self.query_api = self.client.query_api()

    def _build_flux_query(self, start_time, end_time, device_names=None, measurements=None, latest=False):
        """
        Helper method to build a Flux query.
        """
        filters = []
        if device_names:
            device_filter = " or ".join([f'r.device_name == "{name}"' for name in device_names])
            filters.append(f"filter(fn: (r) => {device_filter})")
        
        if measurements:
            measurement_filter = " or ".join([f'r._measurement == "{m}"' for m in measurements])
            filters.append(f"filter(fn: (r) => {measurement_filter})")
        
        range_filter = f'|> range(start: {start_time}, stop: {end_time})' if not latest else '|> range(start: -1m)'
        
        flux_query = f'''
            from(bucket: "{BUCKET}")
            {range_filter}
            {'|> ' + ' |> '.join(filters) if filters else ''}
            |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
        '''
        
        return flux_query

    def get_data(self, start_time, end_time, device_names=None, measurements=None):
        """
        Retrieve data from InfluxDB for specified devices and measurements within a time range.
        """
        try:
            flux_query = self._build_flux_query(start_time, end_time, device_names, measurements)
            return self.query_api.query(flux_query)
        except Exception as e:
            logging.error(f"Error fetching data: {e}")
            return None

    def get_data_for_map(self, start_time, end_time):
        """
        Retrieve data for devices and measurements relevant to an interactive map.
        """
        device_names = ["PoLo Node 13", "PoLo Node 16"]
        measurements = ["BME688CNR", "GPGGAPL", "WIMDA", "IPS7100", "IPS7100CNR", "MBCLR001"]
        return self.get_data(start_time, end_time, device_names, measurements)

    def get_latest_data(self, device_names, measurements):
        """
        Retrieve the most recent data points.
        """
        try:
            flux_query = self._build_flux_query(None, None, device_names, measurements, latest=True)
            return self.query_api.query(flux_query)
        except Exception as e:
            logging.error(f"Error fetching latest data: {e}")
            return None

    def get_device_list(self):
        """
        Retrieve a list of available devices from the database.
        """
        try:
            flux_query = f'''
                from(bucket: "{BUCKET}")
                |> range(start: -1d)
                |> distinct(column: "device_name")
            '''
            return self.query_api.query(flux_query)
        except Exception as e:
            logging.error(f"Error fetching device list: {e}")
            return None

    def get_measurement_list(self):
        """
        Retrieve a list of available measurements from the database.
        """
        try:
            flux_query = f'''
                from(bucket: "{BUCKET}")
                |> range(start: -1d)
                |> distinct(column: "_measurement")
            '''
            return self.query_api.query(flux_query)
        except Exception as e:
            logging.error(f"Error fetching measurement list: {e}")
            return None
