/*

Node.js HTTP-Encoding Example by Sv443 ( https://github.com/Sv443 )
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

const zlib = require("zlib"); // zipping library, here it's used to encode the default file
const http = require("http"); // http library, it will handle the server side stuff
const fs = require("fs");     // file system library, used for opening file streams and modifying files



// this is where the encoding magic happens:
const encode = {
    gzip: () => {
        zlib.gzip(getBuffer(), (err, res) => {
            if(!err)
                fs.writeFileSync("./test.html.gz", res);
            else console.error(`Err: ${err}`);
        });
    },
    deflate: () => {
        zlib.deflate(getBuffer(), (err, res) => {
            if(!err)
                fs.writeFileSync("./test.html.zz", res);
            else console.error(`Err: ${err}`);
        });
    },
    brotli: () => {
        zlib.brotliCompress(getBuffer(), (err, res) => {
            if(!err)
                fs.writeFileSync("./test.html.br", res);
            else console.error(`Err: ${err}`);
        });
    }
}

/**
 * Opens the to-be-encoded file and returns it as a buffer
 * @returns {Buffer}
 */
function getBuffer()
{
    return fs.readFileSync("./test.html");
}

/**
 * Starts the HTTP server
 */
function startHttpServer()
{
    http.createServer((req, res) => {
        console.log(`\nGot request with method "${req.method}" from IP address "${req.connection.remoteAddress}"`);
        if(req.method == "GET" || req.method == "OPTIONS")
        {
            let selectedEncoding = null;

            // encodings that are further to the left will be prioritized
            let encodingPriority = ["br", "gzip", "deflate"];
            encodingPriority = encodingPriority.reverse();

            // get the connecting client's accepted encodings
            let acceptedEncodings = [];
            if(req.headers["accept-encoding"])
                acceptedEncodings = req.headers["accept-encoding"].split(/[\,]\s*/gm);
            acceptedEncodings = acceptedEncodings.reverse();
            console.log(`Client supports encodings: ${acceptedEncodings.join(", ")}`);

            // agree on an encoding both the server and client support and that is the furthest to the left on the encoding priority list above
            encodingPriority.forEach(encPrio => {
                if(acceptedEncodings.includes(encPrio))
                    selectedEncoding = encPrio;
            });


            let fileName = "test.html";

            if(selectedEncoding == "br")
                fileName = "test.html.br";
            else if(selectedEncoding == "gzip")
                fileName = "test.html.gz";
            else if(selectedEncoding == "deflate")
                fileName = "test.html.zz";

            if(selectedEncoding)
                console.log(`Client and server agreed on encoding "${selectedEncoding}" (${selectedEncoding} has priority ${encodingPriority.indexOf(selectedEncoding) + 1} in range of 1-${encodingPriority.length + 1})\nSelected File: "${fileName}"`);
            else console.log(`Client doesn't support encoding, serving content without encoding`);

            // set the content-encoding header so the client knows which encoding the server used
            if(selectedEncoding)
                res.setHeader("Content-Encoding", selectedEncoding);

            // stream the file to the client
            return pipeFile(res, `./${fileName}`, "text/html", 200);
        }
    }).listen(80, null, null, (err) => {
        if(err)
            console.error("ERR: " + err);
        else
            console.log("HTTP Ok");
    });
}

/**
 * Pipes a file into a HTTP response
 * @param {http.ServerResponse} res The HTTP res object
 * @param {String} filePath Path to the file to respond with - relative to the project root directory
 * @param {String} mimeType The MIME type to respond with
 * @param {Number} [statusCode=200] The status code to respond with - defaults to 200
 */
function pipeFile(res, filePath, mimeType, statusCode = 200)
{
    try
    {
        statusCode = parseInt(statusCode);
        if(isNaN(statusCode))
            throw new Error("err_statuscode_isnan");
    }
    catch(err)
    {
        res.writeHead(500, {"Content-Type": "text/plain; UTF-8"});
        return res.end(`Encountered internal server error while piping file: wrong type for status code.`);
    }

    if(!fs.existsSync(filePath))
    {
        res.writeHead(404, {"Content-Type": "text/plain; UTF-8"});
        return res.end(`Error: Requested file "${filePath}" not found`);
    }

    try
    {
        res.writeHead(statusCode, {
            "Content-Type": `${mimeType}; UTF-8`,
            "Content-Length": fs.statSync(filePath).size
        });

        // create a read stream and pipe it to the connecting client:
        let readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    }
    catch(err)
    {
        console.log(`Internal error: ${err}`);

        res.writeHead(500, {"Content-Type": "text/plain; UTF-8"});
        return res.end(`Encountered internal server error while piping file: ${err}`);
    }
}

// encode the file to all three encodings:
encode.brotli();
encode.gzip();
encode.deflate();

// start the HTTP server:
startHttpServer();