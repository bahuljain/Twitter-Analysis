import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import com.amazonaws.AmazonClientException;
import com.amazonaws.AmazonServiceException;
import com.amazonaws.auth.AWSCredentials;
import com.amazonaws.auth.profile.ProfileCredentialsProvider;
import com.amazonaws.regions.Region;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.sqs.AmazonSQS;
import com.amazonaws.services.sqs.AmazonSQSClient;
import com.amazonaws.services.sqs.model.DeleteMessageBatchRequest;
import com.amazonaws.services.sqs.model.DeleteMessageBatchRequestEntry;
import com.amazonaws.services.sqs.model.Message;
import com.amazonaws.services.sqs.model.ReceiveMessageRequest;
import com.amazonaws.util.json.JSONException;
import com.amazonaws.util.json.JSONObject;

public class Consumer {
	private static AWSCredentials credentials = null;
	
	private static AmazonSQS init() {
		try {
			credentials = new ProfileCredentialsProvider("default").getCredentials();
		} catch (Exception e) {
			throw new AmazonClientException("Cannot load the credentials from the credential profiles file. "
					+ "Please make sure that your credentials file is at the correct "
					+ "location (C:\\Users\\Bahul\\.aws\\credentials), and is in valid format.", e);
		}

		AmazonSQS sqs = new AmazonSQSClient(credentials);
		Region usEast1 = Region.getRegion(Regions.US_EAST_1);
		sqs.setRegion(usEast1);

		System.out.println("===========================================");
		System.out.println("Getting Started with Amazon SQS");
		System.out.println("===========================================\n");

		return sqs;
	}

	private static void deleteBatchMessages(List<Message> messages, String queueUrl, AmazonSQS sqs) {
		// Delete a message
		System.out.println("Deleting Messages.\n");

		List<DeleteMessageBatchRequestEntry> entries = new ArrayList<DeleteMessageBatchRequestEntry>();
		for (Message m : messages) {
			entries.add(new DeleteMessageBatchRequestEntry(m.getMessageId(), m.getReceiptHandle()));
		}
		DeleteMessageBatchRequest deleteMessageBatchRequest = new DeleteMessageBatchRequest(queueUrl, entries);
		sqs.deleteMessageBatch(deleteMessageBatchRequest);
	}
	
	private static void processQueueMessages(AmazonSQS sqs) {
		// TODO Auto-generated method stub
		String queueName = "bahul";
		String queueUrl = sqs.getQueueUrl(queueName).getQueueUrl();

		// Receive messages
		int maxMessages = 5;

		while (true) {
			System.out.println("Receiving messages from MyQueue.\n");
			ReceiveMessageRequest receiveMessageRequest = new ReceiveMessageRequest(queueUrl)
					.withMaxNumberOfMessages(maxMessages);
			List<Message> messages = sqs.receiveMessage(receiveMessageRequest).getMessages();

			if (messages.size() > 0) {
				ExecutorService executor = Executors.newFixedThreadPool(10);
				for (Message message : messages) {
					try {
						JSONObject body = new JSONObject(message.getBody());
						Runnable worker = new WorkerThread(credentials, body);
						executor.execute(worker);
					} catch (JSONException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					}
				}
				
				try {
					System.out.println("Attempting to shut down worker now!!");
					executor.shutdown();
					executor.awaitTermination(10, TimeUnit.SECONDS);
				} catch (InterruptedException e) {
					e.printStackTrace();
				} finally {
					if (!executor.isTerminated()) {
						System.out.println("Cancelling all tasks and shutting down");
					}
					executor.shutdownNow();
				}
				
				// deleteBatchMessages(messages, queueUrl, sqs);

				System.out.println("Processed All Messages");
				break;
			} else {
				System.out.println("chilling!!....");
				try {
					Thread.sleep(10000);
				} catch (InterruptedException e) {
					e.printStackTrace();
				}
			}
		}
	}

	public static void main(String[] args) throws Exception {
		AmazonSQS sqs = init();
		try {
			processQueueMessages(sqs);
		} catch (AmazonServiceException ase) {
					
			System.out.println("Caught an AmazonServiceException, which means your request made it "
					+ "to Amazon SQS, but was rejected with an error response for some reason.");
			System.out.println("Error Message:    " + ase.getMessage());
			System.out.println("HTTP Status Code: " + ase.getStatusCode());
			System.out.println("AWS Error Code:   " + ase.getErrorCode());
			System.out.println("Error Type:       " + ase.getErrorType());
			System.out.println("Request ID:       " + ase.getRequestId());
		} catch (AmazonClientException ace) {
			System.out.println("Caught an AmazonClientException, which means the client encountered "
					+ "a serious internal problem while trying to communicate with SQS, such as not "
					+ "being able to access the network.");
			System.out.println("Error Message: " + ace.getMessage());
		}
	}
}
