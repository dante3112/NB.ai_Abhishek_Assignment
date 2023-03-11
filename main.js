// initialize empty objects to store start and destination coordinates
var startPointLatLng = new Object;
var dstPointLatLng = new Object;

// get the HTML elements to display the distance and duration of the route
var distanceElement = document.getElementById("distanceValue");
var durationElement = document.getElementById("durationValue");

// initialize an empty array to store markers
var markers = [];

// function to check if an object is empty
function isEmpty(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop))
            return false;
    }
    return true;
}

/*
function getCurrentPos(destinationLocation) {
    console.log("In getCurrentPost");
    var checkDstPoint = isEmpty(destinationLocation);
    if (checkDstPoint == false){
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showRoute);
          } else { 
            alert("Geolocation not supported");
          }
    }
    else{
        alert("select your destination");
    }
}
*/

// function to calculate and display the route on the map
function calculateRoute() {
    // check if start and destination coordinates have been selected
    if(isEmpty(startPointLatLng)){
        alert('Please enter start location')
        return
    }
    if(isEmpty(dstPointLatLng)){
        alert('Please enter end location')
        return
    }
    // calculate and display the route
    showRoutev2(startPointLatLng.lat, startPointLatLng.lng, dstPointLatLng.lat, dstPointLatLng.lng)
    // add markers to the map for the start and destination locations
    addSimpleMarker(map, document.getElementById("start_new").value, startPointLatLng)
    addSimpleMarker(map, document.getElementById("end_new").value, dstPointLatLng)
}

// function to calculate and display the route on the map using the NextBillion Directions API
function showRoutev2(lat1, lng1, lat2, lng2) {
    // create a new instance of the NextBillion DirectionsService
    var directionsService = new nextbillion.maps.DirectionsService();
    // make a request to the API to get the route details
    directionsService.route({
        origin: {lat: lat1, lng: lng1},
        destination: {lat: lat2, lng: lng2},
        steps: true,
        mode: 'car'
    })
    // if the request is successful, display the route on the map
    .then((response) => {
        console.log("Route Details ===> ", response);
        // create a geojson object for the route
        map.map.addSource("route", {
            type: "geojson",
            data: {
                type: "Feature",
                properties: {},
                geometry: {
                    type: "LineString",
                    coordinates: nextbillion.utils.polyline
                        .decode(response.routes[0].geometry, 6)
                        .map((c) => c.reverse())
                }
            }
        });

        // add the route to the map as a line layer
        map.map.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
                "line-join": "round",
                "line-cap": "round"
            },
            paint: {
                "line-color": "rgba(6,162,144,0.77)",
                "line-width": 3
            }
        });
    });
}

// function to add autocomplete functionality to search input fields

function searchInput(elementID) {
    var tempRequestData;
    if (elementID == 'start_new')
        startPointLatLng = new Object;
    else if (elementID == 'end_new') {
        dstPointLatLng = new Object;
    }
    console.log('called')
    $("#" + elementID).autocomplete({
        source: function (request, response) {
            $.ajax({
                url: "https://api.nextbillion.io/h/geocode?key=2707de05fbd440de9b40202d1f93f7cd&q=" + request.term + "&in=countryCode:IND",
                dataType: "json",
                success: function (data) {
                    tempRequestData = data;
                    var tempArr = new Array;
                    for (var i = 0; i < data.items.length; i++) {
                        var tempObj = {};
                        tempObj.value = data.items[i].title;
                        tempObj.label = tempObj.value;
                        tempObj.details = data.items[i];
                        tempArr.push(tempObj);
                    }
                    console.log("RevGeocode data ===> ", tempArr);
                    response(tempArr);
                }
            });
        },
        focus: function (event, ui) {
            $("#" + elementID).val(ui.item.title);
            return false;
        },
        minLength: 3,
        select: function (event, ui) {
            console.log(ui);
            if (elementID == 'start_new') {
                startPointLatLng = ui.item.details.position;
                console.log("Start Point Coordinates ===> ", startPointLatLng);
            } else if (elementID == 'end_new') {
                dstPointLatLng = ui.item.details.position;
                console.log("Destination Point Coordinates ===> ", dstPointLatLng);
            }
        }
    });
}

//Function to add a simple marker
function addSimpleMarker(nbmap, title, location) {
    const popup = new nextbillion.maps.Popup({
        offset: 25,
        closeButton: false
    }).setText(title);
    const marker = new nextbillion.maps.Marker()
        .setLngLat({lat: location.lat, lng: location.lng})
        .setPopup(popup)
        .addTo(nbmap.map);
    marker.togglePopup();
    markers.push(marker)
}

//function to clear route
function clearRoute() {
    try{
        map.map.removeLayer("route");
        map.map.removeSource("route");
    }catch (e) {
        console.log(e)
    }
    dstPointLatLng = new Object;
    startPointLatLng = new Object;
    for(let i=0; i< markers.length; i++)
        try{
            markers[i].remove()
        }catch(e){console.log(e)}
    markers = []
    document.getElementById('start_new').value = ''
    document.getElementById('end_new').value = ''
}