#!/bin/bash

BRANCH=$(git branch | grep -e "^*" | tr -d '* ';)

printf "\n"
echo -e "Ready to publish to the CDN Web SDK branch \033[1m$BRANCH\033[0m"
read -n1 -r -p ">> PRESS Ctrl+C to cancel, or any other key to continue..." key

echo -e "Uploading to CDN..."

printf "\n"
echo -e "\t# Step 1/2 Publish"
node scripts/cdn/publish.js 'current_branch' $@

printf "\n"
echo -e "\t# Step 2/2 Invalidate"
node scripts/cdn/invalidate.js $@

printf "\n"
echo "[OK] Publication to CDN has finished"
echo "------------------------------------------------"