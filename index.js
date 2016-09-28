var express = require("express");
var app = express();

var fs = require("fs");

var multer = require("multer");
var upload = multer({dest: "./uploads"});

var mongoose = require("mongoose");

mongoose.connect("mongodb://mheevun:425543@ds021356.mlab.com:21356/shopping");
var conn = mongoose.connection;

var gfs;

var Grid = require("gridfs-stream");
Grid.mongo = mongoose.mongo;

var shortid = require('shortid');



conn.once("open", function(){
  gfs = Grid(conn.db);
  app.get("/", function(req,res){
    //renders a multipart/form-data form
    res.render("home");
  });

  //second parameter is multer middleware.
  app.post("/", upload.single("avatar"), function(req, res, next){
    //create a gridfs-stream into which we pipe multer's temporary file saved in uploads. After which we delete multer's temp file.
	var fileid = shortid.generate();
    var writestream = gfs.createWriteStream({
		filename: fileid
      //filename: req.file.originalname
    });
    //
    // //pipe multer's temp file /uploads/filename into the stream we created above. On end deletes the temporary file.
    fs.createReadStream("./uploads/" + req.file.filename)
      .on("end", function(){
		  fs.unlink("./uploads/"+ req.file.filename, function(err){
			  	//res.location(fileid)
				//res.sendStatus(201)
				res.statusCode = 201;
				res.json({
					objectId: fileid 
				});
			  })
	  })
      .on("err", function(){res.send("Error uploading image")})
	  .pipe(writestream);

  });

  // sends the image we saved by filename.
  app.get("/:filename", function(req, res){
      var readstream = gfs.createReadStream({filename: req.params.filename});
      readstream.on("error", function(err){
        res.send("No image found with that title");
      });
      readstream.pipe(res);
  });

  //delete the image
  app.get("/delete/:filename", function(req, res){
    gfs.exist({filename: req.params.filename}, function(err, found){
      if(err) return res.send("Error occured");
      if(found){
        gfs.remove({filename: req.params.filename}, function(err){
          if(err) return res.send("Error occured");
          res.send("Image deleted!");
        });
      } else{
        res.send("No image found with that title");
      }
    });
  });
});

app.set("view engine", "ejs");
app.set("views", "./views");


// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 3000;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('image-nodejs-server running on port: ' + port);
});
//if (!module.parent) {
//  app.listen(port, function() {
//    console.log('Our app is running on http://localhost:' + port);
//	});
//}
