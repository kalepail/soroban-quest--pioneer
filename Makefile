default: build

all: build test

test: build
	cargo hack --feature-powerset test

build: 
	cargo hack build --target wasm32-unknown-unknown --release

watch:
	cargo watch --clear --watch-when-idle --shell '$(MAKE)'

fmt:
	cargo fmt --all

clean:
	cargo clean
