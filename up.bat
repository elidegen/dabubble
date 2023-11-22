git pull || exit
git add . || exit
git commit -m "%*" || exit
git push || exit