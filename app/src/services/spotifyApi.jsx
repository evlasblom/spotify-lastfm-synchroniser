import axios from 'axios';

export function requestProfileSpotify(access_token) {
  const options = {
    url: 'me',
    baseURL: 'https://api.spotify.com/v1/',
    method: 'GET',
    timeout: 4000,
    headers: {
      'Authorization': 'Bearer ' + access_token
    }
  };
  return axios(options)
}

export function convertProfileSpotify(response) {
  const profile = response.data;
  return {
    url: profile.images[0].url,
    name: profile.display_name,
    id: profile.id,
    text: "A " + profile.product + " " + profile.type + " from " + profile.country + ".",
    href: profile.external_urls.spotify
  }
}
