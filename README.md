# Twitter-Analysis
######Fun with Twitter, Amazon AWS, Google Maps and Alchemy APIs
A highly distributed and scalable application that receives tweets in real-time, performs sentiment analysis on them and displays them on a world map along with other features such as topics trending in different places around the world.

![alt tag](https://raw.github.com/bahuljain/Twitter-Analysis/master/screenshot.jpg)

The entire architechture consists of 3 main components:

1. Streaming Server
2. Queue-Consumer or the Worker
3. Application Server

### 1. Streaming Server
- Built in python.
- Uses the twitter streaming api.
- Uses boto-sdk for Amazon-AWS.

#### Functionality
New tweets are received in real-time. They are filtered based on keywords and languages. Also only those tweets that have geo-coordinates enabled in them are accepted.

Keywords Used: 'movies', 'sports', 'music', 'finance', 'technology', 'fashion', 'science', 'travel', 'health', 'cricket', 'india', 'love', 'shit'.

Languages Used: english - en, french - fr, german - de, italian - it, portugese - pt, spanish - es, russian - ru, arabic - ar
 
Once these tweets are received, they are written to a distributed queue, using Amazon SQS service.

### 2. Queue Consumer/ Worker
- Built in Java.
- Uses alchemy api for sentiment analysis.
- Uses AWS-SDK for eclipse.

#### Functionality
- A batch of 10 tweets are read from the queue.
- For each message a new worker is spawned. Multiple workers run together using Thread Pool Executors.
- At each worker, sentiment analysis is performed on a single tweet which returns one of the three values: 'positive', 'negative', 'neutral'.
- The tweet along with its sentiment is put in the database. We have used DynamoDB as a distributed database service owing to the simplicity of the schema and its highly availability.
- Also the tweet is published as a SNS notification on the topic - 'Tweet-Feed'.

### 3. Application Server
- Built in node.js.
- Uses twitter api for trend analysis.
- Uses aws-sdk, express, and socket.io

#### Functionality
###### Back-End
- A server is created
- A socket connection is established with the front-end client when it is launched.
- On initial connection, we fetch all the tweets from our table in DynamoDB and push to the front-end via sockets.
- The app server is subscribed to the topic 'Tweet-Feed' and receives tweets as soon as a new tweet is published to this topic. This happens in the form of post requests.
- As soon as this tweet is received it is pushed on the front end and displayed accordingly.

###### Front-End
- We have displayed all the tweets on Google Maps using the coordinates we have received in the tweets.
- A heatmap layer shows the density of the tweets.
- Also each tweet has a marker associated with it, the color of the marker represents the sentiment of the tweet (green - positive, red - negative, blue - neutral).
- A total count of all the tweets, tweets with positive sentiment, negative sentiment and neutral sentiment is also shown
- Lastly a drop down is provided with a list of places. Selecting any place shows the top ten trending topics in that area (Back-End call is made via sockets).
