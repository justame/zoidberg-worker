phantom.casperPath = './node_modules/casperjs/';
phantom.injectJs(phantom.casperPath + '/bin/bootstrap.js');

var system = require('system');
var fs = require('fs');
var x = require('casper').selectXPath;
var payloadIndex = -1;

console.log('system.args');
system.args.forEach(function(arg) {
  console.log(arg);
});

var payload = JSON.parse(fs.read('/mnt/task/task_payload.json'));

process.argv.forEach(function(val, index, array) {
  if (val == "-payload") payloadIndex = index + 1;
});

// var payload = {};
// payload.username = "justame@gmail.com";
// payload.password = "nirvana123";
// payload.jobId = 38;
// payload.taskId = 46;
// payload.websiteId = 1;
// payload.token = '439839205gkljdklgj$2121dsjkgjfdklgj';
// payload.loginUrl = 'https://www.okcupid.com/login';
// payload.quantity = 5;
// payload.apiHost = 'http://localhost:3000';

Object.keys(payload).forEach(function(key) {
  console.log(key + ': ' + payload[key]);
});

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
console.log('payload.quantity :' + payload.quantity);
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
  this.evaluate(function likeAutomated(quantity, payload) {
    var users = {};
    var likeInProgress = false;

    function scrollDown() {
      console.log('scrolling down');
      console.log('window.document.body.scrollTop=' + window.document.body.scrollTop);
      console.log('document.body.scrollHeight=' + document.body.scrollHeight);
      window.document.body.scrollTop = document.body.scrollHeight;
      window.scrollTo(0, 99999);
    };

    function getUnlikedUsers() {
      console.log('getUnlikedUsers');

      var unlikedUsersButtons = jQuery('button.binary_rating_button.like:not(.liked):not(.marked)');

      var filteredUsersList = unlikedUsersButtons.filter(function(index) {
        var userId = jQuery(this).data().tuid;
        if (!users[userId]) {
          return true;
        }
      });

      return filteredUsersList;
    };

    function likeUser(likeButton, index) {
      console.log('likeUser');
      jQuery(likeButton).click();
      jQuery(likeButton).addClass('marked');
      // jQuery(likeButton).closest('.match_card_wrapper').css('border', 'solid 3px red');
      var userData = extractUserData(jQuery(likeButton));
      users[userData.userId] = userData;
      sendUserLikeToServer(userData);
    };

    function likeAvaliableUsers(timePerLike, onDone) {
      console.log('likeAvaliableUsers');
      likeInProgress = true;
      var usersToLike = getUnlikedUsers();
      console.log('user to like :' + usersToLike.length);

      usersToLike.each(function(index, likeButton) {
        setTimeout(function() {
          if (Object.keys(users).length < quantity) {
            likeUser(likeButton, index);
          }
          if (usersToLike.length == index + 1) {
            likeInProgress = false;
            onDone()
          }
        }, index * 2000);
      });
      if (usersToLike.length == 0) {
        likeInProgress = false;
      }
    };

    function sendUserLikeToServer(userData) {
      console.log('sendUserLikeToServer');
      jQuery.post(payload.apiHost + '/api/like_tracks.json',{
        token: payload.token,
        website_id: payload.websiteId,
        external_unique_id: userData.userId,
        name: userData.userName,
        main_image_url: userData.mainImageUrl,
        user_id: payload.userId,
        job_id: payload.jobId,
        task_id: payload.taskId
      }, function(){
        console.log('sent to server userData');
      })
    };

    function extractUserData(likeButton) {
      var wrapperElement = likeButton.closest('.match_card_wrapper');
      var linkNameElement = wrapperElement.find('a.name');
      var imageWrapperElement = wrapperElement.find('.image_wrapper');

      var userId = likeButton.data().tuid;
      var userName = linkNameElement.text().trim();
      var mainImageUrl = imageWrapperElement.data().imageUrl;

      return {
        userId: userId,
        userName: userName,
        mainImageUrl: mainImageUrl
      }
    };

    function isAllUsersLiked() {
      console.log('isAllUsersLiked');

      if (Object.keys(users).length >= quantity) {
        return true;
      } else {
        return false;
      }
    };

    function onLikeComplete() {
      console.log('~~~~~~~~~~~ complete likes ~~~~~~~~~~~');
      console.log('users count :' + Object.keys(users).length);
      jQuery('<div>').attr('id', 'zoidberg-complete').appendTo('body');
    };

    var timeToWaitPerClick = 2500;
    var timeToCheckIfLikesDone = 5000;

    var timer = setInterval(function() {
      console.log('likeInProgress: ' + likeInProgress);
      console.log('isAllUsersLiked(): ' + isAllUsersLiked());
      console.log('liked users count : ' + Object.keys(users).length);

      if (!isAllUsersLiked() && likeInProgress == false) {
        likeAvaliableUsers(timeToWaitPerClick, function() {
          scrollDown();
        });
      } else {
        if (isAllUsersLiked()) {
          onLikeComplete();
          clearTimeout(timer);
        }
      }
    }, timeToCheckIfLikesDone);

    likeAvaliableUsers(timeToWaitPerClick, function() {
      scrollDown();
    });
  }, payload.quantity, payload);
}).
waitForSelector('#zoidberg-complete', function() {
  console.log('worker finished successfully');
})

casper.run(function() {
  phantom.exit();
});
setTimeout(function() {
  phantom.exit();
}, 1000 * 60 * 30);
// phantom.exit();