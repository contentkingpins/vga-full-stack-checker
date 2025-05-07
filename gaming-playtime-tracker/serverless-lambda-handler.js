const { Server } = require('http');
const { parse } = require('url');
const next = require('next');

// Create the Next.js app instance
const app = next({ dev: false });
const handle = app.getRequestHandler();

// Prepare the app
let isAppPrepared = false;
const prepareApp = async () => {
  if (!isAppPrepared) {
    await app.prepare();
    isAppPrepared = true;
    console.log('Next.js app prepared');
  }
};

// Lambda handler function
exports.handler = async (event, context) => {
  // Make the Lambda context callbackWaitsForEmptyEventLoop = false
  // This allows the Lambda function to return a response without waiting for the Next.js event loop to empty
  context.callbackWaitsForEmptyEventLoop = false;

  // Prepare the Next.js app if not already prepared
  await prepareApp();

  // Parse the event from API Gateway
  const { path, httpMethod, headers, queryStringParameters, body } = event;
  
  // Create a request and response object for Next.js
  const req = {
    method: httpMethod,
    url: path + (queryStringParameters ? '?' + new URLSearchParams(queryStringParameters).toString() : ''),
    headers,
    body: body ? JSON.parse(body) : undefined,
  };

  // Create a response object to capture the response from Next.js
  let responseData = {
    statusCode: 200,
    headers: {},
    body: '',
  };

  const res = {
    statusCode: 200,
    headers: {},
    setHeader: (name, value) => {
      res.headers[name.toLowerCase()] = value;
      return res;
    },
    getHeader: (name) => res.headers[name.toLowerCase()],
    removeHeader: (name) => {
      delete res.headers[name.toLowerCase()];
      return res;
    },
    getHeaderNames: () => Object.keys(res.headers),
    hasHeader: (name) => !!res.headers[name.toLowerCase()],
    status: (code) => {
      res.statusCode = code;
      return res;
    },
    write: (chunk) => {
      if (typeof chunk === 'string') {
        responseData.body += chunk;
      } else {
        responseData.body += chunk.toString('utf8');
      }
      return true;
    },
    end: (chunk) => {
      if (chunk) res.write(chunk);
      responseData.statusCode = res.statusCode;
      responseData.headers = res.headers;
      if (!responseData.headers['content-type']) {
        responseData.headers['content-type'] = 'application/json';
      }
      return responseData;
    },
    redirect: (statusOrUrl, url) => {
      if (typeof statusOrUrl === 'string') {
        res.setHeader('Location', statusOrUrl);
        res.status(302);
      } else {
        res.setHeader('Location', url);
        res.status(statusOrUrl);
      }
      return res.end();
    },
  };

  try {
    // Parse the URL from the path
    const parsedUrl = parse(req.url, true);

    // Handle the request with Next.js
    await handle(req, res);

    // Return the response
    return {
      statusCode: responseData.statusCode,
      headers: responseData.headers,
      body: responseData.body,
    };
  } catch (error) {
    console.error('Error handling request:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
}; 