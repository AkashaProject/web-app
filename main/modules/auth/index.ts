import generateKey from './generate-key';
import getLocalIdentities from './get-local-identities';
import login from './login';
import logout from './logout';
import requestAeth from './request-aeth';
import regenSession from './regen-session';

const e: any = [generateKey, getLocalIdentities, login, logout, requestAeth, regenSession];
export default e;