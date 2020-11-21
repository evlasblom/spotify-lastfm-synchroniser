import React, { useState } from 'react';

import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'

function ActionForm(props) {
  const [show, setShow] = useState(false);

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);
  const handleSubmit = () => {
    setShow(false);
    props.onSubmit();
  }

  // note: setting animation to false because of this issue
  // https://github.com/react-bootstrap/react-bootstrap/issues/5075
  return(
    <div className="d-flex justify-content-end bg-light rounded">
      <Modal show={show} onHide={handleClose} animation={false}>
        <Modal.Header closeButton>
          <Modal.Title>{props.text}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{props.modal}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant={props.variant} onClick={handleSubmit}>
            {props.text}
          </Button>
        </Modal.Footer>
      </Modal>

      <Button 
          variant={props.variant} 
          onClick={handleShow} 
          disabled={props.disabled} 
          style={{width: "8rem"}} 
          className="m-2">
        {props.text}
      </Button>
    </div>
  )
}

export default ActionForm;