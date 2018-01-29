import * as Promise from 'bluebird';
import contracts from '../../contracts/index';
import { profileAddress } from './helpers';
import schema from '../utils/jsonschema';
import { getFollowersCount } from './followers-count';
const execute = Promise.coroutine(function* (data) {
    const v = new schema.Validator();
    v.validate(data, getFollowersCount, { throwError: true });
    const address = yield profileAddress(data);
    const count = yield contracts.instance.Feed.totalFollowing(address);
    return { count: count.toString(10), akashaId: data.akashaId };
});
export default { execute, name: 'getFollowingCount' };
//# sourceMappingURL=following-count.js.map