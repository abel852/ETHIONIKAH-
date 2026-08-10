@echo off
echo Clearing Next.js cache...
if exist .next (
    rd /s /q .next
    echo Cache cleared.
) else (
    echo No cache found.
)
echo.
echo Please restart your dev server now with: npm run dev
pause
