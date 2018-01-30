import * as Promise from 'bluebird';
import contracts from '../../contracts/index';
import schema from '../utils/jsonschema';
import { profileAddress } from '../profile/helpers';
import { web3Api } from '../../services';
export const getVoteOf = {
    'id': '/getVoteOf',
    'type': 'array',
    'items': {
        'type': 'object',
        'properties': {
            'entryId': { 'type': 'string' },
            'akashaId': { 'type': 'string' },
            'ethAddress': { 'type': 'string', 'format': 'address' }
        },
        'required': ['entryId']
    },
    'uniqueItems': true,
    'minItems': 1
};
const execute = Promise.coroutine(function* (data) {
    const v = new schema.Validator();
    v.validate(data, getVoteOf, { throwError: true });
    const requests = data.map((req) => {
        return profileAddress(req).then((ethAddress) => {
            return Promise.all([
                contracts.instance.Votes.voteOf(ethAddress, req.entryId),
                contracts.instance.Votes.karmaOf(ethAddress, req.entryId)
            ]);
        }).spread((vote, karma) => {
            return Object.assign({}, req, { vote: vote.toString(), essence: (web3Api.instance.fromWei(karma[0])).toFormat(10), claimed: karma[1] });
        });
    });
    const collection = yield Promise.all(requests);
    return { collection };
});
export default { execute, name: 'getVoteOf' };
//# sourceMappingURL=get-vote-of.js.map