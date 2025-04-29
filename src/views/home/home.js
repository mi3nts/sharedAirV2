import Sensor from "@/components/sensor";
import sensorData from "../../services/sensor-data";
import purpleAirData from "../../services/purpleair-data";
import openAqData from "../../services/openaq-data";
import epaData from "../../services/epa-data";
import Vue from 'vue';
import vuetify from '../../plugins/vuetify';

/**
 * Main landing page with all map functionality
 */
export default {
    name: "home",
    components: {
        Sensor
    },
    data: function () {
        return {
            map: null,
            /** Currently clicked sensor is stored here */
            selectedSensor: null,
            /** Top right layer control */
            layerControl: L.control.layers([], []),
            /** All available layer instances */
            layers: {},
            wind: {
                data_time: null,
                updated_time: null
            },
            radarLayer: false,
            windLayer: false,
            sensorLayer: true,
            epaLayer: false,
            purpleAirLayer: false,
            openAQLayer: false,
            pollutionLayer: false,
            esaSatLayer: false,
            //startDate: null,
            //endDate: null,
            /** Popup controls */
            howToUse: false,
            epaType: "PM25",
            esaSatType: "NO2",
            curESASatType: "NO2",
            /** Currently selected PM type */
            /** If defaults change, you must change all three below values accordingly */
            pmType: "pm2_5",
            dataOverTime: "_latest",
            dataTypeToDisplay: "pm2_5_latest", // pmType + dataOverTime
            sensorLastUpdate: null,
            /** Default state of left side expansion panels */
            activePanel: 0,
            /** All available sensor instances  */
            sensors: [],
            sensorGroup: L.markerClusterGroup({
                disableClusteringAtZoom: 13
            }),
            openAQGroup: L.layerGroup(),
            purpleAirGroup: L.layerGroup(),
            epaGroup: L.layerGroup(),
            pollutionGroup: L.layerGroup(),
        }
    },
    watch: {
        'pmType': function () {
            this.dataTypeToDisplay = this.pmType + this.dataOverTime
            this.refreshSensorIcons()
        },
        'dataOverTime': function () {
            this.dataTypeToDisplay = this.pmType + this.dataOverTime
            this.refreshSensorIcons()
        },
        'purpleAirLayer': function (newValue) {
            if (newValue) {
                this.purpleAirGroup.addTo(this.map)
            } else {
                this.map.removeLayer(this.purpleAirGroup);
            }
        },
        'pollutionLayer': function (newValue) {
            if (newValue) {
                this.pollutionGroup.addTo(this.map)
            } else {
                this.map.removeLayer(this.pollutionGroup);
            }
        },
        'epaLayer': function (newValue) {
            if (newValue) {
                this.epaGroup.addTo(this.map)
            } else {
                this.map.removeLayer(this.epaGroup);
            }
            // When EPA layer is enabled, the OpenAQ layer is also enabled
            //this.openAQLayer = newValue;
        },
        'openAQLayer': function (newValue) {
            if (newValue) {
                this.openAQGroup.addTo(this.map)
            } else {
                this.map.removeLayer(this.openAQGroup);
            }
        },
        'epaType': function () {
            if (this.epaLayer) {
                this.loadEPA(true);
                //this.loadOpenAQ(true);
            }
        },
        'sensorLayer': function (newValue) {
            if (newValue) {
                this.sensorGroup.addTo(this.map)
            } else {
                this.map.removeLayer(this.sensorGroup);
            }
        },
        'radarLayer': function (newValue) {
            if (newValue) {
                this.layers.radar.addTo(this.map)
            } else {
                this.map.removeLayer(this.layers.radar);
            }
        },
        // Watches if the ESA layer should be displayed
        'esaSatLayer': function (newValue) {
            if (newValue) {
                this.loadESALayerByType()
            } else {
                this.unloadESALayer()
            }
        },
        // Watches what ESA satilite layer type should be displayed
        'esaSatType': function (newValue) {
            if (newValue) {
                this.loadESALayerByType()
            } else {
                this.unloadESALayer()
            }
        },
        'windLayer': function (newValue) {
            if (newValue) {
                this.layers.wind_layer.addTo(this.map);
            } else {
                this.map.removeLayer(this.layers.wind_layer);
            }
        }
    },
    mounted: function () {
        // If the page is less than 600px wide, the sidebar starts off hidden
        if ($(window).width() < 600) {
            this.slide();
        }

        /** 
         * Let's first build the layers. Notice that map is not ready yet.
         * We are building layers not rendering them
         */
        this.buildLayers();
        /**
         * Now let's kick off the map and start rendering
         */
        this.initMap();
        /**
         * This will load sensor data from remote API
         */
        this.loadData();
        /**
         * This will load data from OpenAQ API
         */
        this.loadOpenAQ();
        /**
         * This will load data from PurpleAir API
         */
        this.loadEPA();
        /**
         * This will load data from PurpleAir API
         */
        this.loadPurpleAir();

        /**
         * This will load data from local json file
         */
        this.loadPollution();

        /**
         * Bind icons to accordions
         */
        this.bindIconsToAccordian();

    },
    methods: {
        buildLayers: function () {
            /** Bright Layer */
            this.layers.bright = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 23
            });
            this.layerControl.addBaseLayer(this.layers.bright, "Carto Positron");

            /** Dark Layer */
            this.layers.dark_mode = L.tileLayer(
                "http://{s}.sm.mapstack.stamen.com/" +
                "(toner-lite,$fff[difference],$fff[@23],$fff[hsl-saturation@20])/" +
                "{z}/{x}/{y}.png", {
                    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, ' +
                        'NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
                }
            );
            this.layerControl.addBaseLayer(this.layers.dark_mode, "Dark Mode");

            /** Satellite Layer */
            this.layers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            });
            this.layerControl.addBaseLayer(this.layers.satellite, "Satellite");

            /** Street Layer */
            this.layers.streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                //detectRetina: true,
                attribution: '&amp;copy; &lt;a href="https://www.openstreetmap.org/copyright"&gt;OpenStreetMap&lt;/a&gt; contributors'
            });
            this.layerControl.addBaseLayer(this.layers.streets, "Street Maps");

            /** Radar Layer */
            this.layers.radar = L.tileLayer.wms(
                "http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi", {
                    layers: 'nexrad-n0r',
                    format: 'image/png',
                    transparent: true,
                    opacity: 0.3,
                    attribution: "Weather data &copy; 2015 IEM Nexrad",
                    zIndex: 1000
                }
            );

            /** 
             * ESA Satilite Layers
             * Contains modified Copernicus Sentinel data 2020
             */
            // NO2
            this.layers.esaSatNO2Layer = L.tileLayer.wms(
                "https://creodias.sentinel-hub.com/ogc/wms/76b060fd-9af7-43f6-bcdc-419c2375c581", {
                    layers: 'NO2',
                    format: 'image/png',
                    transparent: true,
                    opacity: 0.3,
                    attribution: "European Space Agency - Contains modified Copernicus Sentinel data 2020",
                    zIndex: 1100
                }
            )

            // CO
            this.layers.esaSatCOLayer = L.tileLayer.wms(
                "https://creodias.sentinel-hub.com/ogc/wms/76b060fd-9af7-43f6-bcdc-419c2375c581", {
                    layers: 'CO',
                    format: 'image/png',
                    transparent: true,
                    opacity: 0.3,
                    attribution: "European Space Agency - Contains modified Copernicus Sentinel data 2020",
                    zIndex: 1200
                }
            )

            // CH4
            this.layers.esaSatCH4Layer = L.tileLayer.wms(
                "https://creodias.sentinel-hub.com/ogc/wms/76b060fd-9af7-43f6-bcdc-419c2375c581", {
                    layers: 'CH4',
                    format: 'image/png',
                    transparent: true,
                    opacity: 0.3,
                    attribution: "European Space Agency - Contains modified Copernicus Sentinel data 2020",
                    zIndex: 1300
                }
            )

            /** Wind Layer */
            this.buildWindLayer('Carto Positron', true);
        },
        windColorScale: function (layerName) {
            var dark = [
                "rgb(36,104, 180)",
                "rgb(60,157, 194)",
                "rgb(128,205,193 )",
                "rgb(151,218,168 )",
                "rgb(198,231,181)",
                "rgb(238,247,217)",
                "rgb(255,238,159)",
                "rgb(252,217,125)",
                "rgb(255,182,100)",
                "rgb(252,150,75)",
                "rgb(250,112,52)",
                "rgb(245,64,32)",
                "rgb(237,45,28)",
                "rgb(220,24,32)",
                "rgb(180,0,35)"
            ];

            var light = [
                "rgb(219,151,75)",
                "rgb(195,98,61)",
                "rgb(127,50,62)",
                "rgb(104,37,87)",
                "rgb(57,24,87)",
                "rgb(17,8,38)",
                "rgb(0,17,38)",
                "rgb(3,38,130)",
                "rgb(0,73,155)",
                "rgb(3,105,180)",
                "rgb(5,143,203)",
                "rgb(10,191,223)",
                "rgb(18,210,227)",
                "rgb(35,231,223)",
                "rgb(75,255,220)"
            ];


            if (layerName == "Dark Mode" || layerName == "Satellite") {
                return dark;
            } else {
                return light;
            }
        },
        buildWindLayer: function (layerName, addWhenready) {
            sensorData.getWindData().then(response => {
                this.layers.wind_layer = L.velocityLayer({
                    displayValues: true,
                    displayOptions: {
                        velocityType: 'GBR Wind',
                        position: 'bottomright', //REQUIRED !
                        emptyString: 'No velocity data', //REQUIRED !
                        angleConvention: 'bearingCW',
                        displayPosition: 'topright',
                        displayEmptyString: 'No velocity data',
                        speedUnit: 'm/s'
                    },
                    data: response.data,
                    maxVelocity: 10,
                    colorScale: this.windColorScale(layerName)
                });
                this.wind.data_time = response.data[0].recorded_time.replace(".000Z", "");
                this.wind.updated_time = response.data[0].header.refTime.replace(".000Z", "")
                if (addWhenready) {
                    this.windLayer = true;
                }
            });
        },
        bindIconsToAccordian: function () {
            $('#PurpleAir').append(this.getPentagonMarker("#9370DB", "#ffff9e", 25, ''));
            $('#EPA').append(this.getSquareMarker("#6B8E23", "#ffff9e", 25, ''));
            //$('#EPA').append(this.getHexagonMarker("#66CDAA", "#ffff9e", 25, ''));
            $('#DFW').append(this.getCircleMarker("#38b5e6", "#ffff9e", 25, ''));
            $('#pollution').append(this.getCircleMarker("#38b5e6", "#000000", 20, ''));
        },
        initMap: function () {
            this.map = L.map('map', {
                center: [32.89746164575043, -97.04086303710938],
                zoom: 10,
                layers: this.layers.bright,
                zoomControl: false
            });
            window["lmap"] = this.map;
            this.map.addControl(L.control.zoom({
                position: 'topright'
            }));
            this.map.doubleClickZoom.disable();
            this.layerControl.addTo(this.map);
            this.sensorGroup.addTo(this.map);
            L.control.scale({
                position: 'bottomright'
            }).addTo(this.map);
            this.map.on('baselayerchange', (event) => {
                var previousValue = this.windLayer;
                this.windLayer = false;
                this.buildWindLayer(event.name, previousValue);
            });
        },
        loadPurpleAir: function () {
            purpleAirData.getData().then(results => {
                results.forEach(result => {
                    this.renderPurpleAir(result);
                });
            });
        },
        loadPollution: function () {
            this.$axios.get("/json/PollutionBurdenByCouncilDistrict.json").then(response => {
                response.data.forEach(item => {
                    this.renderPollution(item);
                });
            });
        },
        renderPollution: function (location) {
            location.marker = L.marker([location.Latitude, location.Longitude], {
                icon: L.divIcon({
                    className: 'svg-icon',
                    html: this.getCircleMarker("#38b5e6", "#000000", 20, ''),
                    iconAnchor: [20, 10],
                    iconSize: [20, 32],
                    popupAnchor: [0, -30]
                })
            })
            location.marker.addTo(this.pollutionGroup);
            var popup = "<div style='font-size:14px'>";
            popup += "<div style='text-align:center; font-weight:bold;'>" + location['SITE'] + " </div><br>";
            popup += "<div style='text-align:center;'>" + location['COMPANY'] + " </div><br>";
            popup += "<li> PM10 TPY : " + (location['PM10 TPY'] || 'N/A') + " </li><br>";
            popup += "<li> CO TPY : " + (location['CO TPY'] || 'N/A') + " </li><br>";
            popup += "<li> NOX TPY : " + (location['NOX TPY'] || 'N/A') + " </li><br>";
            popup += "<li> Pb TPY : " + (location['Pb TPY'] || 'N/A') + " </li><br>";
            popup += "<li> VOC TPY : " + (location['VOC TPY'] || 'N/A') + " </li><br>";
            popup += "<li> SO2 TPY : " + (location['SO2 TPY'] || 'N/A') + " </li><br>";
            popup += "</div>";
            location.marker.bindPopup(popup);
        },

        renderPurpleAir: function (location) {
            var timeDiffHours = this.$moment.duration(this.$moment.utc().diff(this.$moment.unix(location.last_seen))).asHours();
            var fillColor = timeDiffHours > 24 ? '#808080' : this.getMarkerColor(location['pm2.5']);
            location.marker = L.marker([location.latitude, location.longitude], {
                icon: L.divIcon({
                    className: 'svg-icon',
                    html: this.getPentagonMarker("#9370DB", fillColor, 40, location["pm2.5"]),
                    iconAnchor: [20, 10],
                    iconSize: [20, 32],
                    popupAnchor: [0, -30]
                })
            })
            location.marker.addTo(this.purpleAirGroup);
            var popup = "<div style='font-size:14px'>";
            popup += "<div style='text-align:center; font-weight:bold'>" + location.sensor_index + " </div><br>";
            //Using channel A
            popup += "<li class='pm25'> PM2.5 : " + location["pm2.5"] + " µg/m³ </li><br>";
            popup += "<li> PM1 : " + location["pm1.0"] + " µg/m³ </li><br>";
            popup += "<li> PM10 : " + location["pm10.0"] + " µg/m³ </li><br>";
            popup += "<li> Temperature : " + location.temperature + "°F </li><br>";
            popup += "<li> Humidity : " + location.humidity + "% </li><br>";
            let unix_timestamp = location.last_seen;
            var a = new Date(unix_timestamp * 1000);
            var months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
            var year = a.getFullYear();
            var month = months[a.getMonth()];
            var date = a.getDate();
            var hour = a.getHours();
            var min = a.getMinutes();
            var sec = a.getSeconds();
            var time = year + '-' + month + '-' + date + ' ' + hour + ':' + min + ':' + sec;
            popup += "<div style='text-align:right; font-size: 11px'>Last Updated: " + time + " UTC</div>";
            popup += "</div>";
            location.marker.bindPopup(popup);
        },
        /**
         * Loads data from the OpenAQ data source. 
         * Does not render the data.
         */
        loadOpenAQ: function (refresh) {
            // Recreates layer so old markers are eliminated and new markers with updated values
            //   can be easily shown
            if (refresh) {
                this.map.removeLayer(this.openAQGroup);
                this.openAQGroup = L.layerGroup();
                this.openAQGroup.addTo(this.map);
            }
            // Network retrieval
            openAqData.getLatestCityData().then(response => {
                response.data.results.forEach(result => {
                    this.renderOpenAQ(result);
                });
            });
        },
        /**
         * Renders OpenAQ data
         */
        renderOpenAQ: function (location) {
            var parameter = this.epaType.toLocaleLowerCase();
            location.measurements.forEach((measurement) => {
                if (parameter != measurement.parameter) {
                    return;
                }
                // Create marker
                var markerValue = '';
                if (measurement.parameter == "pm25") {
                    fillColor = this.getMarkerColor(measurement.value);
                    markerValue = measurement.value;
                }

                var timeDiffHours = this.$moment.duration(this.$moment.utc().diff(this.$moment.utc(measurement.lastUpdated))).asHours();
                var fillColor = timeDiffHours > 24 ? '#808080' : "#6B8E23";

                location.marker = L.marker([location.coordinates.latitude, location.coordinates.longitude], {
                    icon: L.divIcon({
                        className: 'svg-icon',
                        html: this.getSquareMarker("#6B8E23", fillColor, 40, markerValue),
                        iconAnchor: [20, 10],
                        iconSize: [20, 32],
                        popupAnchor: [0, -30]
                    })
                })
                location.marker.addTo(this.openAQGroup);

                // Create popup
                var popup = "<div style='font-size:14px'>";
                popup += "<div style='text-align:center; font-weight:bold'>" + location.location + " </div><br>";
                if (measurement.parameter == "pm25") {
                    popup += "<li class='pm25'>" + "PM2.5 : " + measurement.value + " " + measurement.unit + " </li><br>";
                } else if (measurement.parameter == "o3") {
                    popup += "<li>" + "O3 : " + measurement.value + " " + measurement.unit + " </li><br>";
                }
                popup += "<div style='text-align:right; font-size: 11px'>Last Updated: " + location.measurements[0].lastUpdated + " UTC, OpenAQ data</div>";
                popup += "</div>";
                location.marker.bindPopup(popup);
            });
        },
        /**
         * Loads data from the EPA data source. 
         * Does not render the data.
         */
        loadEPA: function (refresh) {
            // Recreates layer so old markers are eliminated and new markers with updated values
            //   can be easily shown
            if (refresh) {
                this.map.removeLayer(this.epaGroup);
                this.epaGroup = L.layerGroup();
                this.epaGroup.addTo(this.map);
            }
            // Network retrieval
            // epaData.getLatestCityData(this.epaType).then(response => {
            //     epaData.getTceqData().then(tceqResp => {
            //         tceqResp.data.forEach(item => {
            //             response.data.push(item);
            //         });
            //         response.data.forEach(result => {
            //             this.renderEPA(result);
            //         })
            //     });

            // });

            epaData.getTceqData().then(tceqResp => {
                tceqResp.data.forEach(item => {
                    this.renderEPA(item);
                });
            });
        },
        /**
         * Renders EPA data
         */
        renderEPA: function (location) {
            // Create marker

            var PM_value = "";
            if (location.Parameter == "PM2.5") {
                fillColor = this.getMarkerColor(location.Value)
                PM_value = location.Value;
            }
            var timeDiffHours = this.$moment.duration(this.$moment.utc().diff(this.$moment.utc(location.UTC))).asHours();
            var fillColor = timeDiffHours > 24 ? '#808080' : this.getMarkerColor(Number(location.Value));
            location.marker = L.marker([location.Latitude, location.Longitude], {
                icon: L.divIcon({
                    className: 'svg-icon',
                    //html: this.getOctagonMarker("#66CDAA", fillColor, 40, PM_value),
                    html: this.getSquareMarker("#66CDAA", fillColor, 40, PM_value),
                    iconAnchor: [20, 10],
                    iconSize: [20, 32],
                    popupAnchor: [0, -30]
                })
            })
            location.marker.addTo(this.epaGroup);

            // Create popup
            var popup = "<div style='font-size:14px'>";
            popup += "<div style='text-align:center; font-weight:bold'>" + location.SiteName + " </div><br>";
            popup += "<li class='" + (location.Parameter == 'PM2.5' ? 'pm25' : '') + "'> " + location.Parameter + " : " + location.Value + " µg/m³ </li><br>";
            popup += "<div style='text-align:right; font-size: 11px'>Last Updated: " + location.UTC + " UTC, EPA data</div>";
            popup += "</div>";
            location.marker.bindPopup(popup);
        },
        
        /**
         * Loads ESA satilite layers onto the map
         */
        loadESALayerByType: function () {
            if (this.esaSatLayer == true) {
                // Check to see if the current layer should be unloaded if the new, 
                //   selected layer is different
                if (this.curESASatType != this.esaSatType) {
                    this.unloadESALayer()
                }
                // Load the new satilite layer based on the current selection, then set the 
                //   currently selected layer
                if (this.esaSatType == "NO2") {
                    this.layers.esaSatNO2Layer.addTo(this.map);
                    this.curESASatType = this.esaSatType
                } else if (this.esaSatType == "CO") {
                    this.layers.esaSatCOLayer.addTo(this.map);
                    this.curESASatType = this.esaSatType
                } else if (this.esaSatType == "CH4") {
                    this.layers.esaSatCH4Layer.addTo(this.map);
                    this.curESASatType = this.esaSatType
                }
            }
        },
        /**
         * Unloads ESA satilite layers from the map
         */
        unloadESALayer: function () {
            if (this.curESASatType == "NO2") {
                this.map.removeLayer(this.layers.esaSatNO2Layer)
            } else if (this.curESASatType == "CO") {
                this.map.removeLayer(this.layers.esaSatCOLayer)
            } else if (this.curESASatType == "CH4") {
                this.map.removeLayer(this.layers.esaSatCH4Layer)
            }
        },


        loadData: function () {
            sensorData.getMainSensorData().then(response => {

                console.log("sensor response");
                console.log(response);
                var i = 0
                response.data.forEach(s => {
                    s.pm1_latest = s.pm1
                    s.pm2_5_latest = s.pm2_5
                    s.pm10_latest = s.pm10
                    this.sensors.push(s)

                    // Create new sensors for display
                    this.renderSensor(s, s.latitude, s.longitude, s.sensor_name, i++)

                    // Fetch additional data (do not chain async calls)
                    // Refresh display when done in case data was not available when sensors were created
                    sensorData.getSensorPastHourAverage(s.sensor_id, 'pm1', 1).then(response => {
                        s.pm1_past_hour = response.data[0].avg
                        this.refreshSensorIcons()
                    })
                    sensorData.getSensorPastHourAverage(s.sensor_id, 'pm2_5', 1).then(response => {
                        s.pm2_5_past_hour = response.data[0].avg
                        this.refreshSensorIcons()
                    })
                    sensorData.getSensorPastHourAverage(s.sensor_id, 'pm10', 1).then(response => {
                        s.pm10_past_hour = response.data[0].avg
                        this.refreshSensorIcons()
                    })

                    // Set last update timestamp
                    var now = new Date()
                    this.sensorLastUpdate = now.toLocaleString('en-US', { timeZone: 'UTC'})
                });
            });
        },
        
        // single click pop up information
        renderSensor: function (sensor, sensorLat, sensorLon, sensorName, zIndexPriority) {
            var timeDiffMinutes = this.$moment.duration(this.$moment.utc().diff(this.$moment.utc(sensor.timestamp))).asMinutes();
            var fillColor = timeDiffMinutes > 60 ? '#808080' : this.getMarkerColor(sensor[this.dataTypeToDisplay]);
            sensor.marker = L.marker([sensorLat, sensorLon], {
                icon: L.divIcon({
                    className: 'svg-icon',
                    html: this.getCircleMarker("#38b5e6", fillColor, 40, parseFloat(sensor[this.dataTypeToDisplay]).toFixed(2), timeDiffMinutes > 60),
                    iconAnchor: [20, 10],
                    iconSize: [20, 32],
                    popupAnchor: [0, -30]
                }),
                title: sensorName,
                alt: sensor.sensor_id,
                zIndexOffset: zIndexPriority * 5 // Ensures more recently updated sensors will remain on top
            });

            //handles click event for single click events
            sensor.marker.addTo(this.sensorGroup);
            var popup = L.popup({
                offset: L.point(-150, 45),
                maxWidth: '300px',
                autoPan: true,
                keepInView: true
            }).setContent("<div id='flyCard'></div>");

            sensor.marker.bindPopup(popup);
            sensor.marker.on('click', () => {
                this.selectedSensor = sensor;
            });

            sensor.marker.on('popupopen', function (e) {
                // Create new pop up vue component and...
                var newPopup = new Vue({
                    vuetify,
                    render: h => h(Sensor, {
                        props: {
                            spot: sensor,
                            spotName: sensorName
                        }
                    })
                })
                newPopup.$mount("#flyCard")

                // ...track it in the marker component for destruction later
                e.popup._source.sensorPopup = newPopup
            });

            // Destroy pop up dialogue after the user closes it
            sensor.marker.on('popupclose', function (e) {
                e.popup._source.sensorPopup.$destroy("#flyCard")
            })
        },
        refreshSensorIcons() {
            this.sensors.forEach(sensor => {
                // Safety check in case the async data fetch for past hour average does not complete in time, thus preventing a site
                //   crash client-side due to a missing object member variable
                if(this.dataTypeToDisplay in sensor) {
                    var timeDiffMinutes = this.$moment.duration(this.$moment.utc().diff(this.$moment.utc(sensor.timestamp))).asMinutes();
                    var fillColor = timeDiffMinutes > 60 ? '#808080' : this.getMarkerColor(sensor[this.dataTypeToDisplay]);
                    sensor.marker.setIcon(L.divIcon({
                        className: 'svg-icon',
                        html: this.getCircleMarker("#38b5e6", fillColor, 40, parseFloat(sensor[this.dataTypeToDisplay]).toFixed(2), timeDiffMinutes > 60),
                        iconAnchor: [20, 10],
                        iconSize: [20, 32],
                        popupAnchor: [0, -30]
                    }));
                }
            });
        },

        buildMarkerIcon: function (sensor) {
            /** If you change SCG marker,
             *  you need to fine tune  iconAnchor, iconSize & popupAnchor as well*/
            return L.divIcon({
                className: 'svg-icon',
                html: this.getSVGMarker(this.getMarkerColor(sensor)),
                iconAnchor: [20, 10],
                iconSize: [20, 32],
                popupAnchor: [0, -30]
            })
        },
        getMarkerColor(PM) {
            if (PM == 0) return '#808080'
            else if (PM > 0 && PM <= 10) return "#ffff9e" //"#ffff66";
            else if (PM > 10 && PM <= 20) return "#ff6600";
            else if (PM > 20 && PM <= 50) return "#ff5534"; //"#cc0000";
            else if (PM > 50 && PM <= 100) return "#D34FD0"; //"#990099";
            else if (PM > 100) return "#AB5753"; //"#732626";
        },
        slide() {
            var hidden = $('.side-drawer');
            if (hidden.hasClass('visible')) {
                hidden.animate({
                    "left": "-280px"
                }, "slow").removeClass('visible');
            } else {
                hidden.animate({
                    "left": "0px"
                }, "slow").addClass('visible');
            }
        },
        invertHex: function (hex) {
            return (Number(`0x1${hex}`) ^ 0xFFFFFF).toString(16).substr(1).toUpperCase()
        },
        getCircleMarker(color, fill, size, value, lowBattery) {
            var textColor = this.invertHex(fill);
            var svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><circle fill="${fill}" fill-opacity="0.8" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" stroke="${color}" cx="12" cy="12" r="10"></circle><text x="12" y="15" fill="${textColor}" text-anchor="middle" font-family="PT Sans" font-size="8">${value!='NaN'?value :''}</text></svg>`;
            if(lowBattery)
            {
                svg += `<img src="/img/low_battery.png" style="height: 20px;position: absolute;top: 10px;left: 14px;" />`;
            }
            return svg;
        },
        getSquareMarker(color, fill, size, value) {
            var svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><rect fill="${fill}" fill-opacity="0.8" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><text x="12" y="15" style="font-weight: 100" text-anchor="middle" font-family="PT Sans" font-size="8">${value}</text></svg>`;
            return svg;
        },
        getHexagonMarker(color, fill, size, value) {
            var svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="${fill}" fill-opacity="0.8" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 2l9 4.9V17L12 22l-9-4.9V7z"/><text x="12" y="15" style="font-weight: 100" text-anchor="middle" font-family="PT Sans" font-size="8">${value}</text></svg>`;
            return svg;
        },
        getOctagonMarker(color, fill, size, value) {
            var svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><polygon fill="${fill}" fill-opacity="0.8" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><text x="12" y="15" style="font-weight: 100" text-anchor="middle" font-family="PT Sans" font-size="8">${value}</text></svg>`;
            return svg;
        },
        getPentagonMarker(color, fill, size, value) {
            var svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 572 545"><path fill="${fill}" fill-opacity="0.8" stroke="${color}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" d="M 286,10 L 10,210 L 116,535 L 456,535 L 562,210 Z"/><text x="280" y="340" style="font-weight: 400" text-anchor="middle" font-family="PT Sans" font-size="180">${value}</text></svg>`;
            return svg;
        },
        reset() {
            this.unloadESALayer();
            this.selectedSensor = null;
            this.radarLayer = false;
            this.esaSatLayer = false;
            this.windLayer = true;
            this.sensorLayer = true;
            this.epaLayer = false;
            this.purpleAirLayer = false;
            this.openAQLayer = false;
            this.pollutionLayer = false;
            this.howToUse = false;
            this.epaType = "PM25";
            this.esaSatType = "NO2";
            this.curESASatType = "NO2";
            this.pmType = "pm2_5";
            this.activePanel = 0;
            this.map.setView([32.89746164575043, -97.04086303710938], 10);
        }
    }
};
