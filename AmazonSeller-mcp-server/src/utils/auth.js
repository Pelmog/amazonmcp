import axios from 'axios';
    import crypto from 'crypto-js';
    import { log, logError } from './logger.js';

    // Cache for access tokens
    let accessTokenCache = {
      token: null,
      expiresAt: 0
    };

    /**
     * Get an access token for SP-API
     */
    export async function getAccessToken() {
      log('[DEBUG] getAccessToken() called');
      
      // Check if we have a valid cached token
      const now = Date.now();
      log('[DEBUG] Current time:', now);
      log('[DEBUG] Token cache status:', {
        hasToken: !!accessTokenCache.token,
        expiresAt: accessTokenCache.expiresAt,
        isValid: accessTokenCache.token && accessTokenCache.expiresAt > now
      });
      
      if (accessTokenCache.token && accessTokenCache.expiresAt > now) {
        log('[DEBUG] Using cached access token');
        return accessTokenCache.token;
      }

      log('[DEBUG] Requesting new access token from Amazon...');
      log('[DEBUG] Environment check:', {
        hasRefreshToken: !!process.env.SP_API_REFRESH_TOKEN,
        hasClientId: !!process.env.SP_API_CLIENT_ID,
        hasClientSecret: !!process.env.SP_API_CLIENT_SECRET
      });

      try {
        const response = await axios.post('https://api.amazon.com/auth/o2/token', {
          grant_type: 'refresh_token',
          refresh_token: process.env.SP_API_REFRESH_TOKEN,
          client_id: process.env.SP_API_CLIENT_ID,
          client_secret: process.env.SP_API_CLIENT_SECRET
        }, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        log('[DEBUG] Token request successful. Response status:', response.status);
        log('[DEBUG] Token expires in:', response.data.expires_in, 'seconds');

        // Cache the token
        accessTokenCache = {
          token: response.data.access_token,
          expiresAt: now + (response.data.expires_in * 1000) - 60000 // Subtract 1 minute for safety
        };

        log('[DEBUG] Access token cached until:', new Date(accessTokenCache.expiresAt));
        return accessTokenCache.token;
      } catch (error) {
        logError('[ERROR] Failed to get access token:', error.response?.data || error.message);
        logError('[ERROR] Request config:', {
          url: 'https://api.amazon.com/auth/o2/token',
          method: 'POST',
          hasRefreshToken: !!process.env.SP_API_REFRESH_TOKEN
        });
        throw new Error('Failed to authenticate with Amazon SP-API');
      }
    }

    /**
     * Generate AWS signature for SP-API requests
     */
    export function generateAWSSignature(method, path, payload = '', queryParams = {}) {
      log('[DEBUG] generateAWSSignature() called');
      log('[DEBUG] Request details:', {
        method,
        path,
        payloadLength: payload.length,
        queryParamsCount: Object.keys(queryParams).length
      });

      const region = process.env.SP_API_REGION || 'us-east-1';
      const service = 'execute-api';
      const host = `sellingpartnerapi-${region}.amazon.com`;
      const datetime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
      const date = datetime.substring(0, 8);

      log('[DEBUG] AWS signature parameters:', {
        region,
        service,
        host,
        datetime,
        date
      });

      // Create canonical request
      const canonicalUri = path;
      
      // Sort and encode query parameters
      const canonicalQueryString = Object.keys(queryParams)
        .sort()
        .map(key => {
          return `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`;
        })
        .join('&');

      log('[DEBUG] Canonical query string:', canonicalQueryString);

      // Create canonical headers
      const canonicalHeaders = 
        `host:${host}\n` +
        `x-amz-date:${datetime}\n`;

      const signedHeaders = 'host;x-amz-date';
      
      // Create payload hash
      const payloadHash = crypto.SHA256(payload).toString();
      log('[DEBUG] Payload hash:', payloadHash);
      
      // Combine elements to create canonical request
      const canonicalRequest = 
        `${method}\n` +
        `${canonicalUri}\n` +
        `${canonicalQueryString}\n` +
        `${canonicalHeaders}\n` +
        `${signedHeaders}\n` +
        `${payloadHash}`;
      
      log('[DEBUG] Canonical request created');
      
      // Create string to sign
      const algorithm = 'AWS4-HMAC-SHA256';
      const credentialScope = `${date}/${region}/${service}/aws4_request`;
      const stringToSign = 
        `${algorithm}\n` +
        `${datetime}\n` +
        `${credentialScope}\n` +
        `${crypto.SHA256(canonicalRequest).toString()}`;
      
      log('[DEBUG] String to sign created with credential scope:', credentialScope);
      
      // Calculate signature
      log('[DEBUG] Environment check for AWS keys:', {
        hasAccessKey: !!process.env.SP_API_AWS_ACCESS_KEY,
        hasSecretKey: !!process.env.SP_API_AWS_SECRET_KEY
      });

      const kDate = crypto.HmacSHA256(date, `AWS4${process.env.SP_API_AWS_SECRET_KEY}`);
      const kRegion = crypto.HmacSHA256(region, kDate);
      const kService = crypto.HmacSHA256(service, kRegion);
      const kSigning = crypto.HmacSHA256('aws4_request', kService);
      const signature = crypto.HmacSHA256(stringToSign, kSigning).toString();
      
      log('[DEBUG] AWS signature generated successfully');
      
      // Create authorization header
      const authorizationHeader = 
        `${algorithm} ` +
        `Credential=${process.env.SP_API_AWS_ACCESS_KEY}/${credentialScope}, ` +
        `SignedHeaders=${signedHeaders}, ` +
        `Signature=${signature}`;
      
      const headers = {
        'x-amz-date': datetime,
        'Authorization': authorizationHeader
      };

      log('[DEBUG] AWS signature headers generated');
      return headers;
    }

    /**
     * Make a request to the SP-API
     */
    export async function makeSpApiRequest(method, path, data = null, queryParams = {}) {
      log('[DEBUG] makeSpApiRequest() called');
      log('[DEBUG] Request parameters:', {
        method,
        path,
        hasData: !!data,
        queryParamsCount: Object.keys(queryParams).length
      });

      try {
        log('[DEBUG] Getting access token...');
        const accessToken = await getAccessToken();
        
        const region = process.env.SP_API_REGION || 'us-east-1';
        const url = `https://sellingpartnerapi-${region}.amazon.com${path}`;
        
        log('[DEBUG] Request URL:', url);
        
        const payload = data ? JSON.stringify(data) : '';
        log('[DEBUG] Payload length:', payload.length);
        
        log('[DEBUG] Generating AWS signature...');
        const awsHeaders = generateAWSSignature(method, path, payload, queryParams);
        
        const headers = {
          'x-amz-access-token': accessToken,
          'Content-Type': 'application/json',
          ...awsHeaders
        };

        log('[DEBUG] Request headers prepared (access token masked)');
        log('[DEBUG] Making axios request...');
        
        const response = await axios({
          method,
          url,
          params: queryParams,
          data: data,
          headers
        });
        
        log('[DEBUG] SP-API request successful');
        log('[DEBUG] Response status:', response.status);
        log('[DEBUG] Response data keys:', Object.keys(response.data || {}));
        
        return response.data;
      } catch (error) {
        logError('[ERROR] SP-API request failed');
        logError('[ERROR] Error status:', error.response?.status);
        logError('[ERROR] Error data:', error.response?.data);
        logError('[ERROR] Error message:', error.message);
        logError('[ERROR] Request config:', {
          method,
          url: `https://sellingpartnerapi-${process.env.SP_API_REGION || 'us-east-1'}.amazon.com${path}`,
          hasData: !!data
        });
        throw new Error(`SP-API request failed: ${error.response?.data?.errors?.[0]?.message || error.message}`);
      }
    }
