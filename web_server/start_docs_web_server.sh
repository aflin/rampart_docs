die() {
	echo $1
	exit 1
}

RP=`which rampart`;

if [ "$RP" == "" ]; then
	echo "Cannot find rampart executable in your path"
	exit 1;
fi

if [ ! -e ./data/docs ]; then
    mkdir ./data/docs || die "could not create directory ./data/docs"
fi

cd ./apps/docs || die "could not find './apps/docs/' directory"

echo "Checking pages and database. Building if necessary"

$RP rsearch.js 

cd ../../

echo "Starting Web Server"

rampart ./web_server_conf.js

