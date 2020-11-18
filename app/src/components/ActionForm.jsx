import React from 'react';

import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

function ActionForm(props) {
  
  const onClear = (e) => {
    e.preventDefault();
    props.onClear();
  }

  const onImport = (e) => {
    e.preventDefault();
    props.onImport();
  }

  return (
    <>
    <div>
      <Form onSubmit={onClear} inline className="justify-content-end">
        <Button variant="danger" type="submit" style={{width: "8rem"}} className="m-2">
          Clear
        </Button>
      </Form>
    </div>
    <br></br>
    <div>
      <Form onSubmit={onImport} inline className="justify-content-end">
        <Button variant="success" type="submit" style={{width: "8rem"}} className="m-2">
          Import
        </Button>
      </Form>
    </div>
    </>
  )
}

export default ActionForm;