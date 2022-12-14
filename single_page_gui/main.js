var app = new Vue({
    el:'#control_gui',
    data: {
        connected: false,
        failure: false,
        ros: null,
        uav_port: '9090',
        uav_ip: '0.0.0.0',
        logs: [],
        loading: false,
        topic: null,
        message: null,
        enable_takeoff: false,
        enable_return: false,
        control_signal: null,
        destination: '',
        direction: 1,
        cruise_height: 1,
        hover_time: 15,
    },
    methods: {
        connect: function(){
            console.log('Connecting...')

            this.ros = new ROSLIB.Ros({
                url: 'ws://' + this.uav_ip + ':' + this.uav_port
            })

            this.ros.on('connection', () => {
                this.logs.unshift((new Date()).toTimeString() + ' - connected')
                this.connected = true
                this.failure = false
                console.log('Connected')
                
                // Create a control signal publisher: take off 1, return 2, stop 0
                this.control_pub = new ROSLIB.Topic({
                    ros: this.ros,
                    name: '/control_phase',
                    messageType: 'std_msgs/Int8'
                });

                this.control_signal = new ROSLIB.Message({
                    data: 0
                })

                this.control_pub.publish(this.control_signal)
                this.logs.unshift((new Date()).toTimeString() + 'Control Signal: ' + this.control_signal.data)

                this.id_sub = new ROSLIB.Topic({
                    ros: this.ros,
                    name: '/id',
                    messageType: 'std_msgs/Int8'
                })
        
                this.id_sub.subscribe(function(message){
                    document.getElementById("uav_id").innerHTML = message.data;
                    this.id_sub.unsubscribe();
                })

                this.status_sub = new ROSLIB.Topic({
                    ros: this.ros,
                    name: '/status',
                    messageType: 'std_msgs/String'
                })
        
                this.status_sub.subscribe(function(message){
                    document.getElementById("uav_status").innerHTML = message.data;
                    if(message.data == 'Cruising'){
                        document.getElementById("btn_take_off").disabled = true;
                        document.getElementById("btn_return").disabled = true;
                        document.getElementById("btn_stop").disabled = true;
                        
                    }else{
                        document.getElementById("btn_take_off").disabled = false;
                        document.getElementById("btn_return").disabled = true;
                        document.getElementById("btn_stop").disabled = false;                    
                    }
                })

                this.location_sub = new ROSLIB.Topic({
                    ros: this.ros,
                    name: '/location',
                    messageType: 'std_msgs/Int8'
                })
        
                this.location_sub.subscribe(function(message){
                    document.getElementById("uav_location").innerHTML = message.data;
                })

                this.height_sub = new ROSLIB.Topic({
                    ros: this.ros,
                    name: '/flight_height',
                    messageType: 'std_msgs/Int8'
                })
        
                this.height_sub.subscribe(function(message){
                    document.getElementById("uav_height").innerHTML = message.data;
                })

                document.getElementById("cam_topic").style.display = "block";
                document.getElementById("mjpeg").style.display = "block";
                this.showCamera()
            })
            this.ros.on('error', (error) => {
                this.failure = true
                this.logs.unshift((new Date()).toTimeString() + ' - Cannot establish connection with server')
                console.log('Connection Failed', error)
            })
            this.ros.on('close', () => {
                if(!(this.failure)){
                    this.logs.unshift((new Date()).toTimeString() + ' - disconnected')
                    this.connected = false
                    console.log('Connection Closed')
                }   
            })
        },

        disconnect: function(){
			delete this.cameraViewer;
            this.ros.close()
            this.connected = false
            console.log('Connection Closed')
            document.getElementById("cam_topic").style.display = "none";
            document.getElementById("mjpeg").style.display = "none";
        },

        showCamera: function(){
            console.log('set camera method')

            const image_port = parseInt(this.ws_address, 10) - 1010
            
            this.cameraViewer = new MJPEGCANVAS.Viewer({
                divID: 'mjpeg',
                host: '0.0.0.0',
                width: 640,
                height: 480,
                topic: '/iris1/camera_forward/color/image_raw',
                port: image_port,
            })

            document.getElementById("cam_topic").innerHTML = '/iris1/camera_forward/color/image_raw';
        },

        takeoff: function(){
            console.log('UAV takeoff')
            this.logs.unshift((new Date()).toTimeString() + 'UAV takeoff')

            //TODO
            /* Publish Takeoff signal */
            // Create a control signal publisher: take off 1, return 2, stop 0
            this.control_signal = new ROSLIB.Message({
                data: 1
            })

            this.control_pub.publish(this.control_signal)
            this.logs.unshift((new Date()).toTimeString() + 'Control Signal: ' + this.control_signal.data)

            document.getElementById("btn_take_off").disabled = true;
            document.getElementById("btn_return").disabled = false;
        },

        returning: function(){
            console.log('uav returning')
            this.logs.unshift((new Date()).toTimeString() + 'UAV returning')
            
            //TODO
            /* Publish uav landing signal */
            // Create a control signal publisher: take off 1, return 2, stop 0
            this.control_signal = new ROSLIB.Message({
                data: 2
            })

            this.control_pub.publish(this.control_signal)
            this.logs.unshift((new Date()).toTimeString() + 'Control Signal: ' + this.control_signal.data)

            document.getElementById("btn_take_off").disabled = false;
            document.getElementById("btn_return").disabled = true;
        },

        stop: function(){
            console.log('uav stopping')
            this.logs.unshift((new Date()).toTimeString() + 'UAV stopping')
            //TODO
            /*Send emergency stop signal (LAND DIRECTLY)*/
            // Create a control signal publisher: take off 1, return 2, stop 0
            this.control_signal = new ROSLIB.Message({
                data: 0
            })

            this.control_pub.publish(this.control_signal)
            this.logs.unshift((new Date()).toTimeString() + 'Control Signal: ' + this.control_signal.data)

            if(document.getElementById("btn_take_off").disabled == true && document.getElementById("btn_return").disabled == true){
                document.getElementById("btn_take_off").disabled = false;
                document.getElementById("btn_return").disabled = true;
            }else{
                document.getElementById("btn_take_off").disabled = true;
                document.getElementById("btn_return").disabled = true;
            }
        },

        startFlight: function(){
            //TODO
            /*Send goal point, direction, hover_time & cruise_height*/
            // Create a control signal publisher: take off 1, return 2, stop 0
            const destination = parseInt(this.destination, 10)

            this.dest_pub = new ROSLIB.Topic({
                ros: this.ros,
                name: '/flight_destination',
                messageType: 'std_msgs/Int8'
            });

            var flight_destination = new ROSLIB.Message({
                data: destination
            })

            this.dest_pub.publish(flight_destination)
            this.logs.unshift((new Date()).toTimeString() + 'Flying to tag ' + flight_destination.data)
        },

        chooseDirection: function(action){
            if(document.getElementById("left_btn").disabled || document.getElementById("right_btn").disabled){
                document.getElementById("left_btn").disabled = false;
                document.getElementById("right_btn").disabled = false;
            }else{
                switch(action){
                    case "left":
                        this.direction = 0;
                        document.getElementById("left_btn").disabled = false;
                        document.getElementById("right_btn").disabled = true;
                        break;
                    case "right":
                        this.direction = 1;
                        document.getElementById("left_btn").disabled = true;
                        document.getElementById("right_btn").disabled = false;
                        break;
                }
            }

        }
    },
    updated(){
        //TODO
        this.id_sub.subscribe(function(message){
            document.getElementById("uav_id").innerHTML = message.data;
            this.id_sub.unsubscribe();
        })

        if(this.destination == ''){
            document.getElementById("btn_start").disabled = true;
        }else{
            document.getElementById('btn_start').disabled = false;
        }   
    },
})

// ?????????????????????
// ???????????????????????????center ?????????????????????
function successGPS(position) {
const lat = position.coords.latitude;
const lng = position.coords.longitude;
center = [lat, lng];
triggerLeaflet()
};
function errorGPS() {
window.alert('??????????????????????????????????????????????????????????????????????????? ??????????????????');
triggerLeaflet()
}

if(navigator.geolocation) {
navigator.geolocation.getCurrentPosition(successGPS, errorGPS);
} else {
window.alert('?????????????????????GPS????????????????????????');
triggerLeaflet()
}

// ?????? Leaflet
function triggerLeaflet() {

    // *** ????????????
    let zoom = 17; // 0-18
    let map = L.map('map').setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '?? OpenStreetMap', // ?????????????????????????????????
        zoomControl: true , // ???????????? - + ??????
    }).addTo(map);
    var popup = L.popup();

    // ?????? marker
    const customIcon = L.icon({
        iconUrl: 'https://letswritetw.github.io/letswrite-leaflet-osm-locate/dist/dot.svg',
        iconSize: [16, 16],
    });
    const marker = L.marker(center, {
        icon: customIcon,
        title: 'UAV', // ??? <a> ??? title ??????
        opacity: 1.0
    }).addTo(map);

    function onMapClick(e) {
        popup
            .setLatLng(e.latlng)
            .setContent(e.latlng.toString())
            .openOn(map);
    }

    map.on('click', onMapClick);

    map.locate({
        setView: false,
        watch: true,
        maxZoom: 18,
        enableHighAccuracy: true
      });
    
    // ????????????????????????
    function errorHandler(e) {
    console.log("e", e);
    window.alert('Permission denied');
    }
    map.on('locationerror', errorHandler);

    // ?????????????????????
    function foundHandler(e) {
    console.log('e', e);
    map.panTo(e.latlng); // ?????????????????????????????????????????????
    marker.setLatLng(e.latlng); // ?????? marker
    moveTo(map); // ?????????????????????????????? || ?????? ?????????
    panBy(map); // ?????? x, y ??????
    }
    map.on('locationfound', foundHandler);



    // ?????????????????????????????? || ?????? ?????????
    function moveTo(map) {
    const btnPanto = document.querySelectorAll('.js-panto');
    Array.prototype.forEach.call(btnPanto, pan => {
        pan.addEventListener('click', e => {
        e.preventDefault();
        let latLng = e.target.dataset.to.split(',');
        let name = e.target.textContent;
        let toggleFly = document.getElementById('flyTo').checked;
        const popup = L.popup();
        popup
            .setLatLng(latLng)
            .setContent(`${name}`)
            .openOn(map);
        toggleFly ? map.flyTo(latLng) : map.panTo(latLng);
        })
    })
    }

    // ?????? x, y ??????
    function panBy(map) {
    const btnPanby = document.querySelectorAll('.js-panby');
    Array.prototype.forEach.call(btnPanby, pan => {
        pan.addEventListener('click', e => {
        e.preventDefault();
        let times = e.target.dataset.times;
        let point = 50 * times;
        let points = [point, point];
        map.panBy(points);
        })
    })
    }
}