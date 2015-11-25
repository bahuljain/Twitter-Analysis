import java.io.IOException;

import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPathExpressionException;

import org.w3c.dom.Document;
import org.xml.sax.SAXException;

import com.alchemyapi.api.AlchemyAPI;
import com.amazonaws.util.json.JSONObject;

public class WorkerThread implements Runnable {
	private JSONObject tweet;
	private String WorkerID;
	private final String apiKey = "3669370d18a4239e2d6f494a46436716db13aa1c";

	public WorkerThread(JSONObject tweet) {
		Double d = new Double(Math.random());
		this.WorkerID = Math.abs(d.hashCode()) + "";
		this.tweet = tweet;
	}

	private String getSentiment() {
		AlchemyAPI alchemyObj = AlchemyAPI.GetInstanceFromString(apiKey);

		Document doc;
		try {
			// System.out.println(this.WorkerID + ": " + tweetText);
			doc = alchemyObj.TextGetTextSentiment(tweet.getString("text"));
			String sentiment = doc.getElementsByTagName("type").item(0).getTextContent();
			return sentiment;
		} catch (XPathExpressionException | IOException | SAXException | ParserConfigurationException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return null;
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}

	@Override
	public void run() {
		// TODO Auto-generated method stub
		String sentiment = getSentiment();
		if (sentiment != null) {
			System.out.println(this.WorkerID + ": " + sentiment);
		}
	}
}
