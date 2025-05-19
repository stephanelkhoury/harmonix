on run argv
  set theTitle to item 1 of argv
  set theDir to item 2 of argv
  set theCmd to item 3 of argv
  
  tell application "Terminal"
    do script "cd \"" & theDir & "\" && clear && echo -e \"\\033[1;34m===== " & theTitle & " =====\\033[0m\\n\\n\" && " & theCmd & " || (echo -e \"\\033[0;31mService failed to start!\\033[0m\" && read -p \"Press Enter to close...\")"
    set custom title of front window to theTitle
    set background color of front window to {0, 0, 0, 0}
    set normal text color of front window to {65535, 65535, 65535}
  end tell
end run
