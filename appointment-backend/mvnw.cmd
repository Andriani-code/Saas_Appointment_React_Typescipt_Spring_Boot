@ECHO OFF
SETLOCAL

SET "SCRIPT_DIR=%~dp0"
SET "WRAPPER_DIR=%SCRIPT_DIR%.mvn\wrapper"
SET "MAVEN_VERSION=3.9.9"
SET "MAVEN_DIR=%WRAPPER_DIR%\apache-maven-%MAVEN_VERSION%"
SET "MAVEN_CMD=%MAVEN_DIR%\bin\mvn.cmd"
SET "MAVEN_ZIP=%WRAPPER_DIR%\apache-maven-%MAVEN_VERSION%-bin.zip"
SET "DOWNLOAD_URL=https://archive.apache.org/dist/maven/maven-3/%MAVEN_VERSION%/binaries/apache-maven-%MAVEN_VERSION%-bin.zip"

IF EXIST "%MAVEN_CMD%" GOTO RUN

IF NOT EXIST "%WRAPPER_DIR%" MKDIR "%WRAPPER_DIR%"

ECHO Downloading Maven %MAVEN_VERSION%...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%MAVEN_ZIP%'"
IF ERRORLEVEL 1 (
  ECHO Failed to download Maven from %DOWNLOAD_URL%.
  EXIT /B 1
)

ECHO Extracting Maven %MAVEN_VERSION%...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Expand-Archive -LiteralPath '%MAVEN_ZIP%' -DestinationPath '%WRAPPER_DIR%' -Force"
IF ERRORLEVEL 1 (
  ECHO Failed to extract %MAVEN_ZIP%.
  EXIT /B 1
)

IF NOT EXIST "%MAVEN_CMD%" (
  ECHO Maven executable was not found after extraction.
  EXIT /B 1
)

:RUN
"%MAVEN_CMD%" %*
EXIT /B %ERRORLEVEL%
