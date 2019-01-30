build:
	@./misc/build

install:
	@yarn

test:
	@./node_modules/.bin/mocha test/browser.js test/server.js

clean:
	@rm -rf node_modules
	@rm -f browser.js
	@rm -f server.js

committed:
	@git diff --quiet || (echo 'git is dirty'; exit 1)

precommit: clean install test build

prepublish: committed test

.PHONY: build test