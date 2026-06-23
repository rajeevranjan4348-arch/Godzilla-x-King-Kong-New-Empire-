const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

let tokenClient: any;
export let gapiInited = false;
export let gisInited = false;

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export const initGoogleCalendar = async (onAuthChange: (isAuthenticated: boolean) => void) => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!apiKey || !clientId) {
    console.warn('Missing VITE_GOOGLE_API_KEY or VITE_GOOGLE_CLIENT_ID in environment variables.');
    return;
  }

  const loadGapi = new Promise<void>((resolve) => {
    if (window.gapi) {
      window.gapi.load('client', async () => {
        await window.gapi.client.init({
          apiKey: apiKey,
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        resolve();
      });
    } else {
      resolve();
    }
  });

  const loadGis = new Promise<void>((resolve) => {
    if (window.google) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (tokenResponse: any) => {
          if (tokenResponse.error !== undefined) {
            throw (tokenResponse);
          }
          onAuthChange(true);
        },
      });
      gisInited = true;
      resolve();
    } else {
      resolve();
    }
  });

  await Promise.all([loadGapi, loadGis]);
  
  // Check if already authenticated
  if (window.gapi && window.gapi.client && window.gapi.client.getToken()) {
    onAuthChange(true);
  }
};

export const handleAuthClick = () => {
  if (!tokenClient) return;
  if (window.gapi.client.getToken() === null) {
    tokenClient.requestAccessToken({prompt: 'consent'});
  } else {
    tokenClient.requestAccessToken({prompt: ''});
  }
};

export const handleSignoutClick = (onAuthChange: (isAuthenticated: boolean) => void) => {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token, () => {
      window.gapi.client.setToken('');
      onAuthChange(false);
    });
  }
};

export const listUpcomingEvents = async () => {
  if (!gapiInited || !window.gapi.client.calendar) return [];
  try {
    const response = await window.gapi.client.calendar.events.list({
      'calendarId': 'primary',
      'timeMin': (new Date()).toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': 10,
      'orderBy': 'startTime',
    });
    return response.result.items;
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const addEvent = async (summary: string, description: string, startTime: string, endTime: string) => {
  if (!gapiInited || !window.gapi.client.calendar) throw new Error("Calendar API not initialized");
  
  const event = {
    'summary': summary,
    'description': description,
    'start': {
      'dateTime': startTime,
      'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    'end': {
      'dateTime': endTime,
      'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  try {
    const request = await window.gapi.client.calendar.events.insert({
      'calendarId': 'primary',
      'resource': event,
    });
    return request.result;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const deleteEvent = async (eventId: string) => {
  if (!gapiInited || !window.gapi.client.calendar) throw new Error("Calendar API not initialized");
  try {
    await window.gapi.client.calendar.events.delete({
      'calendarId': 'primary',
      'eventId': eventId,
    });
    return true;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
