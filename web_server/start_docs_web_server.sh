die() {
	echo $1
	exit 1
}

RP=`which rampart`;

ME=`whoami`

if [ "$RP" == "" ]; then
	echo "Cannot find rampart executable in your path"
	exit 1;
fi

if [ ! -e ./data/docs ]; then
    mkdir ./data/docs || die "could not create directory ./data/docs"
fi

cd ./apps/docs || die "could not find './apps/docs/' directory"

echo "Checking pages and database. Building if necessary"

$RP rsearch.js && {

    cd ../../

    # The web server will run as "nobody" if we are root.
    if [ "$ME" == "root" ]; then
        chown -R nobody data/docs
    fi

    echo "Starting Web Server"

    $RP ./web_server_conf.js
} || {
    die "build of Documentation Database failed"
}
