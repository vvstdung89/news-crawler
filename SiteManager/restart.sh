
cat run.pid | xargs pkill -P
touch main.log
cp main.log main.log.backup
echo "============ NEW RUN =============="  > main.log
