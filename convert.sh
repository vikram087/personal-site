#!/bin/bash

SRC="$HOME/Downloads/Photos"     # folder with your originals
OUT="$HOME/Documents/CS/Personal/personal-site/public/photos"                # destination

find "$SRC" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) |
while read -r f; do
  ffmpeg -y -i "$f" -vf "scale='min(1200,iw)':-1" -quality 80 "$OUT/$(basename "${f%.*}").webp"
done
