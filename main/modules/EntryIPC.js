import ModuleEmitter from '../event/ModuleEmitter';
import entry from './entry/index';
class EntryIPC extends ModuleEmitter {
    constructor() {
        super();
        this.MODULE_NAME = 'entry';
        this.DEFAULT_MANAGED = ['getScore', 'getEntry', 'getVoteOf', 'getVoteRatio', 'getVoteEndPeriod'];
    }
    initListeners(webContents) {
        this.webContents = webContents;
        this._initMethods(entry);
        this._manager();
    }
}
export default EntryIPC;
//# sourceMappingURL=EntryIPC.js.map