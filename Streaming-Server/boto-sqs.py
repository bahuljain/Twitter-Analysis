import boto.sqs
from boto.sqs.jsonmessage import JSONMessage
import json
import time

def createQueue(queueName, sqs):
    q =sqs.create_queue
    print q

def writeMessage(queue, jsonDump):
    data = json.loads(jsonDump)
    queue.set_message_class(JSONMessage)
    m = JSONMessage()
    for key in data.keys():
        m[key] = data[key]
    myQueue.write(m)
    print 'Write Complete'

def getMessage(queue):
    queue.set_message_class(JSONMessage)
    while True:
        message = queue.read()
        if message:
            ID =  message.get('id') if message.has_key('id') else None
            text =  message.get('text') if message.has_key('text') else None
            category =  message.get('category') if message.has_key('category') else None
            print 'ID: ' + `ID` + ' Category: ' + `category`
        else:
            print 'chilling!!....'
            time.sleep(5)

def getMessage2(queue):
    message = queue.read()
    print message.get_body()

    # if queue.delete_message(message):
    #     print 'Tweet Read, Processed and Deleted'
    # else:
    #     print 'Error in Deleting Tweet'

sqs = boto.sqs.connect_to_region('us-east-1')
print 'Connection with SQS complete: ' + `sqs`

# q = sqs.create_queue('bahul')

# queueList = sqs.get_all_queues
myQueue = sqs.get_queue('bahul')
# print myQueue

content = {'id':'123', 'text':'yo yo yo'}
jsonDump = json.dumps(content)

# getMessage(myQueue)
getMessage2(myQueue)
# writeMessage(myQueue, jsonDump)
# deleteAllMessages(myQueue)
