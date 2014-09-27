// phantom.casperPath = './node_modules/casperjs/';
// phantom.injectJs(phantom.casperPath + '/bin/bootstrap.js');
var x = require('casper').selectXPath;
// var payloadIndex = -1;
// process.argv.forEach(function(val, index, array) {
//   if (val == "-payload") payloadIndex = index + 1;
// });
// var payload = JSON.parse(fs.readFileSync(process.argv[payloadIndex]));

var payload = {};
payload.username = "justame@gmail.com";
payload.password = "nirvana123";
// payload.jobId = "1"
// payload.taskId
// payload.websiteId
payload.loginUrl = 'https://www.okcupid.com/login';
payload.quantity = 20;


console.log("payload:", payload);

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
  login: 8000,
  likeTimePerUser: 4000
};
// print out all the messages in the headless browser context
casper.on('remote.message', function(msg) {
  this.echo('remote message caught: ' + msg);
});

casper.on('page.error', function(msg, trace) {
  this.echo('Error: ' + msg, 'ERROR');
  for (var i = 0; i < trace.length; i++) {
    var step = trace[i];
    this.echo('   ' + step.file + ' (line ' + step.line + ')', 'ERROR');
  }
});
console.log('payload.quantity :' + payload.quantity)
// var url = 'https://www.okcupid.com/login';
var url = payload.loginUrl;

casper.start(url, function() {
  console.log("page loaded");
});
casper.options.waitTimeout = 1000 * 60 * 60;

casper.waitForSelector("form#loginbox_form input[name='username']", function() {
  console.log('filling form');
  this.fill('form#loginbox_form', {
    username: payload.username,
    password: payload.password
  }, true);
});

casper.waitForSelector('#nav_matches > a', function() {
  this.click('#nav_matches > a');
});

casper.waitForSelector('#submit_button', function() {
  console.log('Browsr matches page');
  casper.thenEvaluate(function() {
    console.log("Page Title " + document.title);
  });
}).
then(function() {
  console.log('scroll to bottom');
  this.scrollToBottom();
}).
then(function() {
  this.evaluate(function(quantity) {
    var users = {};

    function scrollDown() {
      console.log('scrolling down');
      console.log('window.document.body.scrollTop=' + window.document.body.scrollTop);
      console.log('document.body.scrollHeight=' + document.body.scrollHeight);
      window.document.body.scrollTop = document.body.scrollHeight;
      window.scrollTo(0, 99999);
    }
    console.log(quantity)
    for (var i = 0; i < Math.ceil(quantity / 6); i++) {
      scrollDown();
      setTimeout(scrollDown, i * 2000);
    }
  }, payload.quantity)
}).
waitFor(function checkIfEnoughUsers() {
  return this.evaluate(function(quantity) {
    var unlikedUsersButtons = document.querySelectorAll('button.binary_rating_button.like:not(.liked)');
    return unlikedUsersButtons.length >= quantity
  }, payload.quantity);
}, function() {}, function() {}, payload.quantity * 2000).
thenEvaluate(function() {
  var users = {};
  var unlikedUsersButtons = document.querySelectorAll('button.binary_rating_button.like:not(.liked)');
  console.log(_.keys(users).length + ' users found');
})



casper.run();
// phantom.exit();