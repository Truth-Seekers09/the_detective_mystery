#!/bin/sh
# Mac / Linux: build and start the browser version. Needs g++ (Xcode command line tools on Mac).
cd "$(dirname "$0")" && make web && ./hiddentruth_web
