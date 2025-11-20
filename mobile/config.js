import Constants from 'expo-constants';

const API_BASE_URL = Constants.platform.web ? 'http://localhost:5000' : 'http://192.168.1.3:5000';

export default API_BASE_URL;
