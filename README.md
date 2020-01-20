# Node.js HTTP Encoding Example
## This is an example of how content encoding works with Node.js HTTP servers
<br><br>
[WTFPL license](http://wtfpl.net/about/) - do whatever you wanna do with this code, you don't even have to credit me and there's no conditions whatsoever!

<br><br><br>

# Instructions to install and run:
Download or clone the repository and follow these steps to set up and run the HTTP server:

1. Make sure you have Node.js installed (minimum required Node version is `v11.7.0` - to find out your Node version, run `node -v` in a terminal)
2. Open a terminal in the folder that contains the `package.json` file and run the command `node .` or `npm start`
3. Open your browser and go to [http://localhost/](http://localhost/) or [http://127.0.0.1/](http://127.0.0.1/)

To stop the server, press <kbd>^C</kbd> (<kbd>CTRL</kbd> + <kbd>C</kbd>)

<br><br>

# Info:
You don't need to install any dependencies - all the libraries are natively installed in Node.js.  
This HTTP server example supports the encodings [Gzip](https://en.wikipedia.org/wiki/Gzip), [Deflate](https://en.wikipedia.org/wiki/DEFLATE) and [Brotli](https://en.wikipedia.org/wiki/Brotli).  
It uses file streams to further increase page loading time (files don't need to be completely loaded to RAM and then sent but rather get directly piped to the client).  
An example file called `test.html` is included, you can try modifying it if you want to (just remember to restart the server to see the changes).  
If you need any help, feel free to [join my Discord server](https://sv443.net/discord) and I will gladly help you out.  
You can find more information by looking at the [`index.js`](./index.js) file.  