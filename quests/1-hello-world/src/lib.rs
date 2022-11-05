// When deploying a smart contract to a blockchain, contract size is very
// important consideration. The Rust standard library is very large, so the
// following line will ensure that it is not included in the build.
#![no_std]

// From our Soroban SDK, we import the following macros:
// - contractimpl: exports the public functions defined in the implementation
// - symbol: creates a Symbol with the given string
// - vec: creates a Vec with the given items
// We also import the following types from the SDK:
// - Env: provides access to the environment the contract is executing within
// - Symbol: represents strings up to 10 characters long (a-zA-Z0-0_)
// - Vec: a sequential and indexable growable collection
use soroban_sdk::{contractimpl, symbol, vec, Env, Symbol, Vec};

// Defining a "unit-like" struct in the following manner allows us to easily
// implement the `HelloContract` type (and any required traits) without the need
// to define any of specifics yet.
pub struct HelloContract;

// We use `contractimpl` to export the publicly accessible functions within the
// `impl` block. Meaning those functions will be invocable by other contracts,
// or directly by Stellar transactions, once deployed.
#[contractimpl]
// Contract functions live inside an `impl` (implementation) for the struct we
// defined earlier. Doing so associates those functions and/or methods with the
// `HelloContract` type, and allows them to be called from somewhere else.
// This manner of constructing functions within an `impl` block also allows us
// to organize and collect all the things we can do with an instance of
// `HelloContract` into one place.
impl HelloContract {
    // Our publicly visible function (method) is called `hello`. It takes two
    // arguments:
    // - env: the environment in which the contract is running
    // - to: who we are greeting (in this case a `Symbol`)
    // Our function will return a `Vec` made up of `Symbol` items.
    pub fn hello(env: Env, to: Symbol) -> Vec<Symbol> {
        // We are creating and returning a `Vec` containing two `Symbol` items:
        // ["Hello","friend"] (depends on what is supplied as the `to` argument)
        vec![&env, symbol!("Hello"), to]
    }
}

// This declaration will look for a file named `test.rs` and will insert its
// contents inside a module named `test` under this scope.
mod test;