#!/bin/bash

[[ "$#" -lt 1 ]] && {
    echo "sign.sh <version>"
    exit
}

gpg -u CB10519F -b -a "build/$1/B14103-GVT-OXY-$1.bin"
