// The following sample code uses modern ECMAScript 6 features 
// that aren't supported in Internet Explorer 11.
// To convert the sample for environments that do not support ECMAScript 6, 
// such as Internet Explorer 11, use a transpiler such as 
// Babel at http://babeljs.io/. 
//
// See Es5-chat.js for a Babel transpiled version of the following code:

const connection = new signalR.HubConnectionBuilder()
    .withUrl("/chatHub")
    .build();

//var zonelist; //global variable

connection.on("ReceiveMessage", (message) => {
    var zonelist = [];
    //const encodedMsg = message;
    //const li = document.createElement("li");
    //li.textContent = encodedMsg;
    //document.getElementById("messagesList").appendChild(li);
    const lidar_data = JSON.parse(message);
    //console.log('lidar_data', lidar_data);
    var header = lidar_data.header;
    var object = lidar_data.object;

    let unix_timestamp = header.timestamp;

    var date = timeConverter(unix_timestamp);

    $('#timestamp').empty().append("DateTime: " + date.toLocaleString());
    $('#objectcounts').empty().append("Current Detected Objects: " + object.length);


    var divContainer = document.getElementById("showData");
    divContainer.innerHTML = "";


    let human = 0;
    let ignore = 0;
    let unitentify = 0;


    var params = {};
    params.keep_axes = true;
    params.data = [];

    params.data.push({
        "x": 0,
        "y": 0,
        "z": 0,
        "size": 6,//1 + Math.random(),
        "color": '#FF0000',//getRandomColor(),
        "label": "Id: 0",
        "other": { "label_on": params.show_labels }
    });


    // var r, g, b;
    var zone_objects = [{
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

    //zone_objects.push(object);
    //zonelist.push({ zone: 'Zone', object });
    //zone_objects.push(object);

    for (var i in object) {
        var objects = {}
        objects.id = 0;
        objects.id = object[i].id;
        objects.position = object[i].position;
        objects.size = object[i].size;
        objects.velocity = object[i].velocity;
        objects.objectClass = object[i].objectClass;

        // console.log(objects);
        if (objects.objectClass.toUpperCase() === "HUMAN") {
            human += 1;
            params.data.push({
                "x": objects.position.x,
                "y": objects.position.y,
                "z": objects.position.z,
                "size": 5,
                "color": "#00FF00",
                "label": "Id: " + objects.id,
                "other": { "label_on": params.show_labels }
            });
        }
        if (objects.objectClass.toUpperCase() === "IGNORED") {
            ignore += 1;
            params.data.push({
                "x": objects.position.x,
                "y": objects.position.y,
                "z": objects.position.z,
                "size": 5,
                "color": "#A9A9A9",
                "label": "Id: " + objects.id,
                "other": { "label_on": params.show_labels }
            });
        }
        if (objects.objectClass.toUpperCase() === "UNIDENTIFIED") {
            unitentify += 1;
            params.data.push({
                "x": objects.position.x,
                "y": objects.position.y,
                "z": objects.position.z,
                "size": 5,
                "color": "#DCDCDC",
                "label": "Id: " + objects.id,
                "other": { "label_on": params.show_labels }
            });
        }

        zone_objects.push(object[i]);
        // CREATE DYNAMIC TABLE.
        //var newDiv = document.createElement("div");
        //newDiv.setAttribute("class", "row");
        var newDiv = document.createElement("div");
        newDiv.setAttribute("class", "col-4");
        var table = document.createElement("table");

        var tr = table.insertRow(-1);
        var id = document.createElement("td");
        id.innerHTML = "ID: ";
        tr.appendChild(id);

        var id_data = document.createElement("td");
        id_data.innerHTML = objects.id;
        tr.appendChild(id_data);

        var tr = table.insertRow(-1);
        var object_type = document.createElement("td");
        object_type.innerHTML = "Object Type: ";
        tr.appendChild(object_type);

        var object_type_data = document.createElement("td");
        object_type_data.innerHTML = objects.objectClass;
        tr.appendChild(object_type_data);


        var tr = table.insertRow(-1);
        var distance = document.createElement("td");
        distance.innerHTML = "Distance From Sensor: ";
        tr.appendChild(distance);

        var distance_data = document.createElement("td");
        var distance_value = 0;
        var sensor_position = [0, 0, 0];
        var object_position = [objects.position.x, objects.position.y, objects.position.z];
        distance_value = GetDistance(sensor_position, object_position);
        distance_data.innerHTML = distance_value + " M"
        tr.appendChild(distance_data);

        var tr = table.insertRow(-1);
        var speed = document.createElement("td");
        speed.innerHTML = "Average Speed: ";
        tr.appendChild(speed);

        var speed_data = document.createElement("td");
        var object_velocity = [objects.velocity.x, objects.velocity.y, objects.velocity.z];
        speed_value = GetSpeed(object_velocity);
        speed_data.innerHTML = speed_value + " M/s"
        tr.appendChild(speed_data);

        divContainer.appendChild(newDiv);
        newDiv.appendChild(table);
    }

    if (params.data.length == 0) {
        params.data = [{ "x": 0, "y": 0, "z": 0, "label": "0", "size": 6, "color": "#FF0000" }];
    }

    params.x_scale_bounds = [-60, 60];
    params.y_scale_bounds = [-60, 60];
    params.z_scale_bounds = [-60, 60];

    three_d.change_data(0, params, false, true);

    //console.log('humman: ', human);
    //console.log('unitentify: ', unitentify);
    //console.log('ignore: ', ignore);
    $('#humancount').empty().append("HUMAN: " + human);
    $('#unidentifycount').empty().append("UNIDENTIFIED: " + unitentify);
    $('#ignorecount').empty().append("IGNORED: " + ignore);

    console.log('zonelist: ', zone_objects);
    WritetoJSNlog(zone_objects);
});

//document.getElementById("sendButton").addEventListener("click", event => {
//    const user = document.getElementById("userInput").value;
//    const message = document.getElementById("messageInput").value;    
//    connection.invoke("SendMessage", user, message).catch(err => console.error(err));
//    event.preventDefault();
//});


connection.on("UploadStream", (stream) => {
    const encodedMsg = stream;
    const li = document.createElement("li");
    li.textContent = encodedMsg;
    document.getElementById("messagesList").appendChild(li);
});

connection.start().catch(err => console.error(err));

function GetPointstoCalculateDistance(point, object_id) {
    var pointA_value = document.getElementById("point_a").value;
    var pointB_value = document.getElementById("point_b").value;

    if (pointA_value === '' && pointB_value === '') {
        $('#point_a_id').empty().val("Track " + object_id);

        var point_val = "";

        for (var i = 0; i < point.length; i++) {
            point_val = point_val + ',' + point[i];
        }
        $('#point_a').empty().val(point);
    }
    else if (pointA_value.length > 0 && pointB_value === '') {
        $('#point_b_id').empty().val("Track " + object_id);

        var point_val = "";

        for (var i = 0; i < point.length; i++) {
            point_val = point_val + ',' + point[i];
        }
        $('#point_b').empty().val(point);
    } else {
        $('#point_a_id').empty().val("Track " + object_id);

        var point_val = "";

        for (var i = 0; i < point.length; i++) {
            point_val = point_val + ',' + point[i];
        }
        $('#point_a').empty().val(point);

        $('#point_b_id').empty().val("");
        $('#point_b').empty().val("");
        $('#point_b').attr("placeholder", "(X2,Y2,Z2)");

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


function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
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


function my_test_Fun() {
    var lidar_data = {
        'header': { 'timestamp': '1598078131674', 'frameId': 'quanergy', 'sequence': 3320 },
        'object': [{
            'id': '10', 'timestamp': '1598078128833',
            'position': { 'x': 3.6440935, 'y': -0.96020705, 'z': -1.1999428 },
            'size': { 'x': 0.48813066, 'y': 0.33022064, 'z': 0.22944388 },
            'velocity': { 'x': -0.00040039624, 'y': -8.48511e-05, 'z': 0.00019152842 },
            'objectClass': 'HUMAN'
        }, {
            'id': '22', 'timestamp': '1598078128833',
            'position': { 'x': 0.30845419, 'y': -3.1479537, 'z': -0.92307472 },
            'size': { 'x': 0.64975631, 'y': 0.31428447, 'z': 0.60717005 },
            'velocity': { 'x': -0.0061167856, 'y': -0.0027238836, 'z': -0.0021271864 },
            'objectClass': 'HUMAN'
        }, {
            'id': '27', 'timestamp': '1598078128833',
            'position': { 'x': -8.020113, 'y': -30.678568, 'z': 0 },
            'size': { 'x': 0.22051029, 'y': 0.10521559, 'z': 0 },
            'velocity': { 'x': -0.0066304221, 'y': 1.3691117, 'z': 0 },
            'objectClass': 'IGNORED'
        }]
    }


    //    //console.log(lidar_data);
    var header = lidar_data.header;
    var object = lidar_data.object;
    let unix_timestamp = header.timestamp;




    $('#objectcounts').empty().append("Current Detected Objects: " + object.length);


    var date = timeConverter(unix_timestamp);
    $('#timestamp').empty().append("DateTime: " + date.toLocaleString());


    var divContainer = document.getElementById("showData");
    divContainer.innerHTML = "";

    var human = 0;
    var ignore = 0;
    var unitentify = 0;

    for (var i in object) {
        var objects = {}
        objects.id = object[i].id;
        objects.position = object[i].position;
        objects.size = object[i].size;
        objects.velocity = object[i].velocity;
        objects.objectClass = object[i].objectClass;

        // console.log(objects);
        if (objects.objectClass.toUpperCase == "HUMAN") {
            human += 1;
        }
        if (objects.objectClass.toUpperCase == "IGNORED") {
            ignore += 1;
        }
        if (objects.objectClass.toUpperCase == "UNIDENTIFIED") {
            unitentify += 1;
        }
        // CREATE DYNAMIC TABLE.
        var newDiv = document.createElement("div");
        newDiv.setAttribute("class", "row");
        var table = document.createElement("table");
        var tr = table.insertRow(-1);
        var id = document.createElement("td");
        id.innerHTML = "ID: ";
        tr.appendChild(id);

        var id_data = document.createElement("td");
        id_data.innerHTML = objects.id;
        tr.appendChild(id_data);

        var tr = table.insertRow(-1);
        var object_type = document.createElement("td");
        object_type.innerHTML = "Object Type: ";
        tr.appendChild(object_type);

        var object_type_data = document.createElement("td");
        object_type_data.innerHTML = objects.objectClass;
        tr.appendChild(object_type_data);

        var tr = table.insertRow(-1);
        var position = document.createElement("td");
        position.innerHTML = "Position: ";
        tr.appendChild(position);

        var position_data = document.createElement("td");
        position_data.innerHTML = "X: " + objects.position.x + " Y: " + objects.position.y + " Z: " + objects.position.z;
        tr.appendChild(position_data);

        var tr = table.insertRow(-1);
        var size = document.createElement("td");
        size.innerHTML = "Size: ";
        tr.appendChild(size);

        var size_data = document.createElement("td");
        size_data.innerHTML = "X: " + objects.size.x + " Y: " + objects.size.y + " Z: " + objects.size.z;
        tr.appendChild(size_data);

        var tr = table.insertRow(-1);
        var velocity = document.createElement("td");
        velocity.innerHTML = "Velocity: ";
        tr.appendChild(velocity);

        var velocity_data = document.createElement("td");
        velocity_data.innerHTML = "X: " + objects.velocity.x + " Y: " + objects.velocity.y + " Z: " + objects.velocity.z;
        tr.appendChild(velocity_data);

        divContainer.appendChild(table);

        //var position_x = objects.position.x;
        //var position_y = objects.position.y;
        //var position_z = objects.position.z;
        //var trace1 = {
        //    x: position_x, y: position_y, z: position_z,

        //    label: objects.id,
        //    color: getRandomColor()
        //};
        //ChartData.push(trace1);



    }

    //$('#humancount').empty().append("HUMAN: " + human);
    //$('#unidentifycount').empty().append("UNIDENTIFIED: " + unitentify);
    //$('#ignorecount').empty().append("IGNORED: " + ignore);
}
function my_three_d_test_Fun() {
    var lidar_data = {
        'header': { 'timestamp': '1598078131674', 'frameId': 'quanergy', 'sequence': 3320 },
        'object': [{
            'id': '10', 'timestamp': '1598078128833',
            'position': { 'x': 3.6440935, 'y': -0.96020705, 'z': -1.1999428 },
            'size': { 'x': 0.48813066, 'y': 0.33022064, 'z': 0.22944388 },
            'velocity': { 'x': -0.00040039624, 'y': -8.48511e-05, 'z': 0.00019152842 },
            'objectClass': 'HUMAN'
        }, {
            'id': '22', 'timestamp': '1598078128833',
            'position': { 'x': 0.30845419, 'y': -3.1479537, 'z': -0.92307472 },
            'size': { 'x': 0.64975631, 'y': 0.31428447, 'z': 0.60717005 },
            'velocity': { 'x': -0.0061167856, 'y': -0.0027238836, 'z': -0.0021271864 },
            'objectClass': 'HUMAN'
        }, {
            'id': '27', 'timestamp': '1598078128833',
            'position': { 'x': -8.020113, 'y': -30.678568, 'z': 0 },
            'size': { 'x': 0.22051029, 'y': 0.10521559, 'z': 0 },
            'velocity': { 'x': -0.0066304221, 'y': 1.3691117, 'z': 0 },
            'objectClass': 'IGNORED'
        }]
    }


    //    //console.log(lidar_data);
    var header = lidar_data.header;
    var object = lidar_data.object;

    var params = {};
    params.keep_axes = true;
    params.div_id = "div_plot_area";
    params.data = [];

    params.data.push({
        "x": 0,
        "y": 0,
        "z": 0,
        "size": 1 + Math.random(),
        "color": getRandomColor(),
        "label": "Id: 0",
        "other": { "label_on": params.show_labels }
    });

    var divContainer = document.getElementById("showData");
    divContainer.innerHTML = "";

    for (var i in object) {
        var objects = {}
        objects.id = object[i].id;
        objects.position = object[i].position;
        objects.size = object[i].size;
        objects.velocity = object[i].velocity;
        objects.objectClass = object[i].objectClass;

        params.data.push({
            "x": objects.position.x,
            "y": objects.position.y,
            "z": objects.position.z,
            "size": 0.1 + Math.random(),
            "color": getRandomColor(),
            "label": "Id: " + objects.id,
            "other": { "label_on": params.show_labels }
        });

        var newDiv = document.createElement("div");
        newDiv.setAttribute("class", "col-4");
        var table = document.createElement("table");

        var tr = table.insertRow(-1);
        var position = document.createElement("td");
        position.innerHTML = "Position: ";
        tr.appendChild(position);

        var position_data = document.createElement("td");
        position_data.innerHTML = "X: " + objects.position.x + " Y: " + objects.position.y + " Z: " + objects.position.z;
        tr.appendChild(position_data);

        var tr = table.insertRow(-1);
        var size = document.createElement("td");
        size.innerHTML = "Size: ";
        tr.appendChild(size);

        var size_data = document.createElement("td");
        size_data.innerHTML = "X: " + objects.size.x + " Y: " + objects.size.y + " Z: " + objects.size.z;
        tr.appendChild(size_data);

        var tr = table.insertRow(-1);
        var velocity = document.createElement("td");
        velocity.innerHTML = "Velocity: ";
        tr.appendChild(velocity);

        var velocity_data = document.createElement("td");
        velocity_data.innerHTML = "X: " + objects.velocity.x + " Y: " + objects.velocity.y + " Z: " + objects.velocity.z;
        tr.appendChild(velocity_data);

        divContainer.appendChild(newDiv);
        newDiv.appendChild(table);
    }
    //console.log("params: ", params);
    // three_d.change_data(0, params, false, true);
    params.x_scale_bounds = [-60, 60];
    params.y_scale_bounds = [-60, 60];
    params.z_scale_bounds = [-60, 60];
    //params.same_scale = [true, true, false];
    params.axis_length_ratios = [4, 4, 4];

    params.axis_color = getRandomColor();
    //params.axis_font_color = getRandomColor();
    // params.axis_tick_gaps = [0.1, 0.1, 0.1];

    //params.size_exponent = 0;
    //params.background_color = getRandomColor();
    params.size_scale_bound = 1;
    //params.point_type = "square";

    params.mouseover = function (i_plot, i, d) {
        three_d.set_point_color(i_plot, i, 0xFF0000);
    };

    params.mouseout = function (i_plot, i, d) {
        if (d.input_data.other.hasOwnProperty("clicked")) {
            if (!d.input_data.other.clicked) {
                three_d.set_point_color(i_plot, i, d.input_data.color);
            } else {
                three_d.set_point_color(i_plot, i, 0x00FFFF);
            }
        } else {
            three_d.set_point_color(i_plot, i, d.input_data.color);
        }
    };


    params.click = function (i_plot, i, d) {
        if (d.input_data.other.hasOwnProperty("clicked")) {
            d.input_data.other.clicked = !d.input_data.other.clicked;
        } else {
            // First time clicking it.
            d.input_data.other.clicked = true;
        }

        if (d.input_data.other.clicked) {
            three_d.set_point_color(i_plot, i, 0x00FFFF);
            if (d.have_label) {
                three_d.set_label_background_color(i_plot, i, 0xFF8000);
                var x = three_d.plots[i_plot].points[i].input_data.x;
                var y = three_d.plots[i_plot].points[i].input_data.y;
                var z = three_d.plots[i_plot].points[i].input_data.z;
                var xyz = [x, y, z];

                console.log('xyz: ', xyz);

                var id = three_d.plots[i_plot].points[i].input_data.label;
                console.log('id: ', id);

                //var a = [3.6440935, -0.96020705, -1.1999428];               
                //var b = [0.30845419, -3.1479537, -0.92307472];
                //var distance = GetDistance(a, b);
                //console.log('Distance: ', distance);

                GetPointstoCalculateDistance(xyz, id);
            }

        } else {
            three_d.set_point_color(i_plot, i, d.input_data.color);
            if (d.have_label) {
                three_d.set_label_color(i_plot, i, d.input_data.color);
                three_d.set_label_background_color(i_plot, i, 0x000000);
            }
        }
    };

    three_d.make_scatter(params);
}

function WritetoJSNlog(zone_objects) {
    if (zone_objects.length > 0) {
        for (var i = 0; i < zone_objects.length - 1; i++) {
            // for (var j = 0; j < zone_objects[i].length - 1; j++) {
            var average_speed = GetSpeed(zone_objects[i].velocity);
            var objectsdistance = GetDistance(zone_objects[i].position, zone_objects[i + 1].position);

            var unix_timestamp = zone_objects[i].timestamp;
            var date = timeConverter(unix_timestamp);

            //JL().info('Timestamp: ' + date.toLocaleString() + ',' + ' Tracking Id: ' + zone_objects[i].id + ', Average Speed=' + average_speed + ' m/s, Distance between ' + zone_objects[i].id + ' and '
            //    + zone_objects[i + 1].id + ' is ' + objectsdistance + 'm');
            JL().info('Timestamp:,' + date.toLocaleString() + ',TrackingId:,' + zone_objects[i].id + ',Average Speed:,' + average_speed + ',m/s, Distance between, Point-A(TrackingId),' + zone_objects[i].id + ',and,Point-B(TrackingId),'
                + zzone_objects[i + 1].id + ' ,=, ' + objectsdistance + ',m,');
        }
    }
}



$("#calculate").click(function () {

    var pointA_value = document.getElementById("point_a").value;
    var pointB_value = document.getElementById("point_b").value;

    var pointA = [];
    pointA = pointA_value.split(",", 3);
    var pointB = [];
    pointB = pointB_value.split(",", 3);
    if (pointA.length <= 0 || pointB.length <= 0) {
        alert("Please select Point A and B to calculate distance!.");
        return;
    }

    var distance = GetDistance(pointA, pointB);
    $('#distance').empty().val(distance);

});

$("#clear").click(function () {
    $('#point_a_id').empty().val("");
    $('#point_b_id').empty().val("");
    $('#point_a').empty().val("");
    $('#point_b').empty().val("");
    $('#distance').empty().val("");
})



$(document).ready(function () {


    // Define a function to initialise the plot:
    function init_plot() {
        var params = {};
        params.div_id = "div_plot_area";
        //params.connect_points = true;

        // To omit the points and show only lines, set
        //params.geom_type = "none";

        //params.data = [
        //    { "x": 1.2, "y": 60.30, "z": 1.39, "group": "1" },
        //    { "x": 2.5, "y": 42.42, "z": 3.40, "group": "2" },
        //    { "x": 4.0, "y": 43.89, "z": 2.09, "group": "3" },
        //    { "x": 0.6, "y": 84.96, "z": 3.92, "group": "4" },
        //    { "x": 1.5, "y": 77.37, "z": 3.75, "group": "5" },
        //    { "x": 1.0, "y": 72.37, "z": 0.58, "group": "6" }, // data entries can be shuffled; what's
        //    { "x": 3.2, "y": 21.91, "z": 1.27, "group": "7" }, // important for the lines is the order
        //    { "x": 2.0, "y": 69.11, "z": 3.10, "group": "8" }, // for each group individually.
        //    { "x": 3.4, "y": 0.75, "z": 2.06, "group": "9" },
        //    { "x": 5.0, "y": 56.15, "z": 1.98, "group": "10" } // groups don't need the same number of points.
        //];

        //params.data = [
        //    { "x": 1.2, "y": 60.30, "z": 1.39, "label": "1", "color": getRandomColor() },
        //    { "x": 2.5, "y": 42.42, "z": 3.40, "label": "2", "color": getRandomColor() },
        //    { "x": 4.0, "y": 43.89, "z": 2.09, "label": "3", "color": getRandomColor() },
        //    { "x": 0.6, "y": 84.96, "z": 3.92, "label": "4", "color": getRandomColor() },
        //    { "x": 1.5, "y": 77.37, "z": 3.75, "label": "5", "color": getRandomColor() },
        //    { "x": 1.0, "y": 72.37, "z": 0.58, "label": "6", "color": getRandomColor() }, // data entries can be shuffled; what's
        //    { "x": 3.2, "y": 21.91, "z": 1.27, "label": "7", "color": getRandomColor() }, // important for the lines is the order
        //    { "x": 2.0, "y": 69.11, "z": 3.10, "label": "8", "color": getRandomColor() }, // for each group individually.
        //    { "x": 3.4, "y": 0.75, "z": 2.06, "label": "9", "color": getRandomColor() },
        //    { "x": 5.0, "y": 56.15, "z": 1.98, "label": "10", "color": getRandomColor() } // groups don't need the same number of points.
        //];
        params.data = [{ "x": 0, "y": 0, "z": 0, "label": "0", "size": 5, "color": "#FF0000" }];
        // params.data = ChartData;
        //console.log('data', params.data)
        // Compulsory to have at least have each group's name property here;
        // can also add properties "point_type" and "default_point_height".
        //params.groups = [
        //    { "name": "1", "default_color": getRandomColor() },
        //    { "name": "2", "default_color": getRandomColor() },
        //    { "name": "3", "default_color": getRandomColor() },
        //    { "name": "4", "default_color": getRandomColor() },
        //    { "name": "5", "default_color": getRandomColor() },
        //    { "name": "6", "default_color": getRandomColor() },
        //    { "name": "7", "default_color": getRandomColor() },
        //    { "name": "8", "default_color": getRandomColor() },
        //    { "name": "9", "default_color": getRandomColor() },
        //    { "name": "10", "default_color": getRandomColor() }
        //];
        params.x_scale_bounds = [-60, 60];
        params.y_scale_bounds = [-60, 60];
        params.z_scale_bounds = [-60, 60];

        params.mouseover = function (i_plot, i, d) {
            three_d.set_point_color(i_plot, i, 0xFF0000);
        };

        params.mouseout = function (i_plot, i, d) {
            if (d.input_data.other.hasOwnProperty("clicked")) {
                if (!d.input_data.other.clicked) {
                    three_d.set_point_color(i_plot, i, d.input_data.color);
                } else {
                    three_d.set_point_color(i_plot, i, 0x00FFFF);
                }
            } else {
                three_d.set_point_color(i_plot, i, d.input_data.color);
            }
        };


        params.click = function (i_plot, i, d) {
            if (d.input_data.other.hasOwnProperty("clicked")) {
                d.input_data.other.clicked = !d.input_data.other.clicked;
            } else {
                // First time clicking it.
                d.input_data.other.clicked = true;
            }

            if (d.input_data.other.clicked) {
                three_d.set_point_color(i_plot, i, 0x00FFFF);
                if (d.have_label) {
                    three_d.set_label_background_color(i_plot, i, 0xFF8000);
                    var x = three_d.plots[i_plot].points[i].input_data.x;
                    var y = three_d.plots[i_plot].points[i].input_data.y;
                    var z = three_d.plots[i_plot].points[i].input_data.z;
                    var xyz = [x, y, z];

                    console.log('xyz: ', xyz);

                    var id = three_d.plots[i_plot].points[i].input_data.label;
                    console.log('id: ', id);

                    //var a = [3.6440935, -0.96020705, -1.1999428];               
                    //var b = [0.30845419, -3.1479537, -0.92307472];
                    //var distance = GetDistance(a, b);
                    //console.log('Distance: ', distance);

                    GetPointstoCalculateDistance(xyz, id);
                }

            } else {
                three_d.set_point_color(i_plot, i, d.input_data.color);
                if (d.have_label) {
                    three_d.set_label_color(i_plot, i, d.input_data.color);
                    three_d.set_label_background_color(i_plot, i, 0x000000);
                }
            }
        };

        three_d.make_scatter(params);
    }

    // Call the initialisation function:
    init_plot();
    //my_three_d_test_Fun();
    // var speed = GetSpeed();
    // console.log('Speed: ', speed);
});
