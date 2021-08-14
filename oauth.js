window.onload = function () {
  document.querySelector("button").addEventListener("click", function () {
    // chrome.tabs.query({}, (tabs) => {
    //   tabs.forEach((tab) => {
    //     chrome.tabs.sendMessage(tab.id, "hey");
    //   });
    // });
    createCalender();
  });

  const createCalender = () => {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      let init = {
        method: "POST",
        async: true,
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: "2021-2022 Academic Year",
        }),
        contentType: "json",
      };
      fetch("https://www.googleapis.com/calendar/v3/calendars", init)
        .then((response) => {
          console.log(response);
          if (response.status == 401) {
            console.log("the response was 401");
            chrome.identity.removeCachedAuthToken(
              { token: token },
              function () {
                // This forces a rerun of the funciton
                createCalender();
              }
            );
          }
          return response.json();
        })
        .then(function (data) {
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
              chrome.tabs.sendMessage(tab.id, data.id);
            });
          });
        });
    });
  };
  // var date = new Date();
  // console.log(nextWeekdayDate(date, 5)); // Outputs the date next Friday after today.

  //

  const sendEvents = (events, id) => {
    let wasError = false;
    events.forEach((e) => {
      chrome.identity.getAuthToken({ interactive: true }, function (token) {
        let init = {
          method: "POST",
          async: true,
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(e),
          contentType: "json",
        };
        fetch(
          "https://www.googleapis.com/calendar/v3/calendars/" + id + "/events",
          init
        )
          .then((response) => {
            if (!response.ok) {
              wasError = true;
            }

            return response.json();
          })
          .then(function (data) {
            console.log(data);
          });
      });
    });

    if (wasError) {
      document.getElementById("message").innerHTML =
        "There was an error adding the events to your calender";
      document.getElementById("message").style.color = "red";
    } else {
      document.getElementById("message").innerHTML =
        "Calender sucessfully added :)";
      document.getElementById("message").style.color = "green";
    }
  };

  chrome.runtime.onMessage.addListener(function (
    message,
    sender,
    sendResponse
  ) {
    sendEvents(message.data, message.id);
    sendResponse({
      data: message,
    });
  });
};
