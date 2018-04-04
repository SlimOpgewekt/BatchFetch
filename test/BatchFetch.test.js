const BatchFetch = require('./../BatchFetch');
const superagent = require('superagent');

describe('BatchFetch', () => {

    beforeEach(() => {
        BatchFetch.batchs.length = 0;
    });

    describe('Static', () => {

        describe('Properties', () => {

            test('Has array "batchs"', () => {
                expect(BatchFetch).toHaveProperty('batchs', []);
            });

            test('Has function createBatch', () => {
                expect(BatchFetch).toHaveProperty('createBatch');
                expect(BatchFetch.createBatch).toBeInstanceOf(Function);
            });

            test('Has function createId', () => {
                expect(BatchFetch).toHaveProperty('createId');
                expect(BatchFetch.createId).toBeInstanceOf(Function);
            });

            test('Has function cancelId', () => {
                expect(BatchFetch).toHaveProperty('cancelId');
                expect(BatchFetch.cancelId).toBeInstanceOf(Function);
            });

            test('Has function createRequest', () => {
                expect(BatchFetch).toHaveProperty('createRequest');
                expect(BatchFetch.createRequest).toBeInstanceOf(Function);
            });

            test('Has function removeBatch', () => {
                expect(BatchFetch).toHaveProperty('removeBatch');
                expect(BatchFetch.removeBatch).toBeInstanceOf(Function);
            });

        });

        describe('.createBatch', () => {

            test('Should add a new "BatchFatch" to the this.batchs array', () => {
                BatchFetch.batchs.length = 0;

                BatchFetch.createBatch([]);

                expect(BatchFetch.batchs.length).toBe(1);
                expect(BatchFetch.batchs[0]).toBeInstanceOf(BatchFetch);
            });

            test('Should create a new "BatchFetch" every time it is called', () => {
                BatchFetch.createBatch([]);
                BatchFetch.createBatch([]);
                BatchFetch.createBatch([]);

                expect(BatchFetch.batchs[0]).not.toBe(BatchFetch.batchs[1]);
                expect(BatchFetch.batchs[1]).not.toBe(BatchFetch.batchs[2]);
                expect(BatchFetch.batchs[2]).not.toBe(BatchFetch.batchs[0]);
            });
        });

        describe('.createId', () => {
            test('Should return a string', () => {
                const result = BatchFetch.createId();

                expect(typeof result).toBe('string');
            });

            test('Should be 50 characters', () => {
                const result = BatchFetch.createId();

                expect(result.length).toBe(50);
            });

            test('Should create new ids when called', () => {
                const result1 = BatchFetch.createId();
                const result2 = BatchFetch.createId();

                expect(result1).not.toEqual(result2);
            });
        });

        describe('.cancelId', () => {
            test('Should do nothing when the batch with the given id is not found', () => {
                const batch = BatchFetch.createBatch([]);

                batch.cancel = jest.fn();

                const fakeId = 'fakeId';

                BatchFetch.cancelId(fakeId);

                expect(batch.cancel).toHaveBeenCalledTimes(0);
            });

            test('Should call cancel on the batch with the given id', () => {
                const batch = BatchFetch.createBatch([]);

                batch.cancel = jest.fn();

                BatchFetch.cancelId(batch.id);

                expect(batch.cancel).toHaveBeenCalledTimes(1);
            });

            test('Should only call call cancel on the batch with the given id', () => {
                const batch1 = BatchFetch.createBatch([]);
                const batch2 = BatchFetch.createBatch([]);
                const batch3 = BatchFetch.createBatch([]);
                const batch4 = BatchFetch.createBatch([]);

                batch1.cancel = jest.fn();
                batch2.cancel = jest.fn();
                batch3.cancel = jest.fn();
                batch4.cancel = jest.fn();

                BatchFetch.cancelId(batch3.id);

                expect(batch1.cancel).toHaveBeenCalledTimes(0);
                expect(batch2.cancel).toHaveBeenCalledTimes(0);
                expect(batch3.cancel).toHaveBeenCalledTimes(1);
                expect(batch4.cancel).toHaveBeenCalledTimes(0);
            });
        });

        describe('.createRequest', () => {
            let param = {};

            beforeEach(() => {
                param = {
                    url: 'https://jsonplaceholder.typicode.com/posts',
                    options: {

                        method: 'POST',
                        data: {
                            foo: 'bar',
                            baz: true,
                            qux: 10
                        }
                    }
                };
            });

            test('Return value should be instance of SuperAgent', () => {
                const result = BatchFetch.createRequest(param);

                expect(result).toBeInstanceOf(superagent.Request);
            });

            test('Should be GET when options.method === GET', () => {
                param.options.method = 'GET';

                const result = BatchFetch.createRequest(param);

                expect(result).toHaveProperty('method', 'GET')
            });

            test('Should be Post when options.method === post', () => {
                const result = BatchFetch.createRequest(param);

                expect(result).toHaveProperty('method', 'POST')
            });

            test('Should send credentials', () => {
                const result = BatchFetch.createRequest(param);

                expect(result).toHaveProperty('_withCredentials', true);
            });

            test('Should set "Authorization" header with given token when a token is present', () => {
                const token = 'My special auth token';
                param.options.token = token;

                const result = BatchFetch.createRequest(param);

                expect(result.header).toHaveProperty('Authorization', `Bearer ${token}`)
            });

        });

        describe('.removeBatch', () => {
            test('Should remove the current batch from the batchs list', () => {
                const batch1 = BatchFetch.createBatch([]);
                const batch2 = BatchFetch.createBatch([]);

                expect(BatchFetch.batchs.length).toBe(2);

                BatchFetch.removeBatch(batch1);

                expect(BatchFetch.batchs.length).toBe(1);
                expect(BatchFetch.batchs[0]).toBe(batch2);
            });
        });
    });

    describe('Instance', () => {

        let batch = null;

        beforeEach(() => {
            batch = new BatchFetch();
        });

        describe('Properties', () => {

            test('Has property req', () => {
                expect(batch).toHaveProperty('req');
                expect(batch.req).toBeInstanceOf(Array);
            });

            test('Has unique property id', () => {
                const batch1 = new BatchFetch();
                const batch2 = new BatchFetch();

                expect(batch).toHaveProperty('id');
                expect(batch1.id === batch2.id).toBeFalsy();
            });

            test('Has property requests', () => {
                expect(batch).toHaveProperty('requests', []);
            });

            test('Has property results', () => {
                expect(batch).toHaveProperty('results', []);
            });

            test('Has property abort', () => {
                expect(batch).toHaveProperty('abort', false);
            });

            test('Has property cbs', () => {
                expect(batch).toHaveProperty('cbs');
            });

        });

        describe('.cbs', () => {

            test('Should have callback for error 401', () => {
                expect(batch.cbs).toHaveProperty('e401');
                expect(batch.cbs.e401).toBeInstanceOf(Function);
            });

            test('If no function is given, expect e401 to do nothing', () => {
                expect(batch.cbs.e401()).toBeUndefined();
            });

        });

        describe('.add', () => {
            test('Should add a new req to the batch', () => {
                expect(batch.req.length).toBe(1);

                const url = 'bitbucket.org';
                batch.add({url});

                expect(batch.req.length).toBe(2);
                expect(batch.req[1].url).toBe(url);
            });
        });

        describe('.start', () => {
            beforeEach(() => {
                const url = 'https://jsonplaceholder.typicode.com/posts';

                batch.req.length = 0;

                batch.add({url: `${url}/1`});
                batch.add({url: `${url}/2`});
                batch.add({url: `${url}/3`});
                batch.add({url: `${url}/4`});
            });

            test('Should call BatchFetch.createRequest for each request in the batch', async () => {
                // Setup
                const createRequest = BatchFetch.createRequest;
                BatchFetch.createRequest = jest.fn(createRequest);

                // Test
                const req = batch.start();
                batch.cancel();
                await req;
                expect(BatchFetch.createRequest).toHaveBeenCalledTimes(4);

                // Reset
                BatchFetch.createRequest = createRequest;
            });

            test('Should return nothing when it is aborted', async () => {
                const request = batch.start();

                batch.cancel();

                const result = await request;

                expect(batch.abort).toBeTruthy();
                expect(result).toBeUndefined();
            });

            test('Should return an array with responses when done', async () => {
                const results = await batch.start();

                expect(results).toBeInstanceOf(Array);
                expect(results.length).toBe(4);
            });

            test('Should call "handleIncoming" every time a requests is done', async () => {
                const handle = jest.fn();

                await batch.start(handle);

                expect(handle).toHaveBeenCalledTimes(4);
            });

        });

        describe('.cancel', () => {

            beforeEach(() => {
                batch.requests = [
                    {
                        abort: jest.fn()
                    },
                    {
                        abort: jest.fn()
                    },
                    {
                        abort: jest.fn()
                    },
                    {
                        abort: jest.fn()
                    },
                    {
                        abort: jest.fn()
                    }
                ]
            });

            test('Should call BatchFetch.removeBatch', () => {
                // Setup
                const removebatch = BatchFetch.removeBatch;
                BatchFetch.removeBatch = jest.fn();

                //Test
                batch.cancel();
                expect(BatchFetch.removeBatch).toHaveBeenCalledTimes(1);

                // Reset
                BatchFetch.removeBatch = removebatch;
            });

            test('Should call ".abort" on every request in the batch', () => {

                batch.cancel();

                for (let i = 0; i < batch.requests.length; i++)
                    expect(batch.requests[i].abort).toHaveBeenCalledTimes(1);
            });

            test('Should set property "abort" to true', () => {
                batch.cancel();

                expect(batch.abort).toBeTruthy();
            });

        });

        describe('.handleIncoming', () => {

            let res = {};

            beforeEach(() => {
                res.status = 200;
                res.body = {foo: 'bar'}
            });

            describe('case 200', () => {
                test('Should return the response body', async () => {
                    const result = await batch.handleIncoming(res);

                    expect(result).toEqual(res.body);
                });

                test('Should add the response to the results array', async () => {
                    expect(batch.results.length).toBe(0);

                    const result = await batch.handleIncoming(res);

                    expect(batch.results.length).toBe(1);
                    expect(batch.results[0]).toBe(result);
                });
            });

            describe('case 401', () => {
                beforeEach(() => {
                    res.status = 401;
                });

                test('Should set this.abort to true', async () => {
                    await batch.handleIncoming(res);

                    expect(batch).toHaveProperty('abort', true);
                });

                test('Should call cbs.e401', async () => {
                    batch.cbs.e401 = jest.fn();

                    await batch.handleIncoming(res);

                    expect(batch.cbs.e401).toHaveBeenCalledTimes(1);
                    expect(batch.cbs.e401).toHaveBeenCalledWith(res);
                });

                test('Should return nothing', async () => {
                    const result = await batch.handleIncoming(res);

                    expect(result).toBeUndefined();
                })
            });

            describe('case default', () => {
                beforeEach(() => {
                    res.status = 'oops';
                    res.text = 'Something went wrong';
                });

                test('Should return an object with property "error"', async () => {
                    const result = await batch.handleIncoming(res);

                    expect(result).toHaveProperty('error', res.text);
                });

                test('Should push the error object to the results list', async () => {
                    expect(batch.results.length).toBe(0);

                    const result = await batch.handleIncoming(res);

                    expect(batch.results.length).toBe(1);
                    expect(batch.results[0]).toBe(result);
                });

            });
        })
    });

});
