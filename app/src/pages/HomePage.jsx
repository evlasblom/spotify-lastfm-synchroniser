import React from 'react';

// A very simple home page component
// @TODO: make this a bit more fancy...
function HomePage(props) {

  return (
    <>
      <h1>Lastify Synchroniser</h1>
      
      <p>This is a simple web application that lets you automatically synchronise your Spotify library with your Last.fm charts.</p>

      <div style={{textAlign: "left"}}>
        <h3>How does it work?</h3>
        <ul>
          <li>Authenticate via Spotify and provide a Last.fm username.</li>
          <li>Verify your Spotify and Last.fm profiles.</li>
          <li>Choose <i>artists</i>, <i>albums</i> or <i>tracks</i> from the menu.</li>
          <li>Select a time <i>period</i>, maximum <i>number</i> and minimum <i>playcount</i> to get your Last.fm charts.</li>
          <li>Search Spotify for your Last.fm charts.</li>
          <li>Choose to clear content from Spotify that does not appear in your Last.fm charts.</li>
          <li>Choose to import content into Spotify that does appear in your Last.fm charts.</li>
          <li>Restart Spotify for these changes to appear.</li>
        </ul>
      </div>

      <div style={{textAlign: "left"}}>
        <h3>When should I use this?</h3>
        <ul>
          <li>I only want to follow my 100 most-listened artists and remove the rest.</li>
          <li>I want to follow my 200 most-listened artists, but remove those I didn't listen to last year.</li>
          <li>I want to save all albums with at least 100 plays.</li>
          <li>I want to save my favourite 10 tracks from the last 90 days.</li>
        </ul>
      <p>Note that this application is mostly intended for users who want to <i>completely</i> automate organizing their Spotify libraries.</p>
      <p>Users that already have large curated libraries should be careful not to accidentally clear them. </p>
      <p>The app does ask for confirmation at every step along the way.</p>
      <a href="/auth">Yes I understand, let's get started!</a>
      </div>
    </>
  )
}

export default HomePage;
