kill $(lsof -t -i:8080)
sleep 5
kill $(lsof -t -i:8081)
sleep 5
kill $(pgrep -f 'api_main.py')
