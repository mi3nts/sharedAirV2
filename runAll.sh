kill $(pgrep -f 'api_main.py')
sleep 5
echo "Starting uvicorn python server..."
uvicorn query_scripts.api_main:app --reload
sleep 5
ws_pid=$(lsof -ti :8765)
if [ -n "$ws_pid" ]; then
    echo "Killing mqttWebsocket.py (PID: $ws_pid)"
    kill -9 $ws_pid
else
    echo "No process found on port 8765 (mqttWebsocket.py)"
fi
npm run serve