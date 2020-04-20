#!/bin/bash

ZIP=$1

if [[ -z "$ZIP" ]];
then
    echo "Path to zipped plugin not provided."
    echo "Run: ./notarize.sh ./path/to/frontify.sketchplugin.zip"
    exit 1
fi

BUNDLE=frontify.sketchplugin
EMAIL=$(security find-generic-password -s AC_PASSWORD | grep acct | cut -d '=' -f 2 | sed -e 's/"//g')
PASSWORD=$(security find-generic-password -s AC_PASSWORD -w)

if [[ -z "$EMAIL" || -z "$PASSWORD" ]];
then
    echo "Missing email or password. Use the following command to add the credentials to keychain for future use."
    echo "security add-generic-password -a <email> -w <password> -s AC_PASSWORD"
    exit 1
fi

echo "Notarizing "$ZIP" with the bundle id "$BUNDLE" using the email "$EMAIL" and the password "$PASSWORD

OUTPUT=$(xcrun altool --notarize-app -f $ZIP  --primary-bundle-id $BUNDLE -u $EMAIL -p $PASSWORD)

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
    echo "xcrun altool --notarization-info "$UUID" -u "$EMAIL" -p "$PASSWORD
fi
