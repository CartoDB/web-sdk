#!/bin/bash

VERSION=$(node --eval "console.log(require('./package.json').version);")

printf "\n"
echo -e "Ready to publish to the CDN Web SDK version \033[1m$VERSION\033[0m"
echo -e "This procedure assumes that the version has already been published to npm"
read -n1 -r -p ">> PRESS Ctrl+C to cancel, or any other key to continue..." key

echo -e "Uploading to CDN..."

printf "\n"
echo -e "\t# Step 1/2 Publish"
node scripts/cdn/publish.js 'release' $@

printf "\n"
echo -e "\t# Step 2/2 Invalidate"
node scripts/cdn/invalidate.js $@

printf "\n"
echo "[OK] Publication to CDN has finished"
echo "------------------------------------------------"