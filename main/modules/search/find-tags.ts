import * as Promise from 'bluebird';
import { dbs } from './indexes';

const execute = Promise.coroutine(function* (data: { text: string, limit: number }, cb) {
    const collection = [];
    const pageSize = data.limit || 10;
    const options = {
        beginsWith: data.text,
        field: 'tagName',
        threshold: 1,
        limit: pageSize,
        type: 'simple'
    };
    dbs.tags.searchIndex.match(options)
        .on('data', (data) => { collection.push(data); })
        .on('end', () => { cb('', { collection});
    });
    return {};
});

export default { execute, name: 'findTags', hasStream: true };
