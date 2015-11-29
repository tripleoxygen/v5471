#!/bin/sh

IMAGE_NAME="B14103-GVT-OXY-"
BASE_KERNEL_VER=98509

OUTPUT_DIR="build/$1"

[[ "$#" -lt 1 ]] && {
    echo "build.sh <version>"
        exit
}

[ -d $OUTPUT_DIR ] && {
    echo "Dir exists"
    exit
}

rm -rf $OUTPUT_DIR
mkdir -p $OUTPUT_DIR

cp bin/header $OUTPUT_DIR/header
cp bin/kernel"$BASE_KERNEL_VER"con $OUTPUT_DIR/kernel

./build_fs.sh "$1"

cd $OUTPUT_DIR/

cat header kernel rootfs > "$IMAGE_NAME$1.bin"
