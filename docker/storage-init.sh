#!/bin/sh
# Creates the local bucket with public read and browser-upload CORS.
# Idempotent: safe on every `docker compose up`.
set -e
S3="aws --endpoint-url http://storage:9000 s3api"

$S3 head-bucket --bucket portfolio 2>/dev/null || $S3 create-bucket --bucket portfolio

# Anyone may read files (the site links to them); only signed requests may write.
$S3 put-bucket-policy --bucket portfolio --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": ["s3:GetObject"],
    "Resource": ["arn:aws:s3:::portfolio/*"]
  }]
}'

# The admin uploads straight from the browser with presigned PUTs.
$S3 put-bucket-cors --bucket portfolio --cors-configuration '{
  "CORSRules": [{
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }]
}' || echo "storage-init: CORS not supported by this server; skipping."

echo "storage-init: bucket ready."
