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

router.get('/profile/:name',checkSignIn,function(req, res, next) {

  var name = req.params.name;
  var db = req.db;
  var collection = db.collection('user');
  var collection2 = db.collection('trip');
  var query = {"username": name};
  var show=0;
  var followed=0;
  if(name==req.session.user)
  show=1;
  collection.find(query).then(function(test){
    //console.log(test);
    if(show==0 && req.session.user!=""){
      if(test[0].followers.includes(req.session.user)){
        console.log(test[0].followers," ",req.session.user);
        followed=1;
      } 
    }
    var location=test[0].city;  //location needed----------------
    var noposts=test[0].no_posts; //no of posts-------------
    var nofollowing=test[0].no_following; //counting the number of people following this profile
    var nofollower=test[0].no_follower; //coungting the number of people this profile follows
    var postsclass=["item--medium","item--full","item--large"]; //array should return posts ka data here
    var profileimage ="https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-0.3.5&q=85&fm=jpg&crop=entropy&cs=srgb&ixid=eyJhcHBfaWQiOjE0NTg5fQ&s=b38c22a46932485790a3f52c61fcbe5a";
    return {name:name,profile:"/profile/"+req.session.user,location:location,noposts:noposts,nofollowing:nofollowing,nofollower:nofollower,postsclass:postsclass,timelinename:"/timeline/"+name,feedname:"/feed",profileimage:profileimage,show:show,followed:followed};
  }).then((param)=>{
    var par=param;
    var postsdetails=[];
    collection2.find(query).then(function(data){
      for(var i=0;i<data.length;i++){
        var post=data[i];
        var t=Math.random()*1000;
        //console.log("$$$$$$$"+data[i].idt);
        post.class=par.postsclass[(parseInt(t)%3)];
        postsdetails.push(post);
      }
      //console.log(postsdetails);
      par.posts=postsdetails;
      res.render('profile',par);
    });
  }).catch(err=>res.status(500).send('Error happened!!'));
});

router.get('/create',checkSignIn,function(req, res,next) {
  var username=req.session.user;
  //collection.insert(user);
  res.render('create',{username:username});
});

router.get('/follow/:name',checkSignIn,function(req,res,next){
  var follower=req.session.user;
  var following=req.params.name;
  var db = req.db;
  var collection = db.collection('user');
  var query = {"username": follower};
  collection.find(query,{}).then(function(test){
    console.log(test[0]);
    test[0].no_following=test[0].no_following+1;
    test[0].following.push(following);
    collection.update(query,test[0]);
  }).then(()=>{
  var query = {"username": following};
  collection.find(query,{}).then(function(test){
    test[0].no_follower=test[0].no_follower+1;
    test[0].followers.push(follower);
    //console.log(test[0]);
    collection.update(query,test[0]);
  }).then(()=>{
  res.redirect("/profile/"+following);
  });
});
});
router.post('/create',function(req, res,next) {
  var username=req.session.user;
  var db = req.db;
  var collection = db.collection('user');
  var query = {"username": username};
  collection.find(query,{}).then(function(test){
    var password=test[0].password;
    var email=test[0].email;
    var user={
              username:username,
              password:password,
              email:email,
              bio:req.body.bio,
              website:req.body.website,
              phone:req.body.phone,
              name:req.body.mane,
              birthdate:req.body.birthday,
              city:req.body.home_city,
              no_follower:0,
              no_following:0,
              no_posts:0,
              followers:[],
              following:[username],
              feeds:[],
              posts:[]
            };
    collection.update({username:username},user);
  });
  
  res.redirect("/profile/"+username);
});

router.get('/feed',checkSignIn,function(req, res) {
  var name=req.session.user;
  var postsdetails=[];
  var name=req.session.user;
  var db = req.db;
  var postsdetails=[];
  var postsclass=["item--medium","item--full","item--large"];
  var collection = db.collection('trip');
  var query = {$text:{$search:name}};
  collection.find(query).then((data)=>{
    for(var i=0;i<data.length;i++){
      var post=data[i];

      var t=Math.random()*1000;
      //console.log("$$$$$$$"+data[i].idt);
      post.class=postsclass[(parseInt(t)%3)];
      postsdetails.push(post);
      console.log(post);
    }
    //console.log(postsdetails);
    //par.posts=postsdetails;
    res.render('feed',{name:name,timelinename:"/timeline/"+name,feedname:"/feed",profilename:"/profile/"+name,"posts":postsdetails})
  });
});

router.post('/search/',checkSignIn,function(req, res) {
  var name=req.session.user;
  var postsdetails=[];
  //var name=req.session.user;
  var db = req.db;
  var postsdetails=[];
  var postsclass=["item--medium","item--full","item--large"];
  var collection = db.collection('trip');
  var query = {$text:{$search:req.body.search_value}};
  collection.find(query).then((data)=>{
    for(var i=0;i<data.length;i++){
      var post=data[i];

      var t=Math.random()*1000;
      //console.log("$$$$$$$"+data[i].idt);
      post.class=postsclass[(parseInt(t)%3)];
      postsdetails.push(post);
      console.log(post);
    }
    //console.log(postsdetails);
    //par.posts=postsdetails;
    res.render('feed',{name:name,timelinename:"/timeline/"+name,feedname:"/feed",profilename:"/profile/"+name,"posts":postsdetails})
  });
});


router.get('/trip/:name/:postname', function(req, res, next) {
  var name=req.params.name;
  var id=req.params.postname;
  var db = req.db;
  var collection = db.collection('trip');
  var query = {"idt": parseInt(id)};
  console.log(id);
  collection.find(query,{}).then(function(test){
    console.log(test);
    var places=test[0].place;
    var username=test[0].username;
    var title=test[0].tripname;
    var showi=0;
    if(req.session.user==name)
    showi=1;
    else
    showi=0;
    console.log(places);
    res.render('timeline',{profilename:"/profile/"+name,feedname:"/feed/",places:places,show:showi,username:username,title:title,url:"/addplace/"+name+"/"+id});  //idhar link change karna hai dyanmic bana hai!
  });
});

router.post('/addplace/:name/:postname',checkSignIn,function(req, res, next) {
  var name=req.session.user;
  var id=req.params.postname;
  var db = req.db;
  var date=new Date();
  var latlong=""
  io.sockets.on('connection',function(socket){
    socket.on('for_server',function( latitude, longitude){
      console.log("in server");
      var lat = parseFloat(latitude);  //store the lat and lon in database
      var lon = parseFloat(longitude);
      //latlong.push(lat);
      //latlong.push(long);
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
        //latlong.push(data.geocoding_results.RESULTS[0].ADDRESS.locality); 
        socket.emit('for_client',data.geocoding_results.RESULTS[0].ADDRESS.locality);
      };
    };
  }
  });
  var location={
    name:req.body.title,
    description:req.body.description,
    time:date.toString(),
    latlong:req.body.latlong
  }
  var collection = db.collection('trip');
  var query = {"idt": parseInt(id)};
  collection.find(query,{}).then(function(test){
    console.log(test);
    test[0].place.push(location)
    //console.log(places);
    //test[0].place=[];
    collection.update(query,test[0]);
    res.redirect("/trip/"+name+"/"+id);
  });
});

router.get('/new-trip',checkSignIn,function(req, res, next) {
  var name=req.session.user;
  res.render('new-trip',{profilename:"/profile/"+name,feedname:"/feed/",name:name});  //idhar link change karna hai dyanmic bana hai!
});

router.post('/new-trip',checkSignIn,function(req, res, next) {
  var name=req.session.user;
  var tripname=req.body.tripname;
  var date=req.body.date;
  var description=req.body.description;
  var db = req.db;
  var user;
  var collection = db.collection('trip');
  collection.count().then(function(count){
    var idt=count+1;
    var trip={username:name,idt:idt,tripname:tripname,date:date,decription:description,place:[],feeder:""};
    console.log(trip);
    collection.insert(trip);
    var collection2 = db.collection('user');
    var query2 = {"username":name};
    collection2.find(query2,{}).then(function(user){
      console.log("^^^^^^^^^^^^^^",user[0]);
      user[0].no_posts=user[0].no_posts+1;
      user[0].posts.push(idt);
      collection2.update(query2,user[0]);
      user=user[0];
      console.log(user.followers,"&&&&&&&&&&&&&");
      for(var i=0;i<user.followers.length;i++)
      {
        console.log("*********** ");
        trip.feeder+=(" "+user.followers[i]);
      }
      collection.update({"idt":idt},trip).then(function(){
        res.redirect("trip/"+name+"/"+idt);
      });
    });
  });
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
