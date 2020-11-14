import axios from 'axios';

export function requestProfileLastFm(user, access_key) {
  let url = ''
  url += '?method=user.getinfo'
  url += '&user=' + user
  url += '&api_key=' + access_key
  url += '&format=json'
  const options = {
    url: url,
    baseURL: 'https://ws.audioscrobbler.com/2.0/',
    method: 'GET',
    timeout: 4000,
  };
  return axios(options)
}

export function convertProfileLastFM(response) {
  const profile = response.data.user;
  const product = profile.subscriber === 1 ? "premium" : "free";
  return {
    url: profile.image[2]['#text'],
    name: profile.realname,
    id: profile.name,
    text: "A " + product + " " + profile.type + " from " + profile.country + ".",
    href: profile.url
  }
}