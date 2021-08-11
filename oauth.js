window.onload = function () {
  document.querySelector("button").addEventListener("click", function () {
    // chrome.tabs.query({}, (tabs) => {
    //   tabs.forEach((tab) => {
    //     chrome.tabs.sendMessage(tab.id, "hey");
    //   });
    // });
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
          if (!response.ok) {
            console.log("this was an error");
            document.querySelector("button").innerHTML =
              "Sadly there was an error :(";
            throw Error(response.statusText);
          }
          response.json();
        })
        .then(function (data) {
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
              deleteCalender(data.id)
              break;
              //chrome.tabs.sendMessage(tab.id, data.id);
            });
          });
        });
    });
  });



  const deleteCalender = (id) =>{
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
        "https://www.googleapis.com/calendar/v3/calendars/"+id,
        init
      )
        .then((response) => {
          if(!response.ok){
            //Handle error
          }
        })
        .then(function (data) {});
    });
  }


  const sendEvents = (events, id) => {
    var wasError = false;
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
            if(!response.ok){
              wasError = true; 
              break;
            }
          })
          .then(function (data) {});
      });
    });

    if(wasError){
      //If there was an error creating the events for the calender, you want to delete the calender that you created previously. 
      document.querySelector("button").innerHTML =
      "Calender creation failed, refresh page";


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
