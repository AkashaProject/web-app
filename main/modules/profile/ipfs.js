import IpfsConnector from '@akashaproject/ipfs-js-connector';
import { profiles } from '../models/records';
import { isEmpty } from 'ramda';
import * as Promise from 'bluebird';
import { Buffer } from 'safe-buffer';
export const ProfileSchema = {
    AVATAR: 'avatar',
    LINKS: 'links',
    ABOUT: 'about',
    BACKGROUND_IMAGE: 'backgroundImage'
};
export const create = Promise.coroutine(function* (data) {
    let saved, tmp, targetHash, keys, pool;
    let i = 0;
    const simpleLinks = [ProfileSchema.AVATAR, ProfileSchema.ABOUT, ProfileSchema.LINKS];
    const root = yield IpfsConnector.getInstance().api.add({ firstName: data.firstName, lastName: data.lastName });
    console.log('root', root);
    targetHash = root.hash;
    while (i < simpleLinks.length) {
        if (!isEmpty(data[simpleLinks[i]]) && data[simpleLinks[i]]) {
            console.log('adding avatar');
            tmp = yield IpfsConnector.getInstance()
                .api
                .add((simpleLinks[i] === ProfileSchema.AVATAR) ?
                Buffer.from(data[simpleLinks[i]]) : data[simpleLinks[i]], simpleLinks[i] === ProfileSchema.AVATAR);
            console.log('tmp', tmp);
            saved = yield IpfsConnector.getInstance()
                .api
                .addLink({ name: simpleLinks[i], size: tmp.size, hash: tmp.hash }, targetHash);
            targetHash = saved.multihash;
        }
        i++;
    }
    if (data.backgroundImage) {
        keys = Object.keys(data.backgroundImage).sort();
        pool = keys.map((media) => {
            return IpfsConnector.getInstance()
                .api
                .addFile(data.backgroundImage[media].src);
        });
        tmp = yield Promise.all(pool).then((returned) => {
            const constructed = {};
            returned.forEach((v, i) => {
                const dim = keys[i];
                constructed[dim] = {};
                constructed[dim]['width'] = data.backgroundImage[dim].width;
                constructed[dim]['height'] = data.backgroundImage[dim].height;
                constructed[dim]['src'] = v.hash;
            });
            return IpfsConnector.getInstance().api.add(constructed);
        });
        saved = yield IpfsConnector.getInstance().api.addLink({
            name: 'backgroundImage',
            size: tmp.size,
            hash: tmp.hash
        }, targetHash);
        targetHash = saved.multihash;
    }
    saved = null;
    tmp = null;
    keys = null;
    pool = null;
    return targetHash;
});
export const getShortProfile = Promise.coroutine(function* (hash) {
    if (profiles.getShort(hash)) {
        return Promise.resolve(profiles.getShort(hash));
    }
    let avatarData;
    const avatarPath = { [ProfileSchema.AVATAR]: '' };
    console.log(hash, 'hash');
    const profileBase = yield IpfsConnector.getInstance().api.get(hash);
    console.log(profileBase, 'profileBase');
    const avatar = yield IpfsConnector.getInstance().api.findLinks(hash, [ProfileSchema.AVATAR]);
    console.log(avatar, 'avatar');
    if (avatar.length) {
        avatarPath[ProfileSchema.AVATAR] = avatar[0].multihash;
    }
    avatarData = null;
    const fetched = Object.assign({}, profileBase, avatarPath);
    console.log('fetched', fetched);
    profiles.setShort(hash, fetched);
    return fetched;
});
export const resolveProfile = Promise.coroutine(function* (hash) {
    if (profiles.getFull(hash)) {
        return Promise.resolve(profiles.getFull(hash));
    }
    let constructed = {
        [ProfileSchema.LINKS]: [],
        [ProfileSchema.ABOUT]: '',
        [ProfileSchema.BACKGROUND_IMAGE]: ''
    };
    const shortProfile = yield getShortProfile(hash);
    const pool = yield IpfsConnector.getInstance()
        .api.findLinks(hash, [ProfileSchema.LINKS, ProfileSchema.ABOUT, ProfileSchema.BACKGROUND_IMAGE]);
    for (let i = 0; i < pool.length; i++) {
        constructed[pool[i].name] = yield IpfsConnector.getInstance().api.get(pool[i].multihash);
    }
    const returned = Object.assign({}, shortProfile, constructed);
    profiles.setFull(hash, returned);
    return returned;
});
//# sourceMappingURL=ipfs.js.map