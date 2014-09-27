function likeAutomated(quantity) {
  var users = {};
  window.users = users;
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
    // jQuery(likeButton).click();
    jQuery(likeButton).addClass('marked');
    jQuery(likeButton).closest('.match_card_wrapper').css('border', 'solid 3px red');
    var userData = extractUserData(jQuery(likeButton));
    users[userData.userId] = userData;
    sendUserLikeToServer(userData);
  };

  function likeAvaliableUsers(timePerLike, onDone) {
    console.log('likeAvaliableUsers');
    likeInProgress = true;
    var usersToLike = getUnlikedUsers();
    console.log('user to like :' +  usersToLike.length);

    usersToLike.each(function(index, likeButton) {
      setTimeout(function() {
        if(Object.keys(users).length < quantity){
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
    
    setTimeout(function() {
      console.log('sent to server userData');
    }, 1000);
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
  
  function onLikeComplete(){
    console.log('~~~~~~~~~~~ complete likes ~~~~~~~~~~~');
    console.log('users count :' + Object.keys(users).length);
  };

  var timeToWaitPerClick = 2000;
  var timeToCheckIfLikesDone = 3000;

  var timer = setInterval(function() {
    console.log('likeInProgress: '+ likeInProgress);
    console.log('isAllUsersLiked(): '+ isAllUsersLiked());
    console.log('liked users count : '+ Object.keys(users).length);

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
}