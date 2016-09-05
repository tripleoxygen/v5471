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
#cp "$IMAGE_NAME$1.bin" test
printf 'shsq' | dd of=test bs=1 seek=$(( 0x20a000 )) count=4 conv=notrunc
printf '\x01' | dd of=test bs=1 seek=$(( 0x20a014 )) count=1 conv=notrunc
