var express = require("express")


app = express()


app.get("/", function(req, res){
    console.log("We got one!!")
    res.end("Hello frm the other side!!!")
});


app.listen(1090)