const fs = require('fs');
const express = require("express");
const app = express();
const handlebars = require("express-handlebars");
const https = require('https');
const PORT = 3000;
var server = https.createServer({
    key: fs.readFileSync('/etc/letsencrypt/live/softcodersteam.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/softcodersteam.com/fullchain.pem')
}, app).listen(PORT, function(){
    console.log("My HTTPS server listening on port " + PORT + "...");
});
var io = require('socket.io')(server);

//To holding users information 
const socketsStatus = {};

//config and set handlebars to express
const customHandlebars = handlebars.create({ layoutsDir: "./views" });

app.engine("handlebars", customHandlebars.engine);
app.set("view engine", "handlebars");

//enable user access to public folder 
app.use("/files", express.static("public"));

app.get("/" , (req , res)=>{
    res.render("index");
});

io.on("connection", function (socket) {
    const socketId = socket.id;
    socketsStatus[socket.id] = {};


    console.log("connect");

    socket.on("voice", function (data) {

        var newData = data.split(";");
        newData[0] = "data:audio/ogg;";
        newData = newData[0] + newData[1];

        for (const id in socketsStatus) {

        if (id != socketId && !socketsStatus[id].mute && socketsStatus[id].online)
            socket.broadcast.to(id).emit("send", newData);
        }

    });

    socket.on("userInformation", function (data) {
        socketsStatus[socketId] = data;

        io.sockets.emit("usersUpdate",socketsStatus);
    });


    socket.on("disconnect", function () {
        delete socketsStatus[socketId];
    });
});

/*http.listen(3000, () => {
  console.log("the app is run in port 3000!");
});*/