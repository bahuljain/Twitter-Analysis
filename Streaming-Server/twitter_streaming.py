# -*- coding: utf-8 -*-
#Import the necessary methods from tweepy library

from tweepy.streaming import StreamListener
from tweepy import OAuthHandler
from tweepy import Stream
import json
from HTMLParser import HTMLParser
import boto.sqs
from boto.sqs.message import Message

#Variables that contains the user credentials to access Twitter API
access_token = "563806852-TgZSJkG413GrZ2g0TzRsyGh7lUAluLmrsKTCnKNs"
access_token_secret = "hqwb3QFb82LKXR10RAAbfEg8HBUMBQMsY8roZ9KySyar5"
consumer_key = "Tq20eDbLhvBBGgK2jXcp8Faif"
consumer_secret = "flSsRrcAJQCwgfbpnHbcPBy5bN9YexArVB5pYdHtdC25dbipO6"

keywordList = ['movies','sports','music','finance','technology','fashion','science','travel','health','cricket','india','love','shit']
supportedLang = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ar']

def findCategory(text, keywordList):
    category = []
    for keyword in keywordList:
        if keyword in text:
            category.append(keyword)
    return category

def writeMessage(sqs, queueName, jsonDump):
    myQueue = sqs.get_queue(queueName)
    sqs.send_message(myQueue, jsonDump)
    print 'Write To Queue Complete' + '\n'

#This is a basic listener that just stores received tweets to database.
class StdOutListener(StreamListener):

    def __init__(self, sqs):
        self.counter = 1
        self.limit = 100
        self.sqs = sqs

    def on_data(self, data):
        if self.counter <= self.limit:
            decoded = json.loads(HTMLParser().unescape(data))

            if decoded.get('coordinates',None) is not None and decoded['lang'] in supportedLang:
                id = decoded['id']
                time = decoded.get('created_at','')
                text = decoded['text'].lower().encode('ascii','ignore').decode('ascii')
                coordinates = decoded.get('coordinates','').get('coordinates','')
                category = findCategory(text, keywordList)
                if len(category) > 0:
                    print 'Tweet Count # ' + `self.counter`
                    content = {
                        'id': id,
                        'time': time,
                        'text': text,
                        'coordinates': coordinates,
                        'category': category
                    }

                    jsonDump = json.dumps(content)
                    # print jsonDump + '\n'
                    writeMessage(self.sqs, 'bahul' ,jsonDump)
                    self.counter += 1
        else:
            twitterStream.disconnect()

    def on_error(self, status):
        print status

if __name__ == '__main__':
    flag = True
    while flag:
        try:
            sqs = boto.sqs.connect_to_region('us-east-1')
            print 'Connection with SQS complete: ' + `sqs`

            #This handles Twitter authentification and the connection to Twitter Streaming API
            l = StdOutListener(sqs)
            auth = OAuthHandler(consumer_key, consumer_secret)
            auth.set_access_token(access_token, access_token_secret)
            twitterStream = Stream(auth, l)
            #This line filter Twitter Streams to capture data by the keywords: 'python', 'javascript', 'ruby'
            twitterStream.filter(track=['movies','sports','music','finance','technology','fashion','science','travel','health','cricket','india', 'love', 'shit'])
            # flag = False
        except:
            # flag = False
            continue
