import PropTypes from 'prop-types';
import React from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Button, Card } from 'antd';
import { Icon, Terms } from '../';
import { generalMessages, placeholderMessages } from '../../locale-data/messages';

const WebPlaceholder = (props) => {
    const { appState, intl, hideTerms, showTerms, gethErr } = props;
    let metamaskLink = "https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en";
    let ipfsCompanionLink = "https://chrome.google.com/webstore/detail/ipfs-companion/nibjojkomfdiaoajekhjakgkdhaomnch";
    const userAgent = navigator.userAgent;

    const termsShow = (ev) => {
        ev.preventDefault();
        if (showTerms) return showTerms();
        return null;
    }

    if (userAgent.indexOf("Firefox") > -1) {
        metamaskLink = "https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/";
        ipfsCompanionLink = "https://addons.mozilla.org/en-US/firefox/addon/ipfs-companion/";
    }

    const icons = (
      <div className="web-placeholder__icons">
        <a target={"_blank"} href={metamaskLink}>
          <div>
            <div className="web-placeholder__icon-metamask" />
            {intl.formatMessage(placeholderMessages.getExtension)}
          </div>
        </a>
        <div className="web-placeholder__and">
          {intl.formatMessage(generalMessages.and)}
        </div>
        <a target={"_blank"} href={ipfsCompanionLink}>
          <div className="web-placeholder__icon-ipfs" />
          {intl.formatMessage(placeholderMessages.getCompanion)}
        </a>
      </div>
    );

    const noMetamaskCards = (
      <div className="web-placeholder__card-wrap">
        <div className="web-placeholder__card-wrapper">
          <Card className="web-placeholder__card">
            <div className="web-placeholder__card-title">
              {intl.formatMessage(placeholderMessages.tryBrowser)}
            </div>
            <div className="web-placeholder__card-subtitle">
              {intl.formatMessage(placeholderMessages.tryBrowserSubtitle)}
            </div>
            <div className="web-placeholder__card-sec-subtitle">
              {intl.formatMessage(placeholderMessages.tryBrowserSubtitle1)}
            </div>
            {icons}
          </Card>
        </div>
      </div>
    );

    const gethErrCard = (
      <div className="web-placeholder__card-wrap">
        <div className="web-placeholder__card-wrapper">
          <Card className="web-placeholder__card-geth-err">
            <div className="web-placeholder__icon-wrap">
              <div className="web-placeholder__icon-no-extension-helper" />
            </div>
            <div className="web-placeholder__card-title">
              {intl.formatMessage(placeholderMessages.troubleConnecting)}
            </div>
            <div className="web-placeholder__card-subtitle">
              {intl.formatMessage(placeholderMessages.wrongNetwork)}
            </div>
          </Card>
        </div>
      </div>
    );

    return (
      <div className="web-placeholder">
        <div className="web-placeholder__header">
          <div className="web-placeholder__header-left">
            <Icon type="akasha" />
            <div className="web-placeholder__header-left-title">
              {intl.formatMessage(generalMessages.akasha)}
            </div>
          </div>
          <div className="web-placeholder__header-right">
            <a href="https://www.facebook.com/AkashaProject" target="_blank" rel="noopener noreferrer">
              <Icon type="facebook" />
            </a>
            <a href="https://twitter.com/AkashaProject" target="_blank" rel="noopener noreferrer">
              <Icon type="twitter" />
            </a>
            <a href="https://www.reddit.com/r/AkashaProject" target="_blank" rel="noopener noreferrer">
              <Icon type="reddit" />
            </a>
            <a href="https://discord.gg/JqqKasJ" target="_blank" rel="noopener noreferrer">
              <Icon type="discord" />
            </a>
            <a href="https://github.com/AkashaProject" target="_blank" rel="noopener noreferrer">
              <Icon type="github" />
            </a>
          </div>
        </div>
        <div className="web-placeholder__body">
          <div className="web-placeholder__body-title">
            {intl.formatMessage(placeholderMessages.welcome)}
          </div>
          <div className="web-placeholder__body-subtitle">
            {intl.formatMessage(placeholderMessages.welcomeSubtitle)}
          </div>
          {gethErr ? gethErrCard : noMetamaskCards}
        </div>
        <div className="web-placeholder__footer">
          <div className="web-placeholder__subfooter">
            <div className="web-placeholder__subfooter-title">
              {intl.formatMessage(placeholderMessages.akasha)}
            </div>
            <a href={"https://blog.akasha.world"} target="_blank" className="mail">
              {intl.formatMessage(placeholderMessages.blog)}
            </a>
            <a href={"https://github.com/AkashaProject/dapp/releases"} target="_blank" className="mail">
              {intl.formatMessage(placeholderMessages.downloadDesktopApp)}
            </a>
            <a onClick={termsShow} className="mail">
              {intl.formatMessage(placeholderMessages.termsOfService)}
            </a>
          </div>
          <div className="web-placeholder__subfooter">
            <div className="web-placeholder__subfooter-title">
              {intl.formatMessage(placeholderMessages.contacts)}
            </div>
            <a href={"mailto:hello@akasha.world"} target="_top" className="mail">hello@akasha.world</a>
            <a href={"mailto:careers@akasha.world"} target="_top" className="mail">careers@akasha.world</a>
            <a href={"mailto:press@akasha.world"} target="_top" className="mail">press@akasha.world</a>
          </div>
        </div>
        {appState.get('showTerms') && <Terms hideTerms={hideTerms} />}
      </div>
    );
}

WebPlaceholder.propTypes = {
    appState: PropTypes.shape(),
    intl: PropTypes.shape(),
    showTerms: PropTypes.func,
    hideTerms: PropTypes.func,
    gethErr: PropTypes.bool
}

export default injectIntl(WebPlaceholder);
