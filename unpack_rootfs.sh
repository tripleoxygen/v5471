#!/bin/bash

[[ "$#" -lt 1 ]] && {
    echo "unpack_rootfs.sh <version>"
    exit
}

mkdir -p "squashfs-root"

tar -jxvf "rootfs_$1.tar.bz2" -C squashfs-root
