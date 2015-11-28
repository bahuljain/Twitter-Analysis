var AWS = require("aws-sdk");

function load_onstart() {
	AWS.config.update({
  		region: "us-east-1",
  		accessKeyId: "XXXXXXXXXXXXXXXXXX", secretAccessKey: "XXXXXXXXXXXXXXXXXX"
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
        	var images = [];
        	for (var i = 0; i < data.Items.length; i++ ) {
            	images.push(JSON.stringify(data.Items[i]));
        	}
        	console.log(" "  + images.join(", "));
    	} else {
        	console.log("*** Finished scan ***");
    	}
	});
}

load_onstart();