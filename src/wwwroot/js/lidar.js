﻿const connection = new signalR.HubConnectionBuilder()
    .withUrl("/lidarHub")
    .configureLogging(signalR.LogLevel.Information)
    .build();

async function start() {
    try {
        await connection.start();
        console.log("connected");
    } catch (err) {
        console.log(err);
        setTimeout(() => start(), 5000);
    }
};


connection.onclose(async () => {
    await start();
});

// Start the connection.
start();


let chart; // global
let chartnozone;
let chartzone1;
let chartzone2;


connection.on("ReceiveLidarData", (lidardata) => {

    var zonelist = []; //global variable

    const lidar_data = JSON.parse(lidardata);
    //const lidar_data = lidardata;
    console.log(typeof (lidar_data));
    console.log('lidar_data', lidar_data);


    var header = lidar_data.header;
    var zone = lidar_data.zones
    var object = lidar_data.object;

    console.log('zone', zone);
    console.log('object', object);

    let unix_timestamp = header.timestamp;

    var date = timeConverter(unix_timestamp);

    $('#timestamp').empty().append("DateTime: " + date.toLocaleString());
    $('#objectcounts').empty().append("Total Objects: " + object.length);

    let human = 0;
    let ignore = 0;
    let unitentify = 0;

    var divContainer = document.getElementById("showData");
    divContainer.innerHTML = "";

    if (zone.length > 0) {
        for (var z in zone) {

            var div_id = zone[z].name.replace(/\s+/g, '');

            var data_objs = [{ x: 0, y: 0, label: "Sensor" }];
            var labels_obj = [];


            var objects = [{
                id: 0,
                position: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                velocity: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                timestamp: zone[z].timestamp,
            }];

            zonelist.push({ zone: zone[z].name.replace(/\s+/g, '').toLowerCase(), objects });
            for (var id in zone[z].objectIds) {

                for (var i in object) {
                    if (object[i].id == zone[z].objectIds[id]) {

                        const expr = object[i].objectClass.toUpperCase();
                        switch (expr) {
                            case 'HUMAN':
                                human += 1;
                                break;
                            case 'IGNORED':
                                human += 1;
                            case 'UNIDENTIFIED':
                                human += 1;
                                break;
                            default:

                        }

                        data_objs.push({ x: GetPoint(object[i].position.x), y: GetPoint(object[i].position.y), label: "Id:" + object[i].id, distance: 1 })
                        objects.push(object[i]);
                    }


                }
            }

            for (var i = 0; i < objects.length - 1; i++) {

                var i_id = objects[i].id;
                var j_id = objects[i + 1].id;

                var x1 = objects[i].position.x;
                var y1 = objects[i].position.y;
                var z1 = objects[i].position.z;
                var xyz1 = [x1, y1, z1];

                var x2 = objects[i + 1].position.x;
                var y2 = objects[i + 1].position.y;
                var z2 = objects[i + 1].position.z;
                var xyz2 = [x2, y2, z2];

                var distance = GetDistance(xyz1, xyz2);

                labels_obj.push({
                    point: {
                        xAxis: 0, yAxis: 0, x: ((GetPoint(objects[i + 1].position.x)) + (GetPoint(objects[i].position.x))) / 2,
                        y: ((GetPoint(objects[i + 1].position.y)) + (GetPoint(objects[i].position.y))) / 2
                    }
                    , text: 'Distance between Id: ' + objects[i].id + ' and ' + objects[i + 1].id + '= ' + distance + 'm'
                })

            }
            console.log("Data: ", data_objs);
            console.log("labels_obj: ", labels_obj);



            var check_div = '#' + div_id;
            //if ($(check_div).length <= 0) {
            var newDiv = document.createElement("div");

            console.log(div_id);
            newDiv.setAttribute("id", div_id);
            divContainer.appendChild(newDiv);


            if (z == 0) {
                //----Start High Chart
                chartzone1 = new Highcharts.chart(div_id, {

                    title: {
                        text: zone[z].name
                    },

                    yAxis: {
                        title: {
                            text: 'Y'
                        },
                        tickInterval: 0.5,
                        gridLineWidth: 1
                    },

                    xAxis: {
                        title: {
                            text: 'X'
                        },
                        tickInterval: 0.5,
                        gridLineWidth: 1
                    },

                    legend: {
                        layout: 'vertical',
                        align: 'right',
                        verticalAlign: 'middle'
                    },

                    plotOptions: {
                        line: {
                            dataLabels: {
                                enabled: true,
                                formatter: function () {
                                    return this.point.label;
                                }
                            },
                            enableMouseTracking: true
                        },
                    },

                    series: [{
                        name: zone[z].name,
                        data: data_objs
                    }],

                    tooltip: {
                        formatter: function () {
                            var current_index = this.point.index;

                            console.log('zonelist: ', zonelist);
                            for (var i in zonelist) {
                                if (zonelist[i].zone == (this.series.name).replace(/\s+/g, '').toLowerCase()) {

                                    var average_speed = GetSpeed(zonelist[i].objects[current_index].velocity);

                                    var additionalString = '<br>Speed: ' + average_speed + ' m/s <br>Distance:<br>';
                                    for (var o in zonelist[i].objects) {
                                        if (o != current_index) {

                                            var objectsdistance = GetDistance(zonelist[i].objects[current_index].position, zonelist[i].objects[o].position);

                                            additionalString = additionalString + 'Id: ' + zonelist[i].objects[current_index].id + ' to Id:' + zonelist[i].objects[o].id + '= ' + objectsdistance + 'm <br>';
                                        }
                                    }
                                }
                            }

                            return additionalString
                        }

                    },
                    responsive: {
                        rules: [{
                            condition: {
                                maxWidth: 500
                            },
                            chartOptions: {
                                legend: {
                                    layout: 'horizontal',
                                    align: 'center',
                                    verticalAlign: 'bottom'
                                }
                            }
                        }]
                    }

                });
                //----End High Chart
            }
            else {
                //----Start High Chart
                chartzone2 = new Highcharts.chart(div_id, {

                    title: {
                        text: zone[z].name
                    },

                    yAxis: {
                        title: {
                            text: 'Y'
                        },
                        tickInterval: 0.5,
                        gridLineWidth: 1
                    },

                    xAxis: {
                        title: {
                            text: 'X'
                        },
                        tickInterval: 0.5,
                        gridLineWidth: 1
                    },

                    legend: {
                        layout: 'vertical',
                        align: 'right',
                        verticalAlign: 'middle'
                    },

                    plotOptions: {
                        line: {
                            dataLabels: {
                                enabled: true,
                                formatter: function () {
                                    return this.point.label;
                                }
                            },
                            enableMouseTracking: true
                        },
                    },

                    series: [{
                        name: zone[z].name,
                        data: data_objs
                    }],

                    tooltip: {
                        formatter: function () {
                            var current_index = this.point.index;

                            console.log('zonelist: ', zonelist);
                            for (var i in zonelist) {
                                if (zonelist[i].zone == (this.series.name).replace(/\s+/g, '').toLowerCase()) {

                                    var average_speed = GetSpeed(zonelist[i].objects[current_index].velocity);

                                    var additionalString = '<br>Speed: ' + average_speed + ' m/s <br>Distance:<br>';
                                    for (var o in zonelist[i].objects) {
                                        if (o != current_index) {

                                            var objectsdistance = GetDistance(zonelist[i].objects[current_index].position, zonelist[i].objects[o].position);

                                            additionalString = additionalString + 'Id: ' + zonelist[i].objects[current_index].id + ' to Id:' + zonelist[i].objects[o].id + '= ' + objectsdistance + 'm <br>';
                                        }
                                    }
                                }
                            }

                            return additionalString
                        }

                    },
                    responsive: {
                        rules: [{
                            condition: {
                                maxWidth: 500
                            },
                            chartOptions: {
                                legend: {
                                    layout: 'horizontal',
                                    align: 'center',
                                    verticalAlign: 'bottom'
                                }
                            }
                        }]
                    }

                });
                //----End High Chart
            }

            //} else {

            //    const point = [{
            //        name: zone[z].name,
            //        data: data_objs
            //    }]
            //    if (z == 0) {
            //        chartzone1.series[0].addPoint(point, true);
            //        //chartzone1.tooltip
            //    }
            //    else {
            //        chartzone2.series[0].addPoint(point, true);
            //    }

            //}
        }
    }
    else {//----Start High Chart
        var div_id = "allzone";

        var data_objs = [{ x: 0, y: 0, label: "Sensor" }];
        var labels_obj = [];


        var objects = [{
            id: 0,
            position: {
                x: 0,
                y: 0,
                z: 0
            },
            velocity: {
                x: 0,
                y: 0,
                z: 0
            },
            timestamp: header.timestamp,
        }];

        zonelist.push({ zone: div_id, objects });
        //for (var id in zone[z].objectIds) {

        for (var i in object) {

            const expr = object[i].objectClass.toUpperCase();
            switch (expr) {
                case 'HUMAN':
                    human += 1;
                    break;
                case 'IGNORED':
                    human += 1;
                case 'UNIDENTIFIED':
                    human += 1;
                    break;
                default:

            }
            // if (object[i].id == zone.objectIds[id]) {
            data_objs.push({ x: GetPoint(object[i].position.x), y: GetPoint(object[i].position.y), label: "Id:" + object[i].id, distance: 1 })
            objects.push(object[i]);
            //}


        }
        //}

        for (var i = 0; i < objects.length - 1; i++) {

            var i_id = objects[i].id;
            var j_id = objects[i + 1].id;

            var x1 = objects[i].position.x;
            var y1 = objects[i].position.y;
            var z1 = objects[i].position.z;
            var xyz1 = [x1, y1, z1];

            var x2 = objects[i + 1].position.x;
            var y2 = objects[i + 1].position.y;
            var z2 = objects[i + 1].position.z;
            var xyz2 = [x2, y2, z2];

            var distance = GetDistance(xyz1, xyz2);

            labels_obj.push({
                point: {
                    xAxis: 0, yAxis: 0, x: ((GetPoint(objects[i + 1].position.x)) + (GetPoint(objects[i].position.x))) / 2,
                    y: ((GetPoint(objects[i + 1].position.y)) + (GetPoint(objects[i].position.y))) / 2
                }
                , text: 'Distance between Id: ' + objects[i].id + ' and ' + objects[i + 1].id + '= ' + distance + 'm'
            })

        }
        console.log("Data: ", data_objs);
        console.log("labels_obj: ", labels_obj);



        var check_div = '#' + div_id;
        //if ($(check_div).length <= 0) {
        var newDiv = document.createElement("div");

        console.log(div_id);
        newDiv.setAttribute("id", div_id);
        divContainer.appendChild(newDiv);

        chartnozone = new Highcharts.chart(div_id, {

            title: {
                text: 'All Zone'
            },

            yAxis: {
                title: {
                    text: 'Y'
                },
                tickInterval: 0.5,
                gridLineWidth: 1
            },

            xAxis: {
                title: {
                    text: 'X'
                },
                tickInterval: 0.5,
                gridLineWidth: 1
            },

            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle'
            },

            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: true,
                        formatter: function () {
                            return this.point.label;
                        }
                    },
                    enableMouseTracking: true
                },
            },

            series: [{
                name: 'Objects',
                data: data_objs
            }],

            tooltip: {
                formatter: function () {
                    var current_index = this.point.index;

                    console.log('zonelist: ', zonelist);
                    for (var i in zonelist) {
                        // if (zonelist[i].zone == (this.series.name).replace(/\s+/g, '').toLowerCase()) {

                        var average_speed = GetSpeed(zonelist[i].objects[current_index].velocity);

                        var additionalString = '<br>Speed: ' + average_speed + ' m/s <br>Distance:<br>';
                        for (var o in zonelist[i].objects) {
                            if (o != current_index) {

                                var objectsdistance = GetDistance(zonelist[i].objects[current_index].position, zonelist[i].objects[o].position);

                                additionalString = additionalString + 'Id: ' + zonelist[i].objects[current_index].id + ' to Id:' + zonelist[i].objects[o].id + '= ' + objectsdistance + 'm <br>';
                            }
                        }
                        // }
                    }

                    return additionalString
                }

            },
            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 500
                    },
                    chartOptions: {
                        legend: {
                            layout: 'horizontal',
                            align: 'center',
                            verticalAlign: 'bottom'
                        }
                    }
                }]
            }

        });
        //----End High Chart


    }
    $('#humancount').empty().append("HUMAN: " + human);
    $('#unidentifycount').empty().append("UNIDENTIFIED: " + unitentify);
    $('#ignorecount').empty().append("IGNORED: " + ignore);

    WritetoJSNlog(zonelist);
});


function my_chartjs_test_Fun() {
    var lidar_data = {
        "header": {
            "timestamp": "1598078131674",
            "frameId": "quanergy",
            "sequence": 3320
        },
        "zones": [
            {
                "uuid": "{1c974023-2782-440f-97e7-fee9943454d2}",
                "timestamp": "1597431738805",
                "name": "Zone 1",
                "shape": {
                    "vertices": [
                        {
                            "x": 20.396088,
                            "y": 1.2981548
                        },
                        {
                            "x": -9.085001,
                            "y": -0.67281842
                        },
                        {
                            "x": -8.1866589,
                            "y": -21.853815
                        },
                        {
                            "x": 22.542757,
                            "y": -20.057014
                        },
                        {
                            "x": 22.542757,
                            "y": -20.057014
                        }
                    ]
                },
                "objectCount": 0,
                "objectIds": [
                    111,
                    222,
                    333
                ],
                "zMin": 0,
                "zMax": 1.7976931348623157e+308,
                "zoneClass": "FENCE"
            },
            {
                "uuid": "{44a46dbc-55c6-4f01-b981-79e9dd209aca}",
                "timestamp": "1597431738805",
                "name": "Zone 0",
                "shape": {
                    "vertices": [
                        {
                            "x": -9.213541,
                            "y": -0.36753085
                        },
                        {
                            "x": 20.421976,
                            "y": 1.6583085
                        },
                        {
                            "x": 17.370533,
                            "y": 23.551197
                        },
                        {
                            "x": -11.47238,
                            "y": 21.318832
                        },
                        {
                            "x": -11.472417,
                            "y": 21.318735
                        }
                    ]
                },
                "objectCount": 0,
                "objectIds": [
                    10,
                    22,
                    27,
                    111,
                    222
                ],
                "zMin": 0,
                "zMax": 1.7976931348623157e+308,
                "zoneClass": "FENCE"
            }
        ],
        "object": [
            {
                "id": "10",
                "timestamp": "1597431738805",
                "position": {
                    "x": 2.0265133,
                    "y": 10.888519,
                    "z": -1.1999428
                },
                "size": {
                    "x": 0.48813066,
                    "y": 0.33022064,
                    "z": 0.22944388
                },
                "velocity": {
                    "x": -0.00040039624,
                    "y": -8.48511e-05,
                    "z": 0.00019152842
                },
                "objectClass": "HUMAN"
            },
            {
                "id": "22",
                "timestamp": "1597431738805",
                "position": {
                    "x": 1.3665228,
                    "y": 3.0100648,
                    "z": -6.92307472
                },
                "size": {
                    "x": 0.64975631,
                    "y": 0.31428447,
                    "z": 0.60717005
                },
                "velocity": {
                    "x": -0.0061167856,
                    "y": -0.0027238836,
                    "z": -0.0021271864
                },
                "objectClass": "HUMAN"
            },
            {
                "id": "27",
                "timestamp": "1597431738805",
                "position": {
                    "x": 16.190891,
                    "y": 1.7423855,
                    "z": 0
                },
                "size": {
                    "x": 0.22051029,
                    "y": 0.10521559,
                    "z": 0
                },
                "velocity": {
                    "x": -0.0066304221,
                    "y": 1.3691117,
                    "z": 0
                },
                "objectClass": "IGNORED"
            },
            {
                "id": "111",
                "timestamp": "1597431738805",
                "position": {
                    "x": 17.175663,
                    "y": 9.6511,
                    "z": -1.1999428
                },
                "size": {
                    "x": 0.48813066,
                    "y": 0.33022064,
                    "z": 0.22944388
                },
                "velocity": {
                    "x": -0.00040039624,
                    "y": -8.48511e-05,
                    "z": 0.00019152842
                },
                "objectClass": "HUMAN"
            },
            {
                "id": "222",
                "timestamp": "1597431738805",
                "position": {
                    "x": 8.787050619999999,
                    "y": 6.98863386,
                    "z": -1.1999428
                },
                "size": {
                    "x": 0.48813066,
                    "y": 0.33022064,
                    "z": 0.22944388
                },
                "velocity": {
                    "x": -0.00040039624,
                    "y": -8.48511e-05,
                    "z": 0.00019152842
                },
                "objectClass": "HUMAN"
            },
            {
                "id": "333",
                "timestamp": "1597431738805",
                "position": {
                    "x": 4.6440935,
                    "y": -1.96020705,
                    "z": -1.1999428
                },
                "size": {
                    "x": 0.48813066,
                    "y": 0.33022064,
                    "z": 0.22944388
                },
                "velocity": {
                    "x": -0.00040039624,
                    "y": -8.48511e-05,
                    "z": 0.00019152842
                },
                "objectClass": "HUMAN"
            }
        ]
    }

    var header = lidar_data.header;
    var zone = lidar_data.zones
    var object = lidar_data.object;

    var divContainer = document.getElementById("showData");
    divContainer.innerHTML = "";


    zonelist = [];

    for (var z in zone) {
        var newDiv = document.createElement("div");
        var div_id = zone[z].name.replace(/\s+/g, '');
        console.log(div_id);
        newDiv.setAttribute("id", div_id);
        divContainer.appendChild(newDiv);



        var data_objs = [{ x: 0, y: 0, label: "Sensor" }];
        var labels_obj = [];


        var objects = [{
            id: 0,
            position: {
                x: 0,
                y: 0,
                z: 0
            },
            velocity: {
                x: 0,
                y: 0,
                z: 0
            },
            timestamp: zone[z].timestamp,
        }];

        zonelist.push({ zone: zone[z].name.replace(/\s+/g, '').toLowerCase(), objects });
        // var data_objs = [[0, 0]];
        for (var id in zone[z].objectIds) {

            for (var i in object) {

                if (object[i].id == zone[z].objectIds[id]) {

                    //data_objs.push({ x: GetPoint(object[i].position.x), y: GetPoint(object[i].position.y) })
                    //data_objs.push([GetPoint(object[i].position.x),  GetPoint(object[i].position.y) ])
                    data_objs.push({ x: GetPoint(object[i].position.x), y: GetPoint(object[i].position.y), label: "Id:" + object[i].id, distance: 1 })
                    //labels_obj.push({ point: { xAxis: 0, yAxis: 0, x: (GetPoint(object[i].position.x)) / 2, y: (GetPoint(object[i].position.y)) }, text: "Anno" + object[i].id })

                    objects.push(object[i]);
                }


            }
        }

        for (var i = 0; i < objects.length - 1; i++) {

            var i_id = objects[i].id;
            var j_id = objects[i + 1].id;

            var x1 = objects[i].position.x;
            var y1 = objects[i].position.y;
            var z1 = objects[i].position.z;
            var xyz1 = [x1, y1, z1];

            var x2 = objects[i + 1].position.x;
            var y2 = objects[i + 1].position.y;
            var z2 = objects[i + 1].position.z;
            var xyz2 = [x2, y2, z2];

            var distance = GetDistance(xyz1, xyz2);

            labels_obj.push({
                point: {
                    xAxis: 0, yAxis: 0, x: ((GetPoint(objects[i + 1].position.x)) + (GetPoint(objects[i].position.x))) / 2,
                    y: ((GetPoint(objects[i + 1].position.y)) + (GetPoint(objects[i].position.y))) / 2
                }
                , text: 'Distance between Id: ' + objects[i].id + ' and ' + objects[i + 1].id + '= ' + distance + 'm'
            })

        }
        console.log("Data: ", data_objs);
        console.log("labels_obj: ", labels_obj);
        //----Start High Chart

        Highcharts.chart(div_id, {
            //chart: {
            //    type: 'line'
            //    //zoomType: 'xy'
            //},

            title: {
                text: zone[z].name
            },

            //subtitle: {
            //    text: 'Source: thesolarfoundation.com'
            //},
            //annotations: [{
            //    labelOptions: {
            //        backgroundColor: 'rgba(255,255,255,0.5)',
            //        //verticalAlign: 'bottom',
            //        //distance: 25
            //        x: 40, y: -10
            //    },
            //    labels: labels_obj,
            //    draggable: 'y'
            //}],

            yAxis: {
                title: {
                    text: 'Y'
                },
                tickInterval: 0.5,
                gridLineWidth: 1
            },

            xAxis: {
                title: {
                    text: 'X'
                },
                tickInterval: 0.5,
                gridLineWidth: 1
                //labels: {
                //    format: '{value} m'
                //},
                //accessibility: {
                //    rangeDescription: 'Range: 0 to 80 m.'
                //},
                //maxPadding: 0.05,
                //showLastLabel: true
                //accessibility: {
                //    rangeDescription: 'Range: 2010 to 2017'
                //}
            },

            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle'
            },

            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: true,
                        formatter: function () {
                            return this.point.label;
                        }
                    },
                    enableMouseTracking: true
                },
                //series: {
                //    label: {
                //        connectorAllowed: false
                //    }
                //    // pointStart: 2010
                //}
            },

            series: [{
                name: zone[z].name,
                data: data_objs
            }],

            tooltip: {
                //headerFormat: 'Distance: { this.points[i].series} km<br>',
                //pointFormat: '{point.y} m a. s. l.',
                //shared: true
                formatter: function () {
                    //var additionalString = '<br>Distance: ' + data_objs[index].distance + '<br>Speed: ' + data_objs[index].speed,

                    var current_index = this.point.index;
                    // var series_name = '{series.name}';
                    console.log('zonelist: ', zonelist);
                    for (var i in zonelist) {
                        if (zonelist[i].zone == (this.series.name).replace(/\s+/g, '').toLowerCase()) {

                            var average_speed = GetSpeed(zonelist[i].objects[current_index].velocity);

                            var additionalString = '<br>Speed: ' + average_speed + ' m/s <br>Distance:<br>';
                            for (var o in zonelist[i].objects) {
                                if (o != current_index) {

                                    var objectsdistance = GetDistance(zonelist[i].objects[current_index].position, zonelist[i].objects[o].position);

                                    additionalString = additionalString + 'Id: ' + zonelist[i].objects[current_index].id + ' to Id:' + zonelist[i].objects[o].id + '= ' + objectsdistance + 'm <br>';
                                }
                            }
                        }
                    }

                    return additionalString
                }

                //    formatter: function () {
                //        var additionalString = '',
                //            index = this.point.index;
                //        if (index > 0) {
                //            additionalString = '<br>Difference between previous stack: ' + (this.total - this.series.points[index - 1].total)
                //        }
                //        return this.x + ': ' + this.y + '<br>Total: ' + this.total + additionalString
                //    }
                //}

            },
            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 500
                    },
                    chartOptions: {
                        legend: {
                            layout: 'horizontal',
                            align: 'center',
                            verticalAlign: 'bottom'
                        }
                    }
                }]
            }

        });
        //----End High Chart   
    }
}

function GetDistance(point_A, point_B) {
    var distance;
    if (Array.isArray(point_A) && Array.isArray(point_B)) {
        deltaX = point_B[0] - point_A[0];
        deltaY = point_B[1] - point_A[1];
        deltaZ = point_B[2] - point_A[2];
    }
    else {
        deltaX = point_B.x - point_A.x;
        deltaY = point_B.y - point_A.y;
        deltaZ = point_B.z - point_A.z;
    }


    distance = Math.round((Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ)) * 100) / 100;
    return distance;
}

function GetSpeed(velocity) {
    var speed;

    if (Array.isArray(velocity)) {
        deltaX = velocity[0] * velocity[0];
        deltaY = velocity[1] * velocity[1];
        deltaZ = velocity[2] * velocity[2];
    }
    else {
        deltaX = velocity.x * velocity.x;
        deltaY = velocity.y * velocity.y;
        deltaZ = velocity.z * velocity.z;
    }


    speed = Math.round((Math.sqrt(deltaX + deltaY + deltaZ)) * 100) / 100;
    return speed;
}

function GetPoint(num) {
    var point = Math.round((num) * 100) / 100;
    return point;
}

function WritetoJSNlog(zonelist) {

    if (zonelist.length > 0) {
        for (var i in zonelist) {
            for (var j = 0; j < zonelist[i].objects.length - 1; j++) {
                var average_speed = GetSpeed(zonelist[i].objects[j].velocity);
                var objectsdistance = GetDistance(zonelist[i].objects[j].position, zonelist[i].objects[j + 1].position);

                var unix_timestamp = zonelist[i].objects[j].timestamp;
                var date = timeConverter(unix_timestamp);

                JL().info('Timestamp:,' + date.toLocaleString() + ',TrackingId:,' + zonelist[i].objects[j].id + ',Average Speed:,' + average_speed + ',m/s, Distance between, Point-A(TrackingId),' + zonelist[i].objects[j].id + ',and,Point-B(TrackingId),'
                    + zonelist[i].objects[j + 1].id + ' ,=, ' + objectsdistance + ',m,');


                //const li = document.createElement("li");
                //li.textContent = 'Timestamp: ' + date.toLocaleString() + ', ' + ' Tracking Id: ' + zonelist[i].objects[j].id + ', Average Speed = ' + average_speed + ' m / s, Distance between ' + zonelist[i].objects[j].id + ' and '
                //    + zonelist[i].objects[j + 1].id + ' is ' + objectsdistance + 'm';
                //var logcount = document.getElementById("loglist").getElementsByTagName("li").length;
                //console.log('logcount:',logcount);
                //if (logcount > 50) {
                //   document.getElementById("loglist").innerHTML = "";
                //}
                //document.getElementById("loglist").appendChild(li);
            }
        }
    }
}

function timeConverter(UNIX_timestamp) {
    //console.log('UNIX_timestamp_beforeslice: ', UNIX_timestamp);
    //console.log('UNIX_timestamp_slice: ', UNIX_timestamp.slice(0, 10));
    if (UNIX_timestamp.length >= 10) {
        UNIX_timestamp = UNIX_timestamp.slice(0, 10);
    }
    //console.log('UNIX_timestamp: ', UNIX_timestamp);
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
    return time;
}


$("#RefreshButton").on("click", function () {
    var message = 'getdata';
    connection.invoke("RetrieveLidatafromServer", message).catch(err => console.error(err));
    //WritetoJSNlog();
});


var interval_polling = null;
function PollingLidarData(interval) {
    console.log(' PollingLidarData working!');
    interval_polling = setInterval(function () {
        var message = 'getdata';
        connection.invoke("RetrieveLidatafromServer", message).catch(err => console.error(err));
    }, interval * 1000);
}

function StopPollingLidarData() {
    clearInterval(interval_polling);
}

$("#interval").bind('keyup mouseup', function () {
    if ($("#pollingchkbox").is(':checked')) {
        if ($("#StartButton").text() === 'Stop Polling Data') {
            StopPollingLidarData();
            //pulling first data
            var message = 'getdata';
            connection.invoke("RetrieveLidatafromServer", message).catch(err => console.error(err));

            //set interval
            var interval_sec = document.getElementById("interval").value;
            PollingLidarData(interval_sec);
        }
    } else {
        StopPollingLidarData();
    }
});

$("#pollingchkbox").on("click", function () {
    if ($("#pollingchkbox").not(':checked')) {
        $("#StartButton").text("Start Polling Data").attr("class", "btn-success");
        StopPollingLidarData();
    }
});

$("#StartButton").on("click", function () {
    if ($("#pollingchkbox").is(':checked')) {
        if ($("#StartButton").text() === 'Start Polling Data') {
            $("#StartButton").text("Stop Polling Data").attr("class", "btn-danger");

            //pulling first data
            var message = 'getdata';
            connection.invoke("RetrieveLidatafromServer", message).catch(err => console.error(err));

            //set interval
            var interval_sec = document.getElementById("interval").value;
            PollingLidarData(interval_sec);

        } else {
            $("#StartButton").text("Start Polling Data").attr("class", "btn-success");
            StopPollingLidarData();
        }

    } else {
        alert("Please check the Enable Polling Live Data!.")
        $("#StartButton").text("Start Polling Data").attr("class", "btn-success");
    }
});



$(document).ready(function () {
     my_chartjs_test_Fun();
    // WritetoJSNlog();
});



