// top level variables
var mapPoints, map, markers = [], tweetPoints = [];
var pos, neg, neu, socket;
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
	socket = io.connect();
	socket.on('tweets:connected', function (msg) {
		pos = 0, neg = 0, neu = 0;
		while (mapPoints.length > 0) {
			mapPoints.pop();
		}
		while (markers.length > 0) {
			marker = markers.pop();
			marker.setMap(null);
		}
	});

	socket.on('tweets:channel', function (tweet) {
		if (tweet.coordinates !== undefined) {
			tweetPoints.push(tweet);
			mapPoints.push(new google.maps.LatLng(tweet.coordinates[1], tweet.coordinates[0]));
			addMarker(tweet);
			counterUpdates();
		}
	});

	socket.on('trends:response', function (trends) {
		showTrendingTopics(trends);
	});
}

function showTrendingTopics (trends) {
	$('#sidebar #trending-topics').text("");
	if(trends["error"] == false ) {
		trends = trends["trends"];
		$('#sidebar #trending-topics').append("<h4>Top 10 Trending Topics:</h4>");
		for (var i = 0; i < trends.length; i++) {
			$('#sidebar #trending-topics').append("<p>" + trends[i]["name"] + "</p>");
		}
	} else {
		log = trends["trends"]["log"];
		$('#sidebar #trending-topics').append("<h4>Error</h4>");
		$('#sidebar #trending-topics').append("<p>" + log.message + "</p>");
	}
}

function counterUpdates () {
	$('#sidebar #counter').text("Total Tweets: " + tweetPoints.length);
	$('#sidebar #positive-counter').text("Positive Tweets: " + pos);
	$('#sidebar #negative-counter').text("Negative Tweets: " + neg);
	$('#sidebar #neutral-counter').text("Neutral Tweets: " + neu);
}

function addMarker (tweet) {
	var icon = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";

	if(tweet.sentiment == "positive") {
		icon = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
		pos += 1;
	} else if (tweet.sentiment == "negative") {
		icon = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
		neg += 1;
	} else {
		neu += 1;
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
		// loadFilteredMapPoints($('#dropdown').val())
		socket.emit('trend:request', {woeid: parseInt($('#dropdown').val())});
	});
});
