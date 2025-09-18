#!/bin/bash

echo "✅ Setting up Google Service files..."

# Create google-services.json in the root directory
if [ -n "$GOOGLE_SERVICES_JSON_BASE64" ]; then
  echo $GOOGLE_SERVICES_JSON_BASE64 | base64 --decode > ./google-services.json
  echo "Generated google-services.json"
fi

# Create GoogleService-Info.plist in the root directory
if [ -n "$GOOGLE_SERVICES_PLIST_BASE64" ]; then
  echo $GOOGLE_SERVICES_PLIST_BASE64 | base64 --decode > ./GoogleService-Info.plist
  echo "Generated GoogleService-Info.plist"
fi
