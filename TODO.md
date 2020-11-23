# Todo

## Main

- Report unfound results to user.
- Request user input for unsure results.
- Then test large bulk updates.

## General

- Add comments to javascript functions.
- Placeholders while loading.
- Add `WelcomePage` with link to `AuthPage`.
- Update the main readme with relevant info.
- Improve usability:
  - Add totals to lists.
  - Add progress bars to buttons.
  - Extra explanation of how everything works.
  - Add cookies to store last used selection?
- Spend a little time making it look better:
  - Add favicons.
  - Remove headers on each page.
  - Turn the lists into paginated tables with some styling

## Authentication

- Display timer when authentication expires?
- Move authentication data from local storage to React context?
- Also authenticate with last.fm to love and unlove tracks?

## Outdated create-react-app / react-scripts version

This requires a bit more explanation.

Here is what I did to bootstrap the react app on Ubuntu 20.04.

```bash
# install node via snap
# one user pointed out this may be the problem actually,
# see: https://github.com/facebook/create-react-app/issues/8461
sudo snap install node --classic --channel=14

# bootstrap via cra
npx create-react-app app --use-npm
```

This gives a strange warning.

```bash
Note: the project was bootstrapped with an old unsupported version of tools.
Please update to Node >=10 and npm >=6 to get supported tools in new projects.  
```

Though, my versions are correct.

```bash
# verify node version --> 14.15.0
node --version

# verify npm version --> 6.14.8
npm --version
```

The result is that I used an old (0.9.5) version of the react scripts and thus my templates are outdated. For now, at least I upgraded to the latest versions of the scripts as follows.

```bash
npm install --save --save-exact react-scripts@3.4.3
```

Though, there may be some differences in the templates themselves! For example, this old template version does not seem to have the `<React.StrictMode>` component in the _index.js_ file, so I manually added it myself. 

The actual todo, either one of these:

- See if there are more template differences and fix those.
- Make sure to bootstrap the app with the correct versions and migrate the code.

That's it!
