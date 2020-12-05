import React from 'react'

import { faCheck, faTimes, faExclamation } from '@fortawesome/free-solid-svg-icons'
import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons'

import FontAwesomeIconWithTooltip from './FontAwesomeIconWithTooltip'
import { ContentStatus, ContentAction, ContentSource, convertContentStatusToString, convertContentActionToString } from '../enums'
import * as constants from '../constants'

// Get the title based on the source
const getTitle = (source) => {
  switch (source) {
    case ContentSource.SPOTIFY:
      return "Spotify library";
    case ContentSource.LASTFM:
      return "Last.fm selection";
    default:
      return "Uknown source"
  }
}

// Get the class name based on the content status and action
const getContentClass = (content) => {
  const status = "status-" + convertContentStatusToString(content.status);
  const action = "action-" + convertContentActionToString(content.action);
  return status + " " + action;
}

// Content item component to display in a content list.
function ContentItem(props) {
  const content = props.content;

  if (!content) return null;
  
  let debug = {};
  if (constants.DEBUG) debug = {role: "button", onClick: () => console.log(content)}

  return (
    <div className="d-block" {...debug}>
      {content.rank ? (content.rank + ". ") : ""}
      {content.name}
      {content.playcount ? (" - " + content.playcount) : ""}
      {content.artist ? (
        <>
          <br></br>
          <i>{content.artist[0].name}</i>
        </>
      ) : ""}
    </div>
  )
}

// Content icon component to display in a content list.
function ContentIcon(props) {
  const content = props.content;

  if (!content) return null;

  return (
    <div className="d-block">
      {content.status === ContentStatus.SOUGHT ? 
      <FontAwesomeIconWithTooltip 
        placement="left"
        icon={faExclamation} 
        text={"This could not be found."} />
      : ""}
      {content.status === ContentStatus.FOUND ? 
      <FontAwesomeIconWithTooltip 
        placement="left"
        icon={faExclamation} 
        text={"This could not be confirmed."} />
      : ""}
      {content.status === ContentStatus.MARKED && content.action === ContentAction.IMPORT ? 
      <FontAwesomeIconWithTooltip 
        placement="left"
        icon={faCheck} 
        text={"This will be imported."} />
      : ""}
      {content.status === ContentStatus.MARKED && content.action === ContentAction.CLEAR ? 
      <FontAwesomeIconWithTooltip 
        placement="left"
        icon={faTimes} 
        text={"This will be cleared."} />
      : ""}
    </div>
  )
}

// Content statistics to display on top of a content list.
function ContentTotals(props) {
  const num_total = props.data.filter(c => c.status > ContentStatus.FETCHED).length;
  const num_notfound = props.data.filter(c => c.status === ContentStatus.SOUGHT).length;
  const num_notconfirmed = props.data.filter(c => c.status === ContentStatus.FOUND).length;
  const num_clear = props.data.filter(c => c.action === ContentAction.CLEAR).length;
  const num_import = props.data.filter(c => c.action === ContentAction.IMPORT).length;
  const num_resolved = props.data.filter(c => c.status === ContentStatus.RESOLVED).length;

  return (
    <div className="d-block">
      <>
        <p className="status-filtered">
          <b>Total: {num_total}</b> &nbsp;
          <FontAwesomeIconWithTooltip 
            icon={faQuestionCircle} 
            text={"All " + props.what + " in your " + getTitle(props.from)} />
        </p>
      </>
      {props.readyForAction ? (
      <>
        <p className="status-sought">
          Not found: {num_notfound} &nbsp;
          <FontAwesomeIconWithTooltip 
            icon={faQuestionCircle} 
            text={"These " + props.what + " from your Last.fm selection could not be found on Spotify so may be removed."} />
        </p>
        <p className="status-found">
          Not confirmed: {num_notconfirmed} &nbsp;
          <FontAwesomeIconWithTooltip 
            icon={faQuestionCircle} 
            text={"These " + props.what + " from your Last.fm selection were found on Spotify, but could not be confirmed and will be ignored."} />
        </p>
        {props.from === ContentSource.SPOTIFY ? 
        <p className="action-clear">
          Clear: {num_clear} &nbsp;
          <FontAwesomeIconWithTooltip 
            icon={faQuestionCircle} 
            text={"These " + props.what + " will be removed from Spotify"} />
        </p>
        : ""}
        {props.from === ContentSource.LASTFM ? 
        <p className="action-import">
          Import: {num_import} &nbsp;
          <FontAwesomeIconWithTooltip 
            icon={faQuestionCircle} 
            text={"These " + props.what + " will be imported into Spotify"} />
        </p>
        : ""}
        <p className="status-resolved">
          Resolved: {num_resolved} &nbsp;
          <FontAwesomeIconWithTooltip 
            icon={faQuestionCircle} 
            text={"These " + props.what + " already exist on both Spotify and in your Last.fm selection."} />
        </p>
      </>
      )
      : "" }
      <hr color="black" />
    </div>
  )
}

// A content list component.
function ContentList(props) {

  return (
    <table className="content-list">
      <thead>
        <tr>
          <th style={{width: '5%'}}></th>
          <th style={{width: '95%'}}><h3>{getTitle(props.from)}</h3></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td></td>
          <td>
            <ContentTotals 
              data={props.data} 
              what={props.what} 
              from={props.from} 
              readyForAction={props.readyForAction} />
          </td>
        </tr>
        {props.data.map((content, i) => {
          const classnames = getContentClass(content);  
          return (
            <tr key={i}>
              <td className={classnames}>
                <ContentIcon content={content} />
              </td>
              <td className={classnames}>
                <ContentItem content={content} />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// A content list placeholder component when loading...
export function ContentListPlaceholder(props) {

  return (
    <div className="content-list">
      
    </div>
  )
}

export default ContentList;