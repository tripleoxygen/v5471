#!/bin/sh
TOOLS_PREFIX=../../..

mkdir -p build/$1
$TOOLS_PREFIX/squashfs-4.2/mksquashfs squashfs-root/ build/$1/rootfs.squashfs -comp lzma -b 65536 -all-root
