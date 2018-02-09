const fs = require('fs');
const http = require('http');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const style = fs.readFileSync(`${__dirname}/../client/style.css`);

const respond = (request, response, code, type, data) => {
  response.writeHead(code, (type) ? { 'content-type': type } : undefined);
  response.end(data);
};

const getIndex = (request, response) => {
  respond(request, response, 200, 'text/html', index);
};

const getStyle = (request, response) => {
  respond(request, response, 200, 'text/css', style);
};

const codeToId = [];
codeToId[400] = 'badRequest';
codeToId[401] = 'unauthorized';
codeToId[500] = 'internalError';
codeToId[501] = 'notImplemented';
codeToId[404] = 'notFound';
codeToId[403] = 'forbidden';

const users = {};

const addUser = ({ name, age }) => {
  users[name] = { name, age };
};

const urls = {
  '/': getIndex,
  '/style.css': getStyle,
  '/getUsers': (req, res) => {
    if (req.method === 'HEAD') {
      respond(req, res, 200);
    } else {
      respond(req, res, 200, 'application/json', JSON.stringify({ users }));
    }
  },
  '/notReal': (req, res) => {
    if (req.method === 'HEAD') {
      respond(req, res, 404);
    } else {
      respond(req, res, 404, 'application/json', JSON.stringify({ message: 'Resource not found', id: codeToId[404] }));
    }
  },
  '/addUser': (req, res) => {
    const body = [];
    req.on('error', (err) => {
      respond(req, res, 400, 'application/json', JSON.stringify({ message: err, id: codeToId[400] }));
    });
    req.on('data', (chunk) => {
      console.log(chunk);
      body.push(chunk);
    });
    req.on('end', () => {
      const string = Buffer.concat(body).toString();
      console.log(string);
      const obj = JSON.parse(string);
      console.log(obj);
      addUser(obj);
      respond(req, res, 200, 'application/json', JSON.stringify({ message: 'User created successfully', id: 'Created' }));
    });
  },
};

const stripQueryParams = (reqUrl) => {
  const queryIndex = reqUrl.indexOf('?');
  if (queryIndex !== -1) {
    return reqUrl.substring(0, queryIndex);
  }
  return reqUrl;
};

const onRequest = (request, response) => {
  console.log(request.url);
  const reqUrl = stripQueryParams(request.url);

  if (urls[reqUrl]) { urls[reqUrl](request, response); } else { respond(request, response, 404, 'application/json', JSON.stringify({ message: 'Not found', id: codeToId[404] })); }
};

http.createServer(onRequest).listen(port);
console.log(`Listening on ${port}`);
