import Constants from 'expo-constants';

// आपका LIVE Backend API URL
const LIVE_API_URL = 'https://homzon-live-api.onrender.com';

const API_BASE_URL = Constants.platform.web ? LIVE_API_URL : LIVE_API_URL;

export default API_BASE_URL;