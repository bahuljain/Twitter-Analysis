// top level variables
var mapPoints, map, markers = [], tweetPoints = [];

function loadFilteredMapPoints(keyword) {
	while(mapPoints.length > 0) {
		mapPoints.pop();
	}

	var points = tweetPoints;

	if (keyword !== "all") {
		points = tweetPoints.filter(function(tweet) {
			return tweet.category.indexOf(keyword) > -1
		})
	}


	points.forEach(function(point) {
		var p = new google.maps.LatLng(point.coordinates[1], point.coordinates[0]);
		mapPoints.push(p);
	});

	$('#sidebar #counter').text("Total points:" + mapPoints.length);

}

function initMap() {
	mapPoints = new google.maps.MVCArray([]);

	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 2,
		center: {lat: 0, lng: 0},
		mapTypeId: google.maps.MapTypeId.SATELLITE
	});

	heatmap = new google.maps.visualization.HeatmapLayer({
		opacity: 1,
		data: mapPoints,
		map: map
	});

	startListening();
}

function startListening() {
	var socket = io.connect();
	socket.on('tweets:connected', function(msg) {
		while (mapPoints.length > 0) {
			mapPoints.pop();
		}
		while (markers.length > 0) {
			marker = markers.pop();
			marker.setMap(null);
		}
	});

	socket.on('tweets:channel', function(tweet) {
		if (tweet.coordinates !== undefined) {
			tweetPoints.push(tweet);
			mapPoints.push(new google.maps.LatLng(tweet.coordinates[1], tweet.coordinates[0]));
			addMarker(tweet);
			$('#sidebar #counter').text("Total points:" + tweetPoints.length);
		}
	});
}

function addMarker (tweet) {
	var icon = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
	if(tweet.sentiment == "positive") {
		icon = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
	} else if (tweet.sentiment == "negative") {
		icon = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
	}
	markers.push(new google.maps.Marker({
		position: {lat: tweet.coordinates[1], lng: tweet.coordinates[0]},
		map: map,
		icon: icon,
		animation: google.maps.Animation.DROP,
		title: tweet.text
	}));
}

$(document).ready(function() {
	$('#dropdown').change(function(val) {
		loadFilteredMapPoints($('#dropdown').val())
	});
});
