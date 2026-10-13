#!/bin/sh
#
# Copy the documentation into the Mini IDE in a rampart web_server directory:
#   source/*                        -> web_server/ide/docs/source/
#   build/html/*                    -> web_server/ide/docs/html/
#   web_server/apps/docs/rsearch.js -> web_server/ide/apps/docs/
#
# Run "make html" first.  web_server/start-mini-ide.sh then runs rsearch.js,
# which builds the pages in ide/html/docs/ and the search index in
# ide/data/docs/.  Everything stays under ide/, so removing web_server/ide
# removes the IDE and its documentation.

cd "$(dirname "$0")" || exit 1

DEST=/usr/local/src/rampart/web_server

if [ ! -d "$DEST" ]; then
    printf "%s does not exist.\nDestination web_server directory: " "$DEST"
    read -r DEST
    if [ -z "$DEST" ] || [ ! -d "$DEST" ]; then
        echo "'$DEST' is not a directory" >&2
        exit 1
    fi
fi

if [ ! -f build/html/index.html ]; then
    echo "build/html/index.html not found.  Run 'make html' first." >&2
    exit 1
fi

IDE="$DEST/ide"
mkdir -p "$IDE/docs/source" "$IDE/docs/html" "$IDE/apps/docs" || exit 1

# editor backup files (*~) are left behind
(cd source && tar cf - --exclude='*~' .) | (cd "$IDE/docs/source" && tar xpf -) || exit 1
cp -pR build/html/. "$IDE/docs/html/" || exit 1
cp -p web_server/apps/docs/rsearch.js "$IDE/apps/docs/" || exit 1

echo "Copied docs to $IDE/docs and rsearch.js to $IDE/apps/docs"
