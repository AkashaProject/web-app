import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import getHistory from './history';
import Route from 'react-router-dom/Route';
import { ConnectedRouter } from 'react-router-redux';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import './styles/ant-icons/iconfont.css';
import ConnectedIntlProvider from './connected-intl-provider';
import rootSaga from './local-flux/sagas';
import configureStore from './local-flux/store/configureStore';
import sagaMiddleware from './local-flux/store/sagaMiddleware';
import { AppContainer } from './containers';
import './styles/core.scss';
import './styles/ant-vars/extract-default-theme.less'

export const bootstrap = (web3Enabled = false, vault = false) => {
    const history = getHistory();
    const store = configureStore();
    sagaMiddleware.run(rootSaga);
    render(
        <Provider store={store}>
            <ConnectedIntlProvider>
                <ConnectedRouter history={history}>
                    <Route render={ (props) => <AppContainer unlocked={vault} web3={web3Enabled} {...props} />}/>
                </ConnectedRouter>
            </ConnectedIntlProvider>
        </Provider>,
        document.getElementById('root')
    );
};

