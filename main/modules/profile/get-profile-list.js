import * as Promise from 'bluebird';
import schema from '../utils/jsonschema';
import getProfileData from './profile-data';
export const getProfileList = {
    'id': '/getProfileList',
    'type': 'array',
    'items': {
        '$ref': '/getProfileData'
    },
    'uniqueItems': true,
    'minItems': 1
};
const execute = Promise.coroutine(function* (data, cb) {
    const v = new schema.Validator();
    v.addSchema(getProfileData, '/getProfileData');
    v.validate(data, getProfileList, { throwError: true });
    const pool = data.map((profile) => {
        return getProfileData.execute(profile).then((profileData) => cb(null, profileData));
    });
    yield Promise.all(pool);
    return { done: true };
});
export default { execute, name: 'getProfileList', hasStream: true };
//# sourceMappingURL=get-profile-list.js.map