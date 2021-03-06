import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Card, Icon } from 'antd';
import imageCreator, { findClosestMatch } from '../../utils/imageUtils';
import { getTextColor } from '../../utils/colorUtils';
import ParserUtils from '../../utils/parsers/parser-utils';
import { entryMessages } from '../../locale-data/messages/entry-messages';

const getImageSrc = (imageObj, baseUrl, targetWidth) => {
    const bestMatch = findClosestMatch((targetWidth || 700), imageObj, Object.keys(imageObj)[0]);
    return imageCreator(imageObj[bestMatch].src, baseUrl);
};

const navigateTo = (url, onClick, isEdit) =>
    (ev) => {
        if (!isEdit) {
            ev.preventDefault();
            if (onClick) {
                return onClick(url);
            }
        }
        return true;
    };

class WebsiteInfoCard extends Component {
    getNodeRef = () => this.baseNodeRef;
    render () { // eslint-disable-line complexity
        const { cardInfo, baseUrl, hasCard, baseWidth, onClick, intl,
            onClose, isEdit, loading, error, infoExtracted, maxImageHeight } = this.props;
        const { url, image, description, title, bgColor } = cardInfo;
        const bodyStyle = {
            padding: 0
        };
        let textColor = 'inherit';
        if (bgColor) {
            bodyStyle.backgroundColor = bgColor;
            textColor = getTextColor(bgColor);
        }
        return (
          <Card
            bodyStyle={bodyStyle}
            ref={(node) => { this.baseNodeRef = node; }}
            className={
                `website-info-card
                website-info-card${!infoExtracted && !error && !hasCard ? '_empty' : ''}
                website-info-card${(!error && !hasCard) ? '_empty' : ''}
                website-info-card${isEdit ? '_edit' : ''}`
            }
            loading={loading}
          >
            {!title && !description && infoExtracted && !error && url &&
              <div>{intl.formatMessage(entryMessages.cannotExtractWebsiteInfo)}</div>
            }
            {error &&
              <div className="website-info-card__error">
                <Icon type="exclamation-circle-o" />
                {error}
              </div>
            }
            {isEdit && infoExtracted && (hasCard || error) &&
              <Icon
                type="close-square"
                className="website-info-card__close-button"
                onClick={onClose}
              />
            }
            {!error && image && image.get('xs') &&
              <a
                onClick={navigateTo(url, onClick, isEdit)}
                href={url}
                title={url}
                className="website-info-card__image-link"
              >
                <div
                  className="website-info-card__card-cover-wrapper"
                  style={{ height: maxImageHeight }}
                >
                  <img
                    crossOrigin="Anonymous"
                    alt="card-cover"
                    src={getImageSrc(image.toJS(), baseUrl, baseWidth)}
                  />
                </div>
              </a>
            }
            {!error && url && hasCard &&
              <small
                title={url}
                className="website-info-card__source-url"
              >
                <a
                  onClick={navigateTo(url, onClick, isEdit)}
                  href={url}
                  style={{ color: textColor, opacity: 0.75 }}
                >
                  {ParserUtils.parseUrl(url).hostname}
                </a>
              </small>
            }
            {!error &&
            <div
              className="website-info-card__title-wrapper"
            >
              {title &&
                <h3
                  className="website-info-card__title"
                >
                  <a
                    onClick={navigateTo(url, onClick, isEdit)}
                    href={url}
                    title={url}
                    style={{ color: textColor }}
                  >
                    {title}
                  </a>
                </h3>
              }
              {description &&
                <a
                  href={url}
                  onClick={navigateTo(url, onClick, isEdit)}
                  className="website-info-card__description"
                  style={{ color: textColor, opacity: 0.85 }}
                >
                  {description}
                </a>
              }
            </div>
            }
          </Card>
        );
    }
}

WebsiteInfoCard.defaultProps = {
    maxImageHeight: 350,
};

WebsiteInfoCard.propTypes = {
    baseUrl: PropTypes.string.isRequired,
    baseWidth: PropTypes.number,
    cardInfo: PropTypes.shape(),
    error: PropTypes.string,
    hasCard: PropTypes.bool,
    infoExtracted: PropTypes.bool.isRequired,
    maxImageHeight: PropTypes.number,
    onClick: PropTypes.func,
    onClose: PropTypes.func,
    isEdit: PropTypes.bool,
    loading: PropTypes.bool,
    intl: PropTypes.shape(),
};

export default WebsiteInfoCard;
