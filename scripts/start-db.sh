#!/bin/bash
DB_DIR="/Users/varunyr/hotel/db"
LOG_FILE="$DB_DIR/mongodb.log"

echo "Checking if MongoDB is already running..."
if mongosh --eval "db.runCommand({ping: 1})" --quiet > /dev/null 2>&1; then
    echo "MongoDB is already running."
else
    echo "Starting MongoDB in Replica Set mode (macOS background job)..."
    mongod --replSet rs0 --dbpath "$DB_DIR" --port 27017 --bind_ip 127.0.0.1 > "$LOG_FILE" 2>&1 &
    sleep 3
fi

echo "Initiating Replica Set if needed..."
# Check if replica set is initiated, otherwise initiate it
rs_status=$(mongosh --port 27017 --eval "rs.status().ok" --quiet 2>/dev/null)
if [ "$rs_status" != "1" ]; then
    echo "Initializing replica set..."
    mongosh --port 27017 --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})"
    sleep 2
else
    echo "Replica set already initialized."
fi
