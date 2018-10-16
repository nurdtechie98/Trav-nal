var express = require('express');
var router = express.Router();

//get location
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var app = require('http').createServer();
var io = require('socket.io')(app);
app.listen(3001);

router.get('/', function(req, res, next) {
  res.render('index');
});

function checkSignIn(req, res,next){
  if(req.session.user){
     console.log("logged in");
     next();     //If session exists, proceed to page
  } else {
     console.log(req.session.user);
     res.redirect("/");  //Error, trying to access unauthorized page!
  }
}

router.get('/profile/:name', function(req, res, next) {

  var name = req.params.name;
  var db = req.db;
  var collection = db.collection('user');
  var query = {"username": name};
  collection.find(query).then(function(test){
    console.log(test);
    var location=test[0].city;  //location needed----------------
    var noposts=test[0].posts; //no of posts-------------
    var nofollowing=test[0].following; //counting the number of people following this profile
    var nofollower=test[0].follower; //coungting the number of people this profile follows
    var postsdetails=[{post:"hello",class:"item--medium"},{post:"raj",class:"item--medium"},{post:"how",class:"item--full"},{post:"are",class:"item-medium"},{post:"you",class:"item--large"},{post:"Aniket",class:"item--large"}]; //array should return posts ka data here
    var profileimage ="https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-0.3.5&q=85&fm=jpg&crop=entropy&cs=srgb&ixid=eyJhcHBfaWQiOjE0NTg5fQ&s=b38c22a46932485790a3f52c61fcbe5a";
    return {name:name,location:location,noposts:noposts,nofollowing:nofollowing,nofollower:nofollower,posts:postsdetails,timelinename:"/timeline/"+name,feedname:"/feed",profileimage:profileimage};
  }).then(data=>{
    res.render('profile',data);
  }).catch(err=>res.status(500).send('Error happened!!'));
});

router.get('/create',checkSignIn,function(req, res,next) {
  var username=req.session.user;
  //collection.insert(user);
  res.render('create',{username:username});
});

router.post('/create',function(req, res,next) {
  var username=req.session.user;
  var db = req.db;
  var collection = db.collection('user');
  var query = {"username": username};
  collection.find(query,{}).then(function(test){
    var password=test[0].password;
    var email=test[0].email;
    var user={username:username,
              password:password,
              email:email,
              bio:req.body.bio,
              website:req.body.website,
              phone:req.body.phone,
              name:req.body.mane,
              birthdate:req.body.birthday,
              city:req.body.home_city,
              follower:'0',
              following:'0',
              posts:'0'
            };
    collection.update({username:username},user);
  });
  
  res.redirect("/profile/"+username);
});

router.get('/feed',checkSignIn,function(req, res) {
  var name=req.session.user;
  var postsdetails=[{post:"hello",class:"item--medium"},{post:"raj",class:"item--medium"},{post:"how",class:"item--full"},{post:"are",class:"item-medium"},{post:"you",class:"item--large"},{post:"Aniket",class:"item--large"}];  
  res.render('feed',{name:name,timelinename:"/timeline/"+name,feedname:"/feed",profilename:"/profile/"+name,"posts":postsdetails});
});


router.get('/trip/:name/:postname', function(req, res, next) {
  var name=req.params.name;
  var postname=req.params.postname;
   io.sockets.on('connection',function(socket)
  {
    
    socket.on('for_server',function( latitude, longitude){
      console.log("in server");
      
      var lat = parseFloat(latitude);  //store the lat and lon in database
      var lon = parseFloat(longitude);
      //console.log(`ll is: ${lat}`);
      displayLocation(lat,lon);   
     // console.log(`location is : ${location}`); //store the location in database
    })
  function displayLocation(latitude,longitude){
          var request = new XMLHttpRequest();
  
          var method = 'GET';
          var url = 'https://www.geocode.farm/v3/json/reverse/?lat='+latitude+'&lon='+longitude;
          var async = true;
          //console.log("hello from function1");
          request.open(method, url, async);
         // console.log("hello from function2");
          request.send();
          request.onreadystatechange = function(){
            //console.log("hello from function3");
            if(request.readyState == 4 && request.status == 200)
            {
                var data = JSON.parse(request.responseText);
                
                //save the city (locality) on database
                socket.emit('for_client',  data.geocoding_results.RESULTS[0].ADDRESS.locality);
               
          };
        };
      }
    });

  res.render('timeline',{profilename:"/profile/"+name,feedname:"/feed/"});  //idhar link change karna hai dyanmic bana hai!

});

router.post('/signup', function(req, res){
  var un=req.body.username;
  var pw=req.body.password;
  var cpw=req.body.cpassword;
  var em=req.body.email;
  console.log(un+" "+pw);
  if(cpw==pw){
    var db = req.db;
    var collection = db.collection('user');
    var user={username:un,password:pw,email:em,bio:"",city:"",website:"",phone:"",name:"",birthdate:""};
    collection.insert(user);
    req.session.user=un;
    res.redirect("/create");
  }
  else
  res.redirect("/");
});

router.post('/login', function(req, res){
  var un=req.body.username;
  var pw=req.body.password;
  console.log(String(un)+" "+pw);
  var db = req.db;
  var collection = db.collection('user');
  var query = { $and:[{"username": un},{"password":pw}]};
  collection.count(query).then(function(count){
    if(count==1)
    {
      req.session.user=un;
      res.redirect("/feed/");
    }
    else
    res.redirect("/");
  });
});

router.get('/logout', function(req, res){
  req.session.destroy(function(){
    console.log("user logged out.")
  });
  res.redirect("/");
});

module.exports = router;
