@echo off
REM Hourly ingest wrapper run by Windows Task Scheduler.
REM Pulls the latest Apify snapshot and generates new "why" blurbs (npm run ingest),
REM logging to logs\ingest.log. Standalone — the dev server does NOT need to be running.
cd /d "C:\Users\User\Website.apps\TrendSite"
if not exist logs mkdir logs
echo [%date% %time%] ingest start>> logs\ingest.log
call npm run ingest >> logs\ingest.log 2>&1
echo [%date% %time%] ingest done (exit %errorlevel%)>> logs\ingest.log
echo.>> logs\ingest.log
