window.onload = function() {
    document.querySelector('button').addEventListener('click', function() {

        chrome.tabs.query({}, tabs => {
            tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, 'hey');
          });
        });
        chrome.identity.getAuthToken({interactive: true}, function(token) {
          let init = {
            method: 'POST',
            async: true,
            headers: {
              Authorization: 'Bearer ' + token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              summary: "2021-2022 Academic Year"
            }),
            'contentType': 'json'
          };
          fetch(
              'https://www.googleapis.com/calendar/v3/calendars',
              init)
              .then((response) => response.json())
              .then(function(data) {

                console.log(data); 
              });
        });

    });


    
           
    // var date = new Date();
    // console.log(nextWeekdayDate(date, 5)); // Outputs the date next Friday after today.

    const nextWeekdayDate = (date, day_in_week) => {

      var ret = new Date(date||new Date());
      ret.setDate(ret.getDate() + (day_in_week - 1 - ret.getDay() + 7) % 7 + 1);
      return ret;


    }

    const sendEvents = ()=>{
      chrome.identity.getAuthToken({interactive: true}, function(token) {
        let init = {
          method: 'POST',
          async: true,
          headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body:{
              "summary": 'This worked'
          },
          'contentType': 'json'
        };
        fetch(
            'https://www.googleapis.com/calendar/v3/users/me/calendarList',
            init)
            .then((response) => response.json())
            .then(function(data) {

              return data; 
            });
      });
    }

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        var ten = 100
         //sendEvents();
        sendResponse({
            data: message
        }); 
    });
  };
