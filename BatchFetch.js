const agent = require('superagent');

class BatchFetch {

    static createBatch(req, cbs) {
        const batch = new BatchFetch(req, cbs);

        this.batchs.push(batch);

        return batch;
    }

    static createId() {
        return require('crypto').randomBytes(64)
            .toString('hex')
            .slice(0, 50);
    }

    static cancelId(id) {
        const batch = this.batchs.filter(batch => batch.id === id);
        if (batch.length === 0)
            return;

        batch[0].cancel();
    }

    static createRequest({url, options = {method: 'GET'}}) {
        const request = options.method === 'POST' ? agent.post(url) : agent.get(url);

        request.withCredentials();

        if (options.method === 'POST' && options.data) {
            const body = new FormData();
            for (const key in options.data) {
                body.append(key, options.data[key]);
            }
            request.send(body);
        }

        if (options.token)
            request.set('Authorization', `Bearer ${options.token}`);

        return request;
    }

    static removeBatch(batch) {
        this.batchs.splice(this.batchs.indexOf(batch), 1);
    }

    constructor(req = [{url: '', options: {}}], cbs = {e401: () => {}}) {
        this.req = req;
        this.id = BatchFetch.createId();
        this.requests = [];
        this.results = [];
        this.abort = false;
        this.cbs = cbs;
    }

    add(req) {
        this.req.push(req);
    }

    async start(handleIncoming) {
        this.req.forEach(r => this.requests.push(BatchFetch.createRequest(r)));

        for (let i = 0; i < this.requests.length; i++) {
            if (this.abort)
                return;

            try {
                const result = await this.requests[i];

                if (this.abort)
                    return;

                const response = await this.handleIncoming(result);

                if (handleIncoming && typeof handleIncoming === 'function')
                    handleIncoming(response);
            } catch (e) {
                console.log('error in batch request', e);
            }
        }

        return this.abort ? null : this.results;
    }

    cancel() {
        BatchFetch.removeBatch();
        this.requests.forEach(req => req.abort());
        this.abort = true;
    }

    async handleIncoming(res) {
        switch (res.status) {
            case 200: {
                // const result = await res.json();
                this.results.push(res.body);
                return res.body;
            }
            case 401: {
                this.abort = true;
                this.cbs.e401(res);
                // return {error: 'Je bent niet ingelogd'};
                break;
            }
            default: {
                const err = {error: res.text};
                this.results.push(err);
                return err;
            }
        }
    }
}

BatchFetch.batchs = [];

module.exports = BatchFetch;
