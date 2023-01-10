var express = require("express")

app = express()
app.use('/', express.static(__dirname))
app.get("/", function(req, res){
    //console.log("We got one!!")
    
    res.sendFile("./index.html", {root: __dirname})
});


app.listen(1090)