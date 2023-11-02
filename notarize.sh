#!/bin/bash

ZIP=$1

if [[ -z "$ZIP" ]];
then
    echo "Path to zipped plugin not provided."
    echo "Run: ./notarize.sh ./path/to/frontify.sketchplugin.zip"
    exit 1
fi

echo "Notarizing "$ZIP" --keychain-profile "Sketch""

OUTPUT=$(xcrun notarytool submit $ZIP --keychain-profile "Sketch" --wait)

FIRST_LINE=$(echo "$OUTPUT" | sed -n '1p')

if [[ $FIRST_LINE != "No errors uploading"* ]];
then
    echo "Problems with the notarization process. Check the log bellow"
    echo "$OUTPUT"
    exit 1
else
    SECOND_LINE=$(echo "$OUTPUT" | sed -n '2p')
    UUID=$(echo $SECOND_LINE| cut -d '=' -f 2)

    echo "Plugin sent to the notarization server. To check the status of the request (might take a few minutes), run:"
    echo "xcrun notarytool log "$UUID" --keychain-profile "Sketch" developer_log.json"
fi
