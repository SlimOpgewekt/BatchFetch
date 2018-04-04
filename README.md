# BatchFetch
Create batches of cancelable requests and resolve them in one go.

[![Build Status](https://travis-ci.org/SlimOpgewekt/BatchFetch.svg?branch=master)](https://travis-ci.org/SlimOpgewekt/BatchFetch)

## Requirements ##
Since this module uses async/await, Node.js v8.x or higher is required.

## Getting started ##
### Install the library. ###
```ES8
    npm i @slimopgewekt/batchfetch
```
or
```ES8
    yarn add @slimopgewekt/batchfetch
```

### Require the library. ###
```ES8
    const BatchFetch = require('@slimopgewekt/batchfetch');
```

## How to use it ##

### Create a new batch. ###
```ES8
    const createBatch = () => {
        const requests = [];
        
        for(let i = 0; i < 50; i++) {
            requests.push({url: `https://jsonplaceholder.typicode.com/posts/${i}`});
        }
        
        requests.push(
            {
                url: 'https://jsonplaceholder.typicode.com/posts',
                options: {
                    method: 'POST',
                    data: {
                        userId: 1,
                        postId: 1,
                        title: 'So... About the avengers',
                        body: 'There are a lot of them...'
                    }
                }
            }
        );
        
        return BatchFetch.createBatch(requests);
    };
```

### Starting a batch ###
```ES8
    async (batch, singleResultCallback) => {
        return await batch.start(singleResultCallback);
    };
```
`singleResultCallback` is called every time a single request is finished, with its data.  
The results of all requests are return in a single array by batch.start, hence the `await` and `return`.

### Cancelling a batch ###
To cancel the batch, call `batch.cancel();`.  
It'll cancel all the ongoing requests, `batch.start` wont return anything, nor will the single result callbacks fire.
