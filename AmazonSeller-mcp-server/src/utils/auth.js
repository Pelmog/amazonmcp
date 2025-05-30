import axios from 'axios';
    import crypto from 'crypto-js';
    import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
    import { SignatureV4 } from '@aws-sdk/signature-v4';
    import { Sha256 } from '@aws-crypto/sha256-js';
    import { log, logError } from './logger.js';

    // Cache for access tokens
    let accessTokenCache = {
      token: null,
      expiresAt: 0
    };

    // Cache for AWS credentials from STS
    let awsCredentialsCache = {
      accessKeyId: null,
      secretAccessKey: null,
      sessionToken: null,
      expiresAt: 0
    };

    /**
     * Assume IAM role to get temporary AWS credentials
     */
    export async function getAwsCredentials() {
      log('[DEBUG] getAwsCredentials() called');
      
      // Check if we have valid cached credentials
      const now = Date.now();
      log('[DEBUG] Current time:', now);
      log('[DEBUG] AWS credentials cache status:', {
        hasCredentials: !!awsCredentialsCache.accessKeyId,
        expiresAt: awsCredentialsCache.expiresAt,
        isValid: awsCredentialsCache.accessKeyId && awsCredentialsCache.expiresAt > now
      });
      
      if (awsCredentialsCache.accessKeyId && awsCredentialsCache.expiresAt > now) {
        log('[DEBUG] Using cached AWS credentials');
        return awsCredentialsCache;
      }

      log('[DEBUG] Assuming IAM role for temporary credentials...');
      log('[DEBUG] Environment check:', {
        hasAccessKey: !!process.env.SP_API_AWS_ACCESS_KEY,
        hasSecretKey: !!process.env.SP_API_AWS_SECRET_KEY,
        hasRoleArn: !!process.env.SP_API_ROLE_ARN
      });

      try {
        const stsClient = new STSClient({
          region: process.env.SP_API_REGION || 'eu-west-1',
          credentials: {
            accessKeyId: process.env.SP_API_AWS_ACCESS_KEY,
            secretAccessKey: process.env.SP_API_AWS_SECRET_KEY
          }
        });

        const command = new AssumeRoleCommand({
          RoleArn: process.env.SP_API_ROLE_ARN,
          RoleSessionName: 'SPAPISession',
          DurationSeconds: 3600 // 1 hour
        });

        const response = await stsClient.send(command);
        const credentials = response.Credentials;

        log('[DEBUG] STS role assumption successful');
        log('[DEBUG] Credentials expire at:', credentials.Expiration);

        // Cache the credentials
        awsCredentialsCache = {
          accessKeyId: credentials.AccessKeyId,
          secretAccessKey: credentials.SecretAccessKey,
          sessionToken: credentials.SessionToken,
          expiresAt: credentials.Expiration.getTime() - 60000 // Subtract 1 minute for safety
        };

        log('[DEBUG] AWS credentials cached until:', new Date(awsCredentialsCache.expiresAt));
        return awsCredentialsCache;
      } catch (error) {
        logError('[ERROR] Failed to assume IAM role:', error.message);
        logError('[ERROR] Role ARN:', process.env.SP_API_ROLE_ARN);
        throw new Error('Failed to assume IAM role for SP-API access');
      }
    }

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
          },
          timeout: 15000, // 15 second timeout for auth requests
          httpsAgent: new (await import('https')).Agent({
            keepAlive: true,
            timeout: 15000,
            freeSocketTimeout: 10000
          })
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
     * Generate AWS signature for SP-API requests using AWS SDK
     */
    export async function generateAWSSignature(method, path, payload = '', queryParams = {}, awsCredentials, accessToken) {
      log('[DEBUG] generateAWSSignature() called (using AWS SDK)');
      log('[DEBUG] Request details:', {
        method,
        path,
        payloadLength: payload.length,
        queryParamsCount: Object.keys(queryParams).length
      });

      const region = process.env.SP_API_REGION || 'us-east-1';
      const service = 'execute-api';
      // Map AWS regions to SP-API endpoint regions
      const endpointRegion = region === 'eu-west-1' ? 'eu' : region === 'us-east-1' ? 'na' : region;
      const host = `sellingpartnerapi-${endpointRegion}.amazon.com`;

      log('[DEBUG] AWS signature parameters:', {
        region,
        service,
        host
      });

      try {
        const signer = new SignatureV4({
          service,
          region,
          credentials: {
            accessKeyId: awsCredentials.accessKeyId,
            secretAccessKey: awsCredentials.secretAccessKey,
            sessionToken: awsCredentials.sessionToken
          },
          sha256: Sha256
        });

        // Include ALL headers that will be sent, just like Python AWS4Auth does
        const signingHeaders = {
          'host': host,
          'x-amz-access-token': accessToken,
          'user-agent': 'MySPAPIClient/1.0 (Language=JavaScript)',
          'content-type': 'application/json'
        };

        const request = {
          method,
          protocol: 'https:',
          hostname: host,
          path: path + (Object.keys(queryParams).length > 0 ? '?' + new URLSearchParams(queryParams).toString() : ''),
          headers: signingHeaders
        };

        if (payload) {
          request.body = payload;
        }

        log('[DEBUG] Request object for signing:', {
          method: request.method,
          hostname: request.hostname,
          path: request.path,
          hasBody: !!request.body,
          headersForSigning: Object.keys(signingHeaders)
        });

        const signedRequest = await signer.sign(request);
        
        log('[DEBUG] AWS SDK signature generated successfully');
        
        // Extract the headers we need
        const awsHeaders = {
          'x-amz-date': signedRequest.headers['x-amz-date'],
          'Authorization': signedRequest.headers['authorization']
        };

        if (signedRequest.headers['x-amz-security-token']) {
          awsHeaders['x-amz-security-token'] = signedRequest.headers['x-amz-security-token'];
        }

        log('[DEBUG] AWS signature headers generated');
        return awsHeaders;
      } catch (error) {
        logError('[ERROR] Failed to generate AWS signature:', error.message);
        throw new Error('Failed to generate AWS signature');
      }
    }

    /**
     * Make a request to the SP-API with retry logic
     */
    export async function makeSpApiRequest(method, path, data = null, queryParams = {}, retryCount = 0) {
      log('[DEBUG] makeSpApiRequest() called');
      log('[DEBUG] Request parameters:', {
        method,
        path,
        hasData: !!data,
        queryParamsCount: Object.keys(queryParams).length,
        retryCount
      });

      const maxRetries = 3;
      
      try {
        log('[DEBUG] Getting access token...');
        const accessToken = await getAccessToken();
        
        log('[DEBUG] Getting AWS credentials from STS...');
        const awsCredentials = await getAwsCredentials();
        
        const region = process.env.SP_API_REGION || 'us-east-1';
        // Map AWS regions to SP-API endpoint regions
        const endpointRegion = region === 'eu-west-1' ? 'eu' : region === 'us-east-1' ? 'na' : region;
        const url = `https://sellingpartnerapi-${endpointRegion}.amazon.com${path}`;
        
        log('[DEBUG] Request URL:', url);
        
        const payload = data ? JSON.stringify(data) : '';
        log('[DEBUG] Payload length:', payload.length);
        
        log('[DEBUG] Generating AWS signature...');
        const awsHeaders = await generateAWSSignature(method, path, payload, queryParams, awsCredentials, accessToken);
        
        const headers = {
          'x-amz-access-token': accessToken,
          'user-agent': 'MySPAPIClient/1.0 (Language=JavaScript)',
          'content-type': 'application/json',
          ...awsHeaders
        };

        log('[DEBUG] Request headers prepared (access token masked)');
        log('[DEBUG] Request headers (for debugging):', {
          'x-amz-access-token': accessToken ? accessToken.substring(0, 10) + '...' : 'none',
          'user-agent': headers['user-agent'],
          'content-type': headers['content-type'],
          'x-amz-date': headers['x-amz-date'],
          'x-amz-security-token': headers['x-amz-security-token'] ? headers['x-amz-security-token'].substring(0, 20) + '...' : 'none',
          'Authorization': headers['Authorization'] ? headers['Authorization'].substring(0, 50) + '...' : 'none'
        });
        log('[DEBUG] Making axios request...');
        
        const response = await axios({
          method,
          url,
          params: queryParams,
          data: data,
          headers,
          timeout: 30000, // 30 second timeout
          maxRedirects: 5,
          validateStatus: (status) => status < 500, // Don't throw on 4xx errors
          httpsAgent: new (await import('https')).Agent({
            keepAlive: true,
            timeout: 30000,
            freeSocketTimeout: 15000,
            maxSockets: 50,
            maxFreeSockets: 10
          })
        });
        
        log('[DEBUG] SP-API request completed');
        log('[DEBUG] Response status:', response.status);
        log('[DEBUG] Response headers:', Object.keys(response.headers || {}));
        log('[DEBUG] Response content-type:', response.headers?.['content-type']);
        
        // Log response data for debugging 400 errors
        if (response.status >= 400) {
          log('[DEBUG] Raw response data:', typeof response.data === 'string' ? response.data.substring(0, 500) : response.data);
          
          const errorMessage = response.data?.errors?.[0]?.message || 
                              response.data?.message || 
                              `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(`SP-API request failed: ${errorMessage}`);
        }
        
        log('[DEBUG] Response data keys:', Object.keys(response.data || {}));
        
        return response.data;
      } catch (error) {
        const isRetryableError = (
          error.code === 'ECONNRESET' ||
          error.code === 'ENOTFOUND' ||
          error.code === 'ECONNREFUSED' ||
          error.code === 'ETIMEDOUT' ||
          error.message?.includes('socket disconnected') ||
          error.message?.includes('timeout') ||
          (error.response?.status >= 500)
        );

        logError('[ERROR] SP-API request failed');
        logError('[ERROR] Error status:', error.response?.status);
        logError('[ERROR] Error data:', error.response?.data);
        logError('[ERROR] Error message:', error.message);
        logError('[ERROR] Error code:', error.code);
        logError('[ERROR] Is retryable:', isRetryableError);
        const errorRegion = process.env.SP_API_REGION || 'us-east-1';
        const errorEndpointRegion = errorRegion === 'eu-west-1' ? 'eu' : errorRegion === 'us-east-1' ? 'na' : errorRegion;
        logError('[ERROR] Request config:', {
          method,
          url: `https://sellingpartnerapi-${errorEndpointRegion}.amazon.com${path}`,
          hasData: !!data,
          retryCount
        });

        // Retry logic for transient errors
        if (isRetryableError && retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          log(`[DEBUG] Retrying request in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return makeSpApiRequest(method, path, data, queryParams, retryCount + 1);
        }
        
        throw new Error(`SP-API request failed: ${error.response?.data?.errors?.[0]?.message || error.message}`);
      }
    }
