@echo off
REM -------- Snail LIVE embed (Windows) --------
setlocal

REM 1) Wstrzyknij eventy z JSON do index.html
py embed_events.py --target felieton/wrzesien25/felieton-10-derby-liverpool/index.html
if errorlevel 1 (
  echo [ERR] Embed nie powiodl sie. Sprawdz JSON i markery.
  pause
  exit /b 1
)

REM 2) (opcjonalnie) otworz plik w przegladarce lokalnie
REM start "" "felieton/wrzesien25/felieton-10-derby-liverpool/index.html"

echo [OK] Wstrzyknieto eventy. Zrob commit/push w VSC (Netlify zdeployuje).
pause
