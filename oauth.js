window.onload = function () {
  var query = { active: true, currentWindow: true };
  function callback(tabs) {
    var currentTab = tabs[0];

    if (!currentTab.url.includes("https://draftmyschedule.uwo.ca/secure/")) {
      document.getElementById("but").disabled = true;
      document.getElementById("but").style["background-color"] = "#cccccc";
      document.getElementById("message").innerHTML =
        "You're not on draftMySchedule! Go to draftMySchedule to use this extension!";
    }
  }
  chrome.tabs.query(query, callback);
  //inline-block
  document.querySelector("button").addEventListener("click", function () {
    //button should dissipear and then the loader come
    document.querySelector("button").style.display = "none";
    document.getElementById("loader").style.display = "block";
    document.getElementById("message").innerHTML =
      "Scrapping your calendar, one momment please!";
    chrome.tabs.query(
      { currentWindow: true, active: true },
      function (tabArray) {
        chrome.tabs.sendMessage(tabArray[0].id, "");
      }
    );
  });

  const createcalendar = (events) => {
    if (events === "edge") {
      document.getElementById("message").innerHTML =
        "Sorry! DraftToCalendar is unsupported for Edge";
      document.getElementById("message").style.color = "red";
      document.getElementById("loader").style.display = "none";
    } else if (events === "tabError") {
      document.getElementById("message").innerHTML =
        'Wrong tab! Go To "MY CURRENT SCHEDULE" tab and try again!';
      document.getElementById("message").style.color = "red";
      document.getElementById("loader").style.display = "none";
    } else {
      chrome.identity.getAuthToken({ interactive: true }, function (token) {
        console.log("this happened");
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
              chrome.identity.removeCachedAuthToken(
                { token: token },
                function () {
                  createcalendar(events);
                }
              );
            } else if (response.status == 403) {
              document.getElementById("message").innerHTML =
                "I ran out of google api requests OR you've made too many calenders too quickly! Come back in a bit!";
              document.getElementById("message").style.color = "red";
              document.getElementById("loader").style.display = "none";
            } else if (response.status !== 200) {
              document.getElementById("message").innerHTML =
                "Unknown error has occured, please refresh page and try again.";
              document.getElementById("message").style.color = "red";
              document.getElementById("loader").style.display = "none";
            }
            return response.json();
          })
          .then(function (data) {
            if (data.id !== undefined) {
              sendEvents(events, data.id);
            }
          });
      });
    }
  };

  const deletecalendar = (id) => {
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
      console.log(events);
      document.getElementById("message").innerHTML =
        "Empty calendar / Can't find any schedule data! Make sure you're on a tab with schedule data!";
      document.getElementById("message").style.color = "red";
      deletecalendar(id);
      document.getElementById("loader").style.display = "none";
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
                  "I ran out of google api requests OR you've made too many calenders too quickly! Come back in a bit!";
              } else if (response.status !== 200) {
                responseError = "Unknown error occured, please try again";
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
        document.getElementById("message").innerHTML = responseError;
        document.getElementById("message").style.color = "red";
        deletecalendar(id);
        document.getElementById("loader").style.display = "none";
      } else if (wasError) {
        document.getElementById("message").innerHTML =
          "There was an error adding the events to your calendar";
        document.getElementById("message").style.color = "red";
        deletecalendar(id);
        document.getElementById("loader").style.display = "none";
      } else {
        document.getElementById("message").innerHTML =
          "calendar sucessfully added :)";
        document.getElementById("message").style.color = "green";
        document.getElementById("loader").style.display = "none";
      }
    }
  };

  chrome.runtime.onMessage.addListener(function (
    message,
    sender,
    sendResponse
  ) {
    createcalendar(message.data);
    sendResponse({
      data: message,
    });
  });
};
