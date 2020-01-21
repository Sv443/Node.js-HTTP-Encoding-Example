/*

Node.js HTTP-Encoding Example by Sv443 ( https://github.com/Sv443 ) - refactored by davidmdm ( https://github.com/davidmdm )
Licensed under the WTFPL license - you can do whatever you want with this code (yes, absolutely everything without any conditions)

This example shows how content encoding works in Node.js.
Supported encodings: Gzip, Deflate, Brotli
It only makes use of native modules, so you don't even need to install external modules.
Your Node version has to be greater than v11.7.0 for this script to execute (to check run "node -v" in a terminal).
Once this script is running, go to the website "http://localhost/" or "http://127.0.0.1/".
You can use your browser's developer tools to find out which encoding is served to you by pressing F12, going to the "Network" tab and clicking the HTML file.
Once the encoded files are generated, you can compare their file sizes to that of the initial file ("test.html") to see the difference in compression.


Files:
---------------------------------
test.html     |  Not encoded
test.html.gz  |  Gzip encoded
test.html.zz  |  Deflate encoded
test.html.br  |  Brotli encoded

*/

const zlib = require('zlib'); // zipping library, here it's used to encode the default file
const http = require('http'); // http library, it will handle the server side stuff
const fs = require('fs'); // file system library, used for opening file streams and modifying files
const stream = require('stream'); // stream system library, used for correctly pipelining streams for us

// Here we read the test.html file and write it to the filesystem with our different encodings
const htmlBuffer = fs.readFileSync('./test.html');

zlib.gzip(htmlBuffer, (err, res) => {
  if (!err) fs.writeFileSync('./test.html.gz', res);
  else console.error(`Err: ${err}`);
});

zlib.deflate(htmlBuffer, (err, res) => {
  if (!err) fs.writeFileSync('./test.html.zz', res);
  else console.error(`Err: ${err}`);
});

zlib.brotliCompress(htmlBuffer, (err, res) => {
  if (!err) fs.writeFileSync('./test.html.br', res);
  else console.error(`Err: ${err}`);
});

// encodings that are further to the left will be prioritized
const encodingPriority = ['br', 'gzip', 'deflate'];

const encodingToFileMap = {
  br: 'test.html.br',
  gzip: 'test.html.gz',
  deflate: 'test.html.zz',
};

/**
 * Pipes a file into a HTTP response
 * @param {http.ServerResponse} res The HTTP res object
 * @param {String} filePath Path to the file to respond with - relative to the project root directory
 * @param {String} mimeType The MIME type to respond with
 */
async function pipeFile(res, filePath, mimeType) {
  const fileExists = await fs.promises
    .access(filePath, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);

  if (!fileExists) {
    res.writeHead(404, { 'Content-Type': 'text/plain; UTF-8' });
    return res.end(`Error: Requested file "${filePath}" not found`);
  }

  res.writeHead(200, {
    'Content-Type': `${mimeType}; UTF-8`,
    'Content-Length': fs.statSync(filePath).size,
  });

  // create a read stream and pipe it to the connecting client:
  stream.pipeline(fs.createReadStream(filePath), res, err => {
    if (err) {
      console.error(`Encountered error while streaming file: ${err}`);
    }
    return undefined;
  });
}

// start the HTTP server:
http
  .createServer((req, res) => {
    console.log(`\nGot request with method "${req.method}" from IP address "${req.connection.remoteAddress}"`);
    if (req.method == 'GET' || req.method == 'OPTIONS') {
      // get the connecting client's accepted encodings
      const acceptedEncodings = (req.headers['accept-encoding'] || '').split(/,\s*/gm);
      console.log(`Client supports encodings: ${acceptedEncodings.join(', ')}`);

      // agree on an encoding both the server and client support and that is the furthest to the left on the encoding priority list above
      const selectedEncoding = encodingPriority.find(enc => acceptedEncodings.includes(enc));

      const fileName = encodingToFileMap[selectedEncoding] || 'test.html';

      if (selectedEncoding)
        console.log(
          `Client and server agreed on encoding "${selectedEncoding}" (${selectedEncoding} has priority ${encodingPriority.indexOf(
            selectedEncoding
          ) + 1} in range of 1-${encodingPriority.length + 1})\nSelected File: "${fileName}"`
        );
      else console.log(`Client doesn't support encoding, serving content without encoding`);

      // set the content-encoding header so the client knows which encoding the server used
      if (selectedEncoding) res.setHeader('Content-Encoding', selectedEncoding);

      // stream the file to the client
      return pipeFile(res, `./${fileName}`, 'text/html');
    }
    res.writeHead(405).end(http.STATUS_CODES[405]);
  })
  .listen(8080, err => {
    if (err) console.error('ERR: ' + err);
    else console.log('HTTP Ok: started server on port 8080');
  });
