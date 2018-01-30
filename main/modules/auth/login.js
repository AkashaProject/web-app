import * as Promise from 'bluebird';
import Auth from './Auth';
import schema from '../utils/jsonschema';
const login = {
    'id': '/login',
    'type': 'object',
    'properties': {
        'ethAddress': { 'type': 'any', 'format': 'address' },
        'rememberTime': { 'type': 'number' }
    },
    'required': ['ethAddress']
};
const execute = Promise.coroutine(function* (data) {
    const v = new schema.Validator();
    v.validate(data, login, { throwError: true });
    return Auth.login(data.ethAddress, data.rememberTime);
});
export default { execute, name: 'login' };
//# sourceMappingURL=login.js.map