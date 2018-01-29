import * as Promise from 'bluebird';
import contracts from '../../contracts/index';
import schema from '../utils/jsonschema';
import resolve from '../registry/resolve-ethaddress';
const votesIterator = {
    'id': '/tagIterator',
    'type': 'object',
    'properties': {
        'limit': { 'type': 'number' },
        'toBlock': { 'type': 'number' },
        'lastIndex': { 'type': 'number' },
        'entryId': { 'type': 'string' },
        'ethAddress': { 'type': 'string', 'format': 'address' },
        'akashaId': { 'type': 'string' },
        'reversed': { 'type': 'boolean' }
    },
    'required': ['toBlock']
};
const execute = Promise.coroutine(function* (data) {
    const v = new schema.Validator();
    v.validate(data, votesIterator, { throwError: true });
    const collection = [];
    const maxResults = data.limit || 5;
    const filter = { target: data.entryId || data.commentId, voteType: data.entryId ? 0 : 1 };
    const fetched = yield contracts.fromEvent(contracts.instance.Votes.Vote, filter, data.toBlock, maxResults, { lastIndex: data.lastIndex, reversed: data.reversed || false });
    for (let event of fetched.results) {
        const weight = (event.args.weight).toString(10);
        const author = yield resolve.execute({ ethAddress: event.args.voter });
        collection.push(Object.assign({ weight: event.args.negative ? '-' + weight : weight }, author));
        if (collection.length === maxResults) {
            break;
        }
    }
    return { collection: collection, lastBlock: fetched.fromBlock, lastIndex: fetched.lastIndex };
});
export default { execute, name: 'votesIterator' };
//# sourceMappingURL=votes-iterator.js.map