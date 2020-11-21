import React, { useReducer } from 'react';

import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

const formReducer = (state, action) => {
  switch(action.type) {
    case 'PERIOD':
      return {
        ...state,
        period: action.payload
      }
    case 'NUMBER':
      return {
        ...state,
        number: action.payload
      }
    case 'PLAYCOUNT':
      return {
        ...state,
        playcount: action.payload
      }
    default:
      return state;
  }
}

function SelectionForm(props) {
  const [state, dispatch] = useReducer(formReducer, props.initial);
  const periods = ['overall', '7day', '1month', '3month', '6month', '12month'];
  
  const onSubmit = (e) => {
    e.preventDefault();
    props.onSubmit(state);
  }

  return (
    <div>
      <Form onSubmit={onSubmit} inline className="justify-content-end bg-light rounded">
        <Form.Label className="m-2">Period</Form.Label>
        <Form.Control 
            as="select" 
            defaultValue={0} 
            onChange={(e) => dispatch({type: "PERIOD", payload: e.currentTarget.value})}
            className="m-2" >
          {
            periods.map((period) => {
              return <option key={period} value={period}>{period}</option>
            })
          }
        </Form.Control>

        <Form.Label className="m-2">Number</Form.Label>
        <Form.Control 
          type="text" 
          placeholder="number" 
          value={state.number} 
          onChange={(e) => dispatch({type: "NUMBER", payload: e.currentTarget.value})}
          className="m-2" />

        <Form.Label className="m-2">Playcount</Form.Label>
        <Form.Control 
          type="text" 
          placeholder="playcount" 
          value={state.playcount} 
          onChange={(e) => dispatch({type: "PLAYCOUNT", payload: e.currentTarget.value})}
          className="m-2" />

        <Button variant="secondary" type="submit" style={{width: "8rem"}} className="m-2">
          Select
        </Button>
      </Form>
    </div>
  )
}

export default SelectionForm;