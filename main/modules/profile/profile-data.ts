import * as Promise from 'bluebird';
import contracts from '../../contracts/index';
import { getShortProfile, resolveProfile } from './ipfs';
import { BASE_URL, FULL_WAIT_TIME, generalSettings, SHORT_WAIT_TIME } from '../../config/settings';
import followingCount from './following-count';
import followersCount from './followers-count';
import { profileAddress } from './helpers';
import { encodeHash } from '../ipfs/helpers';
import { unpad } from 'ethereumjs-util';
import entryCountProfile from '../entry/entry-count-profile';
import resolveEthAddress from '../registry/resolve-ethaddress';
import schema from '../utils/jsonschema';
import { web3Api } from '../../services';
import { dbs } from '../search/indexes';

export const getProfileData = {
    'id': '/getProfileData',
    'type': 'object',
    'properties': {
        'akashaId': { 'type': 'string' },
        'ethAddress': { 'type': 'string', 'format': 'address' },
        'short': { 'type': 'boolean' },
        'full': { 'type': 'boolean' },
        'resolveImages': { 'type': 'boolean' }
    }
};

/**
 * Get profile data for an akasha profile address
 * @type {Function}
 */
const execute: any = Promise.coroutine(function* (data: any, cb) {
    const v = new schema.Validator();
    v.validate(data, getProfileData, { throwError: true });

    let profile, akashaId;
    const ethAddress = yield profileAddress(data);
    if (data.ethAddress) {
        const resolved = yield resolveEthAddress.execute({ ethAddress: data.ethAddress });
        akashaId = resolved.akashaId;
    }
    akashaId = akashaId || data.akashaId;
    const akashaIdHash = yield contracts.instance.ProfileRegistrar.hash(akashaId || '');
    const [, , donationsEnabled,
        fn, digestSize, hash] = yield contracts.instance.ProfileResolver.resolve(akashaIdHash);
    const foCount = yield followingCount.execute({ ethAddress });
    const fwCount = yield followersCount.execute({ ethAddress });
    const entriesCount = yield entryCountProfile.execute({ ethAddress });
    const commentsCount = yield contracts.instance.Comments.totalCommentsOf(ethAddress);
    const [karma, essence] = yield contracts.instance.Essence.getCollected(ethAddress);
    const partialProfile = {
        akashaId: akashaId,
        ethAddress: ethAddress,
        donationsEnabled: donationsEnabled,
        followingCount: foCount.count,
        followersCount: fwCount.count,
        entriesCount: entriesCount.count,
        commentsCount: commentsCount.toString(10),
        [BASE_URL]: generalSettings.get(BASE_URL),
        karma: (web3Api.instance.fromWei(karma, 'ether')).toFormat(5),
        essence: (web3Api.instance.fromWei(essence, 'ether')).toFormat(5)
    };
    cb('', partialProfile);
    if (!!unpad(hash)) {
        const ipfsHash = encodeHash(fn, digestSize, hash);
        if (data.short) {
            profile = { ipfsHash };
        } else {
            profile = (data.full) ?
                yield resolveProfile(ipfsHash, data.resolveImages)
                    .timeout(FULL_WAIT_TIME)
                    .then((d) => d).catch((e) => null)
                :
                yield getShortProfile(ipfsHash, data.resolveImages)
                    .timeout(SHORT_WAIT_TIME)
                    .then((d) => d).catch((e) => null);
        }

        dbs.profiles.searchIndex.concurrentAdd({}, [{
            akashaId: akashaId,
            id: ethAddress
        }], (err) => { if (err) { console.warn('error storing PROFILE index', err); } });
    }

    return Object.assign({}, partialProfile, profile);

});

const exported = { execute, name: 'getProfileData', hasStream: true };

export default exported;
