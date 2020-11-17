import React, { useState } from 'react';

import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

function ActionForm(props) {
  const [state, setState] = useState(props.initial);
  const actions = ['add', 'replace'];
  
  const onSubmit = (e) => {
    e.preventDefault();
    props.onSubmit(state);
  }

  return (
    <div className="bg-light">
      <Form onSubmit={onSubmit} inline className="justify-content-end">
        <Form.Label className="m-2">Action</Form.Label>
        <Form.Control 
            as="select" 
            defaultValue={0} 
            onChange={(e) => setState(e.currentTarget.value)}
            className="m-2" >
          {
            actions.map((period) => {
              return <option key={period} value={period}>{period}</option>
            })
          }
        </Form.Control>

        <Button variant="primary" type="submit" style={{width: "8rem"}} className="m-2">
          Sync
        </Button>
      </Form>
    </div>
  )
}

export default ActionForm;