#!/bin/sh
TOOLS_PREFIX=./tools

$TOOLS_PREFIX/squashfs-4.2/mksquashfs squashfs-root/ build/$1/rootfs -comp lzma -b 65536 -all-root
