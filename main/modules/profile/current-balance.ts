import * as Promise from 'bluebird';
import { web3Api } from '../../services';
import schema from '../utils/jsonschema';
import contracts from '../../contracts/index';

export const getBalance = {
    'id': '/getBalance',
    'type': 'object',
    'properties': {
        'ethAddress': { 'type': 'string', 'format': 'address' },
        'unit': { 'type': 'string' }
    }
};
/**
 * Get eth balance converted to specified unit
 * @type {Function}
 */
const execute = Promise.coroutine(function* (data: BalanceRequest) {
    const v = new schema.Validator();
    v.validate(data, getBalance, { throwError: true });

    const etherBase = (data.ethAddress) ? data.ethAddress : web3Api.instance.eth.defaultAccount;
    const unit = (data.unit) ? data.unit : 'ether';
    const fromWei = web3Api.instance.fromWei;
    const weiAmount = yield web3Api.instance.eth.getBalanceAsync(etherBase);
    const [free, bonded, cycling] = yield contracts.instance.AETH.getTokenRecords(etherBase);
    const [manaTotal, manaSpent, manaRemaining] = yield contracts.instance.Essence.mana(etherBase);
    const [karma, essence] = yield contracts.instance.Essence.getCollected(etherBase);
    const essenceValue = yield contracts.instance.Essence.aethValueFrom(essence);
    const symbol = 'AETH'; // yield contracts.instance.AETH.symbol();
    const totalAeth = free.plus(bonded).plus(cycling);
    const balance = fromWei(weiAmount, unit);
    return {
        balance: balance.toFormat(5),
        [symbol]: {
            total: (fromWei(totalAeth)).toFormat(7),
            free: (fromWei(free)).toFormat(5),
            bonded: (fromWei(bonded)).toFormat(5),
            cycling: (fromWei(cycling)).toFormat(5),
        },
        mana: {
            total: (fromWei(manaTotal)).toFormat(5),
            spent: (fromWei(manaSpent)).toFormat(5),
            remaining: (fromWei(manaRemaining)).toFormat(5)
        },
        karma: { total: (fromWei(karma)).toFormat(5) },
        essence: {
            total: (fromWei(essence)).toFormat(5),
            aethValue: (fromWei(essenceValue)).toFormat(5)
        }
        , unit, etherBase
    };
});

export default { execute, name: 'getBalance' };
