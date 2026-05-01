.PHONY: install dev dev-fe dev-be down down-fe down-be build start clean

FE_PORT ?= 5173
BE_PORT ?= 3001

install:
	npm install

dev:
	npm run dev

dev-fe:
	npm run dev:client

dev-be:
	npm run dev:server

down: down-fe down-be

down-fe:
	@PID=$$(lsof -ti tcp:$(FE_PORT) -sTCP:LISTEN); \
	if [ -n "$$PID" ]; then \
		kill $$PID; \
		echo "Stopped frontend on port $(FE_PORT)"; \
	else \
		echo "Frontend is not running on port $(FE_PORT)"; \
	fi

down-be:
	@PID=$$(lsof -ti tcp:$(BE_PORT) -sTCP:LISTEN); \
	if [ -n "$$PID" ]; then \
		kill $$PID; \
		echo "Stopped backend on port $(BE_PORT)"; \
	else \
		echo "Backend is not running on port $(BE_PORT)"; \
	fi

build:
	npm run build

start:
	npm start

clean:
	rm -rf dist
