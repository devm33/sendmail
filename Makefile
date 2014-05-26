# Makefile to control sendmail application
help:
	@echo "up     to start the app"
	@echo "down   to stop the app"
	@echo "build  compile sccs and lint js"

OS = Windows # ie Cygwin
# OS = Linux_or_OSX

ifeq ($(OS),Windows)
	KIA = taskkill \/F \/IM $(1).exe
else
	KIA = killall -SIGINT $(1)
endif

up:
	redis-server ./config/redis.conf &
	node server.js &
down:
	$(call KIA,node)
	redis-cli shutdown
build:
	gulp