import React from 'react'

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tooltip from 'react-bootstrap/Tooltip'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'

// A component that wrap a font awesome icon with a tooltip.
// Note: this particular piece of code gives an error in strict mode!
function FontAwesomeIconWithTooltip(props) {
  const text = props.text;
  const placement = props.placement ? props.placement : "right";

  const renderTooltip = (props) => (
    <Tooltip {...props}>
      {text}
    </Tooltip>
  );

  return (
    <OverlayTrigger
        placement={placement}
        delay={{ show: 250, hide: 400 }}
        overlay={renderTooltip} >
      <FontAwesomeIcon icon={props.icon} />
    </OverlayTrigger>
  )
}

export default FontAwesomeIconWithTooltip;