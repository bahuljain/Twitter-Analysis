import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPathExpressionException;

import org.w3c.dom.Document;
import org.xml.sax.SAXException;

import com.alchemyapi.api.AlchemyAPI;
import com.amazonaws.auth.AWSCredentials;
import com.amazonaws.regions.Region;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClient;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.amazonaws.services.dynamodbv2.model.PutItemRequest;
import com.amazonaws.services.dynamodbv2.util.Tables;
import com.amazonaws.services.sns.AmazonSNSClient;
import com.amazonaws.services.sns.model.PublishRequest;
import com.amazonaws.services.sns.model.PublishResult;
import com.amazonaws.util.json.JSONException;
import com.amazonaws.util.json.JSONObject;

public class WorkerThread implements Runnable {
	private JSONObject tweet;
	private AmazonDynamoDBClient dynamoDB;
	private AmazonSNSClient snsClient;
	private final String apiKey = "3669370d18a4239e2d6f494a46436716db13aa1c";
	private AWSCredentials credentials = null;

	public WorkerThread(AWSCredentials credentials, JSONObject tweet) {
		this.tweet = tweet;
		this.credentials = credentials;
	}

	private String getSentiment() {
		AlchemyAPI alchemyObj = AlchemyAPI.GetInstanceFromString(apiKey);

		Document doc;
		try {
			doc = alchemyObj.TextGetTextSentiment(tweet.getString("text"));
			String sentiment = doc.getElementsByTagName("type").item(0).getTextContent();
			return sentiment;
		} catch (XPathExpressionException | IOException | SAXException | ParserConfigurationException e) {
			e.printStackTrace();
			return null;
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}

	private void addSentimentToTweet(String sentiment) {
		try {
			this.tweet.put("sentiment", sentiment);
		} catch (JSONException e) {
			e.printStackTrace();
		}
	}

	private void addItem(String tablename, String id, String tweet) {
		// Add an item
		Map<String, AttributeValue> item = newItem(id, tweet);
		PutItemRequest putItemRequest = new PutItemRequest(tablename, item);
		this.dynamoDB.putItem(putItemRequest);
		System.out.println("Item added");
	}

	private Map<String, AttributeValue> newItem(String tweet_id, String tweet) {
		Map<String, AttributeValue> item = new HashMap<String, AttributeValue>();
		item.put("tweet_id", new AttributeValue(tweet_id));
		item.put("tweet", new AttributeValue(tweet));
		return item;
	}

	private void dynamoInit() {
		this.dynamoDB = new AmazonDynamoDBClient(this.credentials);
		this.dynamoDB.setRegion(Region.getRegion(Regions.US_EAST_1));
	}

	private void addToDynamo(JSONObject tweet) {
		dynamoInit();
		String tableName = "cloud-ass-2-test";
		if (Tables.doesTableExist(this.dynamoDB, tableName)) {
			try {
				addItem(tableName, tweet.getString("id"), tweet.toString());
			} catch (JSONException e) {
				e.printStackTrace();
			}
		} else {
			System.out.println("Table does not exist, please enter a valid table name.");
		}

	}

	private void snsPublish(String msg) {
		this.snsClient = new AmazonSNSClient(credentials);
		this.snsClient.setRegion(Region.getRegion(Regions.US_EAST_1));

		String topicArn = "arn:aws:sns:us-east-1:671774941075:Tweet-Feed";
	
		PublishRequest publishRequest = new PublishRequest(topicArn, msg);
		PublishResult publishResult = snsClient.publish(publishRequest);

		System.out.println("MessageId - " + publishResult.getMessageId());
	}

	@Override
	public void run() {
		String sentiment = "positive";//getSentiment();
		if (sentiment != null) {
			addSentimentToTweet(sentiment);
//			addToDynamo(this.tweet);
			snsPublish(this.tweet.toString());
		}		
	}
}
