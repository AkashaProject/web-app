import ModuleEmitter from '../event/ModuleEmitter';
import comments from './comments/index';

class CommentsIPC extends ModuleEmitter {

    constructor() {
        super();
        this.MODULE_NAME = 'comments';
        this.DEFAULT_MANAGED = ['comment'];
    }

    public initListeners() {
        this._initMethods(comments);
        this._manager();
    }
}

export default CommentsIPC;
