var express = require('express');
var AWS = require("aws-sdk");
var bodyParser = require('body-parser');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
// setup static content
app.use(express.static(__dirname + "/public"));

// parse application/json
app.use(bodyParser.json());

var sockets = [];
var count = 0;
app.post('/newTweet', function (request, response) {
	var body = '';

	request.on('data', function (data) {
		body += data;
	});

	request.on('end', function () {
		postBody = JSON.parse(body);
		tweet = postBody["Message"]
		tweet = JSON.parse(tweet);
		count += 1;
		console.log("SNS #" + count + " : New Tweet Received");
		if (sockets.length > 0) {
			sockets[sockets.length - 1].emit("tweets:channel", tweet);
		} else {
			console.log("No socket connection defined");
		}
	});

	response.status(200);
	response.send("received");
});

// loading data from dynamo in the beginning
function loadFromDynamo(socket) {
	AWS.config.update({
  		region: "us-east-1",
  		accessKeyId: "AKIAJOMJGPJBNRWN2RNQ", secretAccessKey: "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"
	});
	var dynamodb = new AWS.DynamoDB();
	var params = {
    	TableName: 'cloud-ass-2-test'
	};

	dynamodb.scan(params).eachPage(function(err, data) {
    	if (err) {
        	console.log(err); // an error occurred
    	} else if (data) {
        	console.log("Last scan processed " + data.ScannedCount + " items: ");
        	for (var i = 0; i < data.Items.length; i++ ) {
				tweet = data.Items[i]["tweet"]["S"];
				tweet = JSON.parse(tweet);
				// console.log(tweet["text"]);
				socket.emit("tweets:channel", tweet);
        	}
    	} else {
        	console.log("*** Finished scan ***");
    	}
	});
}

// beginning socket transmission in response to io.connect() at the client side
io.on('connection', function(socket) {
	sockets.push(socket);
    console.log("new user connected");
    socket.emit("tweets:connected", { msg: "hello world from server" });
    loadFromDynamo(socket);
});

var port = 3000;
// start listening
http.listen(process.env.PORT || port, function() {
    console.log('listening on 3000');
});
