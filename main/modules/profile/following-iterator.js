import * as Promise from 'bluebird';
import { web3Api } from '../../services';
import contracts from '../../contracts/index';
import { profileAddress } from './helpers';
import schema from '../utils/jsonschema';
import { followersIterator } from './followers-iterator';
import { uniq } from 'ramda';
const execute = Promise.coroutine(function* (data) {
    const v = new schema.Validator();
    v.validate(data, followersIterator, { throwError: true });
    const collection = [];
    const maxResults = data.limit || 5;
    const address = yield profileAddress(data);
    const lastBlock = yield web3Api.instance.eth.getBlockNumberAsync();
    const toBlock = (!data.lastBlock) ? lastBlock : data.lastBlock;
    const fetched = yield contracts.fromEvent(contracts.instance.Feed.Follow, { follower: address }, toBlock, maxResults, { lastIndex: data.lastIndex });
    for (let event of fetched.results) {
        const follows = yield contracts.instance.Feed.follows(address, event.args.followed);
        if (!follows) {
            continue;
        }
        const unFollowed = yield contracts.fromEvent(contracts.instance.Feed.UnFollow, {
            followed: event.args.followed,
            follower: address
        }, lastBlock, 1, { lastIndex: 0 });
        if (unFollowed.results && unFollowed.results.length && unFollowed.results[0].blockNumber > event.blockNumber) {
            continue;
        }
        collection.push({ ethAddress: event.args.followed });
    }
    return {
        collection: uniq(collection),
        lastBlock: fetched.fromBlock,
        lastIndex: fetched.lastIndex,
        akashaId: data.akashaId,
        limit: maxResults
    };
});
export default { execute, name: 'followingIterator' };
//# sourceMappingURL=following-iterator.js.map