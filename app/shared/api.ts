import axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';


const baseURL = 'http://localhost:5000';



export const $apiInstance = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});


export const $apiClientInstance = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});


export const $api = setupCache($apiInstance, {
    ttl: 1000 * 60 * 5,
    cachePredicate: (res) => res.status === 200
});

export const $apiClient = setupCache($apiClientInstance, {
    ttl: 1000 * 60 * 5,
    cachePredicate: (res) => res.status === 200
});