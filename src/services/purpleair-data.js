import Vue from "vue";
/**
 * Data service which provides data from Purple Air API to application.
 * End point must support CORS.
 */
export default new Vue({
    data: function () {
        return {
            baseUrl: "https://www.purpleair.com/json",
            sensors: [2508, 2644, 2667, 8516, 8548, 8682, 9504, 12969, 13013, 16271, 22719, 29371, 30327, 31403, 37443, 46221, 47651, 47667, 47677, 47691, 47967, 48401, 49395, 50909, 51321, 51821, 53183, 53239, 53337, 53365, 53389, 54219, 55479, 55821, 55823, 55839, 55853, 56121, 59953, 61493, 62083, 87485, 95175, 95673, 95481, 99163]
        }
    },
    methods: {
        /**
         * More information here
         * https://docs.google.com/document/d/15ijz94dXJ-YAZLi9iZ_RaBwrZ4KtYeCy08goGBwnbCU/edit
         */
        getSensorData: function (sensorID) {
            return this.$axios.get(this.baseUrl + "?show=" + sensorID);
        },
        getData: function () {
            return this.$axios.get("https://api.purpleair.com/v1/sensors", {
                params: {
                    fields: 'icon,location_type,latitude,longitude,altitude,last_seen,channel_state,channel_flags,confidence,pm1.0,pm2.5,pm2.5_10minute,pm2.5_30minute,pm2.5_60minute,pm2.5_6hour,pm2.5_24hour,pm2.5_1week,pm10.0,0.3_um_count,0.5_um_count,1.0_um_count,2.5_um_count,5.0_um_count,10.0_um_count,humidity,temperature,pressure,voc,ozone1,analog_input',
                    nwlng: -97.7233885077807,
                    nwlat: 33.26726487706603,
                    selng: -96.124877880838,
                    selat: 32.40530400517982
                },
                headers :{
                    'X-API-Key' : '05E9B581-837F-11EB-8C3A-42010A800259'
                }
            }).then(response =>{
                let results = [];
                response.data.data.forEach(element => {
                    let item = {};
                    response.data.fields.forEach((field,index) =>{
                        item[field] = element[index];
                    });
                    results.push(item);
                });
                return results;
            });
        }
    }
});
