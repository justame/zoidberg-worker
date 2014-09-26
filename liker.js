phantom.casperPath = './node_modules/casperjs/';
phantom.injectJs(phantom.casperPath + '/bin/bootstrap.js');

var casper = require('casper').create({
  verbose: true,
  logLevel: 'info',
  pageSettings: {
    loadImages: false, // The WebPage instance used by Casper will
    loadPlugins: false, // use these settings
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0.1229.94 Safari/537.4',
    engine: 'slimerjs'
  },
  viewportSize: {
    width: 1504,
    height: 600
  },
  verbose: true   

});

var timeouts = {
    defaultTime: 5000,
    login: 8000
  }
  // print out all the messages in the headless browser context
casper.on('remote.message', function(msg) {
  this.echo('remote message caught: ' + msg);
});

// print out all the messages in the headless browser context
casper.on("page.error", function(msg, trace) {
  this.echo("Page Error: " + msg, "ERROR");
});

var url = 'https://www.okcupid.com/login';
// var url = 'http://www.ynet.co.il/home/0,7340,L-2,00.html';
// var url = 'http://www.wix.com';

casper.start(url, function() {
  // search for 'casperjs' from google form
  console.log("page loaded");
  if (this.exists('form#loginbox_form')) {
    this.echo('login form found');
  }
  console.log('filling form');
  this.fill('form#loginbox_form', {
    username: 'justame@gmail.com',
    password: 'nirvana123'
  }, true);
});

casper.wait(timeouts.login, function() {
  casper.thenEvaluate(function() {
    console.log("Page Title " + document.title);
  });
}).
then(function() {
  console.log('click on browse users');
  this.click('#nav_matches > a');
}).then(function(){
  // this.viewport(1524, 5068);
}).
then(function(){
  this.scrollToBottom()
})
.then(function() {
  this.wait(timeouts.defaultTime, function() {
    casper.thenEvaluate(function() {

      console.log("Page Title " + document.title);
      var users = {};
      var scrollInterval = setInterval(function() {
        console.log('scrolling down');
        console.log('window.document.body.scrollTop=' + window.document.body.scrollTop);
        console.log('document.body.scrollHeight=' + document.body.scrollHeight);
        window.scrollTo(0,99999);
        window.document.body.scrollTop = document.body.scrollHeight;
        var unlikedUsersButtons = jQuery('button.binary_rating_button.like:not(.liked)');
        unlikedUsersButtons.each(function(index, elm){
          var id = jQuery(elm).attr('data-tuid');
          users[id] = true;
        })
      }, 2000);


      setTimeout(function() {
        clearInterval(scrollInterval);
        // jQuery.post('http://localhost:3000/api/like_tracks.json',{like_track: {user_id: 2}})
        console.log('getting unliked users count');
        var unlikedUsersButtons = document.querySelectorAll('button.binary_rating_button.like:not(.liked)');
        console.log(_.keys(users).length + ' users found');
      }, (2000 * 4));
    });
  })
}).then(function(){
  this.wait(2000 * 5, function() {
  });
})




casper.run();
phantom.exit();