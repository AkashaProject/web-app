import PropTypes from 'prop-types';
import React from 'react';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import { Tooltip } from 'antd';
import { Icon } from './';

const SidebarIcon = (props) => {
    const { activePath, className, iconType, linkTo, location, tooltipTitle, disabled,
      guestTooltip, unlocked } = props;
    const isActive = location.pathname.includes(activePath);
    const wrapperClassName = classNames('flex-center sidebar-icon__wrapper', {
        'sidebar-icon__wrapper_active': isActive,
    });
    const iconClassName = classNames('sidebar-icon__icon', className, {
        'sidebar-icon__icon_active': isActive
    });
    if (disabled) {
        return (
          <Tooltip
            mouseEnterDelay={0.3}
            title={tooltipTitle}
            placement="right"
          >
            <div className={wrapperClassName}>
              <Icon className={iconClassName} type={iconType} />
            </div>
          </Tooltip>
        );
    }

    if (unlocked === false) {
      return (
        <Tooltip
          mouseEnterDelay={0.3}
          title={guestTooltip}
          placement="right"
        >
          <div className={wrapperClassName}>
            <Icon className={iconClassName} type={iconType} />
          </div>
        </Tooltip>
      );
  }

    return (
      <Link to={linkTo || ''}>
        <Tooltip
          mouseEnterDelay={0.3}
          title={tooltipTitle}
          placement="right"
        >
          <div className={wrapperClassName}>
            <Icon className={iconClassName} type={iconType} />
          </div>
        </Tooltip>
      </Link>
    );
};

SidebarIcon.propTypes = {
    activePath: PropTypes.string.isRequired,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    iconType: PropTypes.string.isRequired,
    linkTo: PropTypes.string,
    location: PropTypes.shape().isRequired,
    tooltipTitle: PropTypes.string
};

export default withRouter(SidebarIcon);
