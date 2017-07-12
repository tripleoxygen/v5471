#!/bin/sh

IMAGE_NAME="B14103-GVT-OXY-"
BASE_KERNEL_VER=103961

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

cp bin/header"$BASE_KERNEL_VER" $OUTPUT_DIR/header
cp bin/kernel"$BASE_KERNEL_VER"con $OUTPUT_DIR/kernel

./build_fs.sh "$1"

cd $OUTPUT_DIR/

cp rootfs rootfs.patched

# Pace uses a different magic and compression flag
printf 'shsq' | dd of=rootfs.patched bs=1 seek=$(( 0x00 )) count=4 conv=notrunc
printf '\x01' | dd of=rootfs.patched bs=1 seek=$(( 0x14 )) count=1 conv=notrunc

cat header kernel rootfs.patched > "$IMAGE_NAME$1.bin"
