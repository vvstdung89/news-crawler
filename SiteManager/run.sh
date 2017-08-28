cat run.pid | xargs kill -9
touch main.log
cp main.log main.log.backup
echo "============ NEW RUN =============="  > main.log
APP_NAME=$APP_NAME node cluster.js $SERVICE_NAME $NODE_ENV >> main.log 2>&1 &
echo $! > run.pid

