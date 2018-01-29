import * as Promise from 'bluebird';
import contracts from '../../contracts/index';
import { getShortProfile, resolveProfile } from './ipfs';
import { BASE_URL, FULL_WAIT_TIME, generalSettings, SHORT_WAIT_TIME } from '../../config/settings';
import followingCount from './following-count';
import followersCount from './followers-count';
import entryCountProfile from '../entry/entry-count-profile';
import subsCount from '../tags/subs-count';
const execute = Promise.coroutine(function* (data) {
    const ipfsHash = yield contracts.instance.profile.getIpfs(data.profile);
    const profile = (data.full) ?
        yield resolveProfile(ipfsHash)
            .timeout(FULL_WAIT_TIME)
            .then((d) => d).catch((e) => null)
        :
            yield getShortProfile(ipfsHash)
                .timeout(SHORT_WAIT_TIME)
                .then((d) => d).catch((e) => null);
    console.log('profile', profile);
    const akashaId = yield contracts.instance.profile.getId(data.profile);
    const foCount = yield followingCount.execute({ akashaId });
    const fwCount = yield followersCount.execute({ akashaId });
    const entriesCount = yield entryCountProfile.execute({ akashaId });
    const subscriptionsCount = yield subsCount.execute({ akashaId });
    return Object.assign({
        akashaId: akashaId,
        followingCount: foCount.count,
        followersCount: fwCount.count,
        entriesCount: entriesCount.count,
        subscriptionsCount: subscriptionsCount.count,
        [BASE_URL]: generalSettings.get(BASE_URL),
        profile: data.profile
    }, profile);
});
export default { execute, name: 'getProfileData' };
//# sourceMappingURL=profile-data.js.map