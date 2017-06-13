#!/bin/bash

[[ "$#" -lt 1 ]] && {
    echo "pack_rootfs.sh <version>"
    exit
}

tar --owner=root --group=root -jcvf "rootfs_$1.tar.bz2" -C squashfs-root .
