# Makefile to control sendmail application
help:
	@echo "up         start the app"
	@echo "down       stop the app"
	@echo "reup       stop and start the app"
	@echo ""
	@echo "redis      restart just redis"
	@echo "up_redis   start the app"
	@echo "down_redis stop the app"
	@echo ""
	@echo "node       restart just node"
	@echo "up_node    start just node"
	@echo "down_node  stop just node"
	@echo ""
	@echo "build      compile scss and lint js"
	@echo "watch      compile scss and js on change"
	@echo ""
	@echo "dev        start redis, node, and watch"
	@echo "nodev      restart node and watching"
	@echo ""
	@echo "Note: all commands that stop node will also stop the watch process"
	@echo "since node runs it. Thus there is no need for a downdev command since"
	@echo "down will shut everything down."

OS = Windows
# OS = Linux_or_OSX

ifeq ($(OS),Windows)
	KIA = taskkill \/F \/IM $(1).exe
else
	KIA = killall -SIGINT $(1)
endif

up_node:
	node server.js &
down_node:
	$(call KIA,node)

up_redis:
	redis-server ./config/redis.conf &
down_redis:
	redis-cli shutdown

up: up_redis up_node
down: down_node down_redis
reup: down up

node: down_node up_node
redis: down_redis up_redis

build:
	gulp build
watch:
	gulp watch &

dev: up watch
redev: node watch
