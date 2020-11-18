import React from 'react';

import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

function ActionForm(props) {
  
  const onClear = (e) => {
    e.preventDefault();
    props.onClear();
  }

  const onUpdate = (e) => {
    e.preventDefault();
    props.onUpdate();
  }

  return (
    <>
    <div className="bg-light">
      <Form onSubmit={onClear} inline className="justify-content-end">
        <Button variant="danger" type="submit" style={{width: "8rem"}} className="m-2">
          Clear
        </Button>
      </Form>
    </div>
    <br></br>
    <div className="bg-light">
      <Form onSubmit={onUpdate} inline className="justify-content-end">
        <Button variant="success" type="submit" style={{width: "8rem"}} className="m-2">
          Update
        </Button>
      </Form>
    </div>
    </>
  )
}

export default ActionForm;