#!/usr/bin/env node
const AWS = require('aws-sdk');
const amqp = require('amqplib/callback_api');
const pg = require('pg');
const client;

AWS.config.update({
    region: 'us-east-2'
});

module.exports = function publishMetric(queueSize) {
    const params = {
        MetricData: [
            {
                MetricName: 'QUEUE_SIZE',
                Unit: 'None',
                Value: queueSize
            },
        ],
        Namespace: 'WORKER'
    };

    return cw.putMetricData(params).promise();
}

function connect(rabbitUrl) {
    return new Promise(function (resolve, reject) {
        amqp.connect(rabbiturl, function (err, conn) {
            if (err) {
                console.error('Unable to connect to rabbit.');
                return reject(err);
            }
            resolve(conn);
        });
    });
}

function createChannelAsync(conn) {
    return new Promise((resolve, reject) => {
        conn.createChannel(function (err, channel) {
            if (err) {
                console.error('Unable to create rabbit channel.');
                return reject(err);
            }
            resolve(channel);
        });
    });
}

function getMessageCountAsync(channel, queueName) {
    return new Promise((resolve, reject) => {
        channel.assertQueue(queueName, {}, function (err, info) {
            if (err) {
                return reject(err);
            }
            resolve(info.messageCount);
        });
    })
}

async function getAllBookmarks(dbUrl) {
    const client = pg.Client(dbUrl);
    await client.connect();
    const query = 'SELECT * FROM bookmarks';
    const result = await client.query(query);
    return result.rows;
};

function publishMetricAsync(awsSecretKeyId, awsSecretKey, count) {
    var cw = new AWS.CloudWatch({
        apiVersion: '2010-08-01',
        accessKeyId: awsSecretKeyId,
        secretAccessKey: awsSecretKey
    });

    const params = {
        MetricData: [
            {
                MetricName: 'QUEUE_SIZE',
                Unit: 'None',
                Value: count
            },
        ],
        Namespace: 'WORKER'
    };

    return cw.putMetricData(params).promise();
}

function publishToChannel(channel, bookmarks, queueName) {
    bookmarks.forEach(b => {
        console.log(`Queueing bookmark: ${b.id}`);
        channel.assertQueue(queueName, {
            durable: true
        });
        channel.sendToQueue(queueName,
            Buffer.from(JSON.stringify(b)), {
                persistent: true
            }
        );
    });
}

return async function (ctx, callback) {
    const { secrets } = ctx;
    const notProvided = [
        'RABBIT_URL', 'CHANNEL_NAME', 'AWS_SECRET_KEY_ID', 
        'AWS_SECRET_KEY', 'DB_URL'
    ].filter((envVar) => !secrets[envVar]);

    if (notProvided.length > 0) {
        return callback(new Error(`ENV Vars not provided ${notProvided.join(',')}`))
    }


    const conn = await connect(secrets.RABBIT_URL);
    const channel = await createChannelAsync(conn);

    switch (secrets.OPERATION) {
        case 'MONITOR':
            // minute
            const remaining = await getMessageCountAsync(channel, secrets.CHANNEL_NAME);
            await putMetricData(secrets.AWS_SECRET_KEY_ID, secrets.AWS_SECRET_KEY, remaining);
        case 'PUBLISHER':
            // Each 20 minutes
            const bookmarks = await getAllBookmarks(secrets.DB_URL);
            publishToChannel(channel, bookmarks, secrets.CHANNEL_NAME);
        default:
            return callback(new Error('Invalid operation'))
    }

    callback(null, {
        finished: role
    });
}
