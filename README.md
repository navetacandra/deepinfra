# `@navetacandra/deepinfra` Documentation

## Introduction

`@navetacandra/deepinfra` is a Node.js package that provides a DeepInfra API consumer with no APIKEY needed. This package is designed to be lightweight and does not use any additional dependencies.

## Installation

To install the package, use npm:

```bash
npm install @navetacandra/deepinfra
```

## Usage
### Import the package
```js
const { Conversation } = require('@navetacandra/deepinfra');
```
### Create an instance of the `Conversation` class and initialize it
```js
const conversation = new Conversation({ 
    history: [], // load conversation history
    stream: false, // if true, returns a stream of the response
    rewritedTo: '' // redirected URL to the DeepInfra API
});
await conversation.init(); // initialize the conversation
```

### Set used model
```js
console.log(conversation.models);
conversation.setModel('meta-llama/Meta-Llama-3.1-70B-Instruct');
```

### Create completion
```js
// asynchronously
console.log(await conversation.completion('Hello, how are you?'));

// or stream
conversation.on('chat', chat => console.log(chat));
conversation.on('completion', response => process.stdout.write(response));
conversation.completion('Hello, how are you?');
```
### Registered events
```js
conversation.on('chat', chat => console.log(chat)); // on new chat pushed
conversation.on('completion', response => process.stdout.write(response)); // on completion stream response
conversation.on('error', error => console.error(error)); // on error created
```

## Examples
See the [usage section](#usage) for detailed examples on how to use this package, or see the [examples](https://github.com/navetacandra/deepinfra/tree/master/examples) folder in the repository.

## No Dependencies
This package is designed to be lightweight and does not rely on any additional dependencies.
