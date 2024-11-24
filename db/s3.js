const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

const client = new S3Client({
    region: process.env.S3_BUCKET_REGION,
    endpoint: `https://s3.${process.env.S3_BUCKET_REGION}.amazonaws.com`,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    }
})

module.exports = client;