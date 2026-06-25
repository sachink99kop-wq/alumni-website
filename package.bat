@echo off
REM ============================================================
REM  package.bat  -  Build a Hostinger-ready deployment zip
REM  Double-click this file (or run it in cmd) from the project
REM  folder. It produces: alumni-website-hostinger.zip
REM  Upload that zip to public_html and "Extract" in Hostinger.
REM ============================================================

setlocal enabledelayedexpansion
cd /d "%~dp0"

set "OUT=alumni-website-hostinger.zip"
set "STAGE=_deploy_stage"

echo.
echo === Packaging Sainik Military School Alumni site ===
echo.

REM --- Clean previous output ---
if exist "%STAGE%" rmdir /s /q "%STAGE%"
if exist "%OUT%" del /q "%OUT%"
mkdir "%STAGE%"

REM --- Copy the files the live site needs ---
echo Copying pages...
copy /y "*.html" "%STAGE%\" >nul

echo Copying scripts...
xcopy /e /i /y "js" "%STAGE%\js\" >nul

echo Copying assets...
xcopy /e /i /y "assets" "%STAGE%\assets\" >nul

echo Copying server config...
copy /y ".htaccess" "%STAGE%\" >nul

REM --- Create the zip (contents at the zip ROOT) ---
echo Creating %OUT% ...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Compress-Archive -Path '%STAGE%\*' -DestinationPath '%OUT%' -Force"

REM --- Clean up the staging folder ---
rmdir /s /q "%STAGE%"

echo.
if exist "%OUT%" (
  echo SUCCESS: created %OUT%
  echo Upload it to public_html in Hostinger and click "Extract".
) else (
  echo ERROR: zip was not created. Check the messages above.
)
echo.
pause
