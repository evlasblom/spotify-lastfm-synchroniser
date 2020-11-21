import React, { useState, useEffect } from 'react';
import { useAsyncCallback } from 'react-async-hook';

import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'

function ActionForm(props) {
  const [show, setShow] = useState(false);
  const onSubmit = useAsyncCallback(props.onSubmit);

  const onResult = props.onResult;
  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);
  const handleSubmit = () => {
    setShow(false);
    onSubmit.execute();
  }

  useEffect(() => {
    // note: the warning mentions to include onResult in dependency, but this would
    // trigger more side effects than needed, and we know onResult won't change.
    if (onSubmit.result && !onSubmit.loading && !onSubmit.error) onResult();
  }, [onSubmit.result, onSubmit.loading, onSubmit.error])

  // note: setting animation to false because of this issue
  // https://github.com/react-bootstrap/react-bootstrap/issues/5075
  return(
    <div className="d-flex justify-content-end bg-light rounded">
      <Modal show={show} onHide={handleClose} animation={false}>
        <Modal.Header closeButton>
          <Modal.Title>{props.text}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{props.modal} Are you sure?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant={props.variant} onClick={handleSubmit}>
            {props.text}
          </Button>
        </Modal.Footer>
      </Modal>

      <Button variant={props.variant} onClick={handleShow} style={{width: "8rem"}} className="m-2">
        {onSubmit.loading ? "Working..." : props.text}
      </Button>
    </div>
  )
}

export default ActionForm;