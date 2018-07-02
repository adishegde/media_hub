#!/usr/bin/env bash

# first build using yarn
yarn build-cli

buildPath="$PWD/cli-build"
binPath="$PWD/bin"

osList='win macos linux'

rm -r $binPath

for os in $osList
do
	yarn run pkg "$buildPath/cli/daemon.js" --output "$binPath/$os-x64/daemon" --target "node8-$os-x64"
	yarn run pkg "$buildPath/cli/client.js" --output "$binPath/$os-x64/client" --target "node8-$os-x64"
	zip -r -X "$binPath/$os-x64.zip" "$binPath/$os-x64"
done
