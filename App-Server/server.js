var express = require('express');
var AWS = require("aws-sdk");
var bodyParser = require('body-parser');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var SNSClient = require('aws-snsclient');

// setup static content
app.use(express.static(__dirname + "/public"));

// parse application/json
app.use(bodyParser.json());

var Twitter = require('twitter');
var client = new Twitter({
	consumer_key: 'zcyBebO0dPSrBQXPlQlybk7bp',
	consumer_secret: 'aXjQXYoEGVVF4e0bRXDTnvc5DTsaw1NNpfksrhrPhDUf3ubMV2',
	access_token_key: '2793739158-pVYEiXZd90qMuXLsULyRfSuSQodVco3RXBXHk2H',
	access_token_secret: '29pbt0iVYWOTiwCZGTy9xnCu87FdY4TsciSrvdnGEajIE'
});

function getTrends(woeid) {
    var params = {id: woeid};
    client.get('trends/place', params, function(error, tweets, response){
    	if (!error) {
		name = [], urls = [];
		trends = tweets[0];
		trends["error"] = false;
		if(curSocket !== undefined) {
			curSocket.emit("trends:response", trends);
		}
        } else {
          	console.log(error);
			curSocket.emit("trends:response", {'trends': {'error':true, log:error[0]}})
        }
    });
}

var curSocket = undefined;
var count = 0;
var client = SNSClient(function(err, message) {
    tweet = JSON.parse(message["Message"]);	    
    count += 1;
    console.log("SNS #" + count + " : New Tweet Received");
    if (curSocket !== undefined) {
    	curSocket.emit("tweets:channel", tweet);
    } else {
	console.log("No socket connection defined");
    }
});

app.post('/newTweet', function (request, response) {
    client(request, response);
});


// loading data from dynamo in the beginning
function loadFromDynamo(socket) {
	//credentials of bkj2111@columbia.edu account
	AWS.config.update({
  		region: "us-east-1",
  		accessKeyId: "", secretAccessKey: ""
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
	curSocket = socket;
    console.log("new user connected");
    socket.emit("tweets:connected", { msg: "hello world from server" });
    loadFromDynamo(socket);

	curSocket.on('trend:request', function(msg) {
		getTrends(msg.woeid);
	});
});


var port = 3000;
// start listening
http.listen(process.env.PORT || port, function() {
    console.log('listening on 3000');
});
