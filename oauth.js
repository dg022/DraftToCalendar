window.onload = function () {
  var query = { active: true, currentWindow: true };
  function callback(tabs) {
    var currentTab = tabs[0]; // there will be only one in this array
    console.log(currentTab); // also has properties like currentTab.id
    if (!currentTab.url.includes("https://draftmyschedule.uwo.ca/secure/")) {
      document.getElementById("but").disabled = true;
      document.getElementById("but").style["background-color"] = "#cccccc";
      document.getElementById("message").innerHTML =
        "You're not on draftMySchedule! Go to draftMySchedule to use this extension!";
    }
  }
  chrome.tabs.query(query, callback);

  document.querySelector("button").addEventListener("click", function () {
    // chrome.tabs.query({}, (tabs) => {
    //   tabs.forEach((tab) => {
    //     chrome.tabs.sendMessage(tab.id, "hey");
    //   });
    // });
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, "");
      });
    });

    //createCalender();
  });

  const createCalender = (events) => {
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
                createCalender(events);
              }
            );
          } else if (response.status == 403) {
            document.getElementById("message").innerHTML =
              "I ran out of google api requests :(  Consider supporting the project so I can get more!";
            document.getElementById("message").style.color = "red";
          } else if (response.status !== 200) {
            document.getElementById("message").innerHTML =
              "Unknown error has occured, please refresh page and try again.";
            document.getElementById("message").style.color = "red";
          }
          return response.json();
        })
        .then(function (data) {
          if (data.id !== undefined) {
            sendEvents(events, data.id);
          }
        });
    });
  };
  // var date = new Date();
  // console.log(nextWeekdayDate(date, 5)); // Outputs the date next Friday after today.

  const deleteCalender = (id) => {
    if (id && id.length !== 0) {
      chrome.identity.getAuthToken({ interactive: true }, function (token) {
        let init = {
          method: "DELETE",
          async: true,
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
          contentType: "json",
        };
        fetch(
          "https://www.googleapis.com/calendar/v3/calendars/" + id,
          init
        ).then(function (data) {
          console.log(data);
        });
      });
    }
  };

  const sendEvents = (events, id) => {
    let wasError = false;
    let responseError = "";
    if (events === "err") {
      document.getElementById("message").innerHTML =
        "Empty calender / Can't find any schedule data!";
      document.getElementById("message").style.color = "red";
      deleteCalender(id);
    } else {
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
            "https://www.googleapis.com/calendar/v3/calendars/" +
              id +
              "/events",
            init
          )
            .then((response) => {
              if (response.status == 403) {
                responseError =
                  "I ran out of google api requests :(  Consider supporting the project so I can get more!";
              } else if (!response.ok) {
                wasError = true;
              }

              return response.json();
            })
            .then(function (data) {
              console.log(data);
            });
        });
      });

      if (responseError !== "") {
        document.getElementById("message").innerHTML =
          "I ran out of google api requests :(  Consider supporting the project so I can get more!";
        document.getElementById("message").style.color = "red";
      } else if (wasError) {
        document.getElementById("message").innerHTML =
          "There was an error adding the events to your calender";
        document.getElementById("message").style.color = "red";
        deleteCalender(id);
      } else {
        document.getElementById("message").innerHTML =
          "Calender sucessfully added :)";
        document.getElementById("message").style.color = "green";
      }
    }
  };

  chrome.runtime.onMessage.addListener(function (
    message,
    sender,
    sendResponse
  ) {
    createCalender(message.data);
    sendResponse({
      data: message,
    });
  });
};
