@echo off
title HF Space Ping Keeper
echo.
echo ========================================
echo   HF SPACE PING KEEPER
echo ========================================
echo.
echo Starting ping keeper for:
echo https://gdfetcher789-gd-links.hf.space
echo.
echo This will keep your Hugging Face Space awake 24/7
echo Keep this window open!
echo.
echo Press Ctrl+C to stop
echo.

cd /d "%~dp0"
node ping-keeper.js

pause
