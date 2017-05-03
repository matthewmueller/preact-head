client:
	@./node_modules/.bin/budo example/client.js --live -- -t [ babelify  ]
.PHONY: client

server:
	@./node_modules/.bin/babel-node example/server.js
.PHONY: server