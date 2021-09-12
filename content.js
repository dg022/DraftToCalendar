chrome.runtime.onMessage.addListener((msgObj) => {
  if (window.navigator.userAgent.indexOf("Edg/") > -1) {
    chrome.runtime.sendMessage(
      {
        data: "edge",
      },
      function (response) {
        console.log(response);
      }
    );
  } else if (
    document.getElementsByClassName("navigation")[0] === undefined ||
    document
      .getElementsByClassName("navigation")[0]
      .getElementsByClassName("active")[0].innerText !== "My Current Schedule"
  ) {
    chrome.runtime.sendMessage(
      {
        data: "tabError",
      },
      function (response) {
        console.log(response);
      }
    );
  } else {
    var sch = scrapePage();

    chrome.runtime.sendMessage(
      {
        data: sch,
      },
      function (response) {
        console.log(response);
      }
    );
  }
});

const nextWeekdayDate = (date, day_in_week) => {
  //console.log(date, day_in_week);
  var ret = new Date(date || new Date());
  ret.setDate(ret.getDate() + ((day_in_week - 1 - ret.getDay() + 7) % 7) + 1);
  return ret;
};

//IF there is no no correspondign code, then we will assume its a full year course, i.e Z

//Wont work for law students and nursing, Ivey
const reoccurenceStrings = new Object();
//Data strucutre: Code, [start date, end date(reoccurence string)]

//0.5 course offered in first term
reoccurenceStrings["A"] = ["07-September-2021", "20211209T070000Z"];

//0.5 course offered in second term
reoccurenceStrings["B"] = ["02-January-2022", "20220402T060000Z"];

//1.0 course
reoccurenceStrings["E"] = ["07-September-2021", "20220402T060000Z"];

//0.5  essay course offered in first term
reoccurenceStrings["F"] = ["07-September-2021", "20211209T070000Z"];

//0.5 essatcourse offered in second term
reoccurenceStrings["G"] = ["02-January-2022", "20220402T060000Z"];

//Q
// Runs From: 13-September-2021 To: 25-October-2021
reoccurenceStrings["Q"] = ["12-September-2021", "20211026T060000Z"];

//R
//Runs From: 26-October-2021 To: 08-December-2021
reoccurenceStrings["R"] = ["25-October-2021", "20211209T070000Z"];

//S
//Runs From: 03-January-2022 To: 11-February-2022
reoccurenceStrings["S"] = ["02-January-2022", "20220212T070000Z"];

//T
// From: 14-February-2022 To: 01-April-2022
reoccurenceStrings["T"] = ["13-February-2022", "20220402T060000Z"];

//U
//rom: 03-January-2022 To: 01-April-2022
reoccurenceStrings["U"] = ["02-January-2022", "20220402T060000Z"];

reoccurenceStrings["X"] = ["02-January-2022", "20220402T060000Z"];

reoccurenceStrings["W"] = ["07-September-2021", "20211209T070000Z"];

reoccurenceStrings["Y"] = ["07-September-2021", "20220402T060000Z"];

reoccurenceStrings["Z"] = ["07-September-2021", "20220402T060000Z"];

const returnDateAndReoccurence = (letter) => {
  if (letter in reoccurenceStrings) {
    return reoccurenceStrings[letter];
  }

  return reoccurenceStrings["Z"];
};

const createReccurenceString = (Until, Days) => {
  return "RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=" + Days + ";UNTIL=" + Until;
};

const returnDaysString = (arr) => {
  const daysConversion = new Object();
  daysConversion["M"] = "MO";
  daysConversion["Tu"] = "TU";
  daysConversion["W"] = "WE";
  daysConversion["Th"] = "TH";
  daysConversion["F"] = "FR";
  days = [];
  for (var i = 0; i < arr.length; i++) {
    days.push(daysConversion[arr[0]]);
  }
  return days.toString();
};

const startOfTermOffset = (string) => {
  const offSet = new Object();
  offSet["08-September-2021"] = "07-September-2021";
  offSet["03-January-2022"] = "02-January-2022";
  return offSet[string];
};

const convertTo24Hour = (time) => {
  var hours = parseInt(time.substr(0, 2));
  if (time.indexOf("AM") != -1 && hours == 12) {
    time = time.replace("12", "0");
  }
  if (time.indexOf("PM") != -1 && hours < 12) {
    time = time.replace(hours, hours + 12);
  }
  return time.replace(/(AM|PM)/, "").trim();
};

var colorId = 1;

const incrermentColor = () => {
  colorId = (colorId + 1) % 11;
  if (colorId === 0) {
    colorId = 1;
  }
  return colorId;
};

const dayOfTheWeek = new Object();
dayOfTheWeek["M"] = 1;
dayOfTheWeek["Tu"] = 2;
dayOfTheWeek["W"] = 3;
dayOfTheWeek["Th"] = 4;
dayOfTheWeek["F"] = 5;

const createEventStrings = (termBeginandEnd, event, index) => {
  const date = new Object();
  date["January"] = "01";
  date["February"] = "02";
  date["March"] = "03";
  date["April"] = "04";
  date["May"] = "05";
  date["June"] = "06";
  date["July"] = "07";
  date["August"] = "08";
  date["September"] = "09";
  date["October"] = "10";
  date["November"] = "11";
  date["December"] = "12";

  var ev = [];

  for (const DateTime in date) {
    if (DateTime && termBeginandEnd[0].includes(DateTime)) {
      var proccesedTime = event["dayTimeNumber"][index][1].split(" -  ");
      if (!/\d/.test(proccesedTime[0]) || !/\d/.test(proccesedTime[1])) {
        continue;
      }
      var BeginningOfEvent = convertTo24Hour(proccesedTime[0]);
      var EndOfEvent = convertTo24Hour(proccesedTime[1]);

      //console.log(event["dayTimeNumber"], index);
      var nextDay = nextWeekdayDate(
        new Date(
          termBeginandEnd[0]
            .replace(DateTime, date[DateTime])
            .split("-")
            .reverse()
            .join("-") +
            " " +
            BeginningOfEvent.split(":")[0] +
            ":" +
            BeginningOfEvent.split(":")[1] +
            " UTC"
        ),

        dayOfTheWeek[event["dayTimeNumber"][index][0]]
      );
      var LastDay = nextWeekdayDate(
        new Date(
          termBeginandEnd[0]
            .replace(DateTime, date[DateTime])
            .split("-")
            .reverse()
            .join("-") +
            " " +
            EndOfEvent.split(":")[0] +
            ":" +
            EndOfEvent.split(":")[1] +
            " UTC"
        ),

        dayOfTheWeek[event["dayTimeNumber"][index][0]]
      );

      var startTimeString = nextDay.toISOString();

      var endTimeString = LastDay.toISOString();
      var offSet = "";
      if (
        new window.moment(startTimeString).tz("America/Toronto")._offset ===
        -240
      ) {
        offSet = "-04:00";
      } else {
        offSet = "-05:00";
      }
      var reccurString = createReccurenceString(
        termBeginandEnd[1],
        returnDaysString(event["dayTimeNumber"][index])
      );

      const eventToAdd = {
        summary:
          event["Department"] +
          " " +
          event["Course"] +
          " " +
          event["Type"] +
          " " +
          "Section:" +
          event["Section"],
        location: event["dayTimeNumber"][index][2],
        colorId: colorId,
        start: {
          dateTime: startTimeString.replace("Z", offSet),
          timeZone: "America/Toronto",
        },
        end: {
          dateTime: endTimeString.replace("Z", offSet),
          timeZone: "America/Toronto",
        },
        recurrence: [reccurString],
      };

      incrermentColor();

      ev.push(eventToAdd);
    }
  }

  return ev;
};

const getTable = () => {
  if (
    document.getElementsByClassName("table table-hover table-condensed")[0] ===
    undefined
  ) {
    return ["err", null];
  }
  if (
    document.getElementsByClassName("table table-hover table-condensed")[0]
      .children[1] !== undefined &&
    document.getElementsByClassName("table table-hover table-condensed")[0]
      .children[1].rows !== undefined
  ) {
    return [
      document.getElementsByClassName("table table-hover table-condensed")[0]
        .children[1].rows,
      1,
    ];
  } else if (
    document.getElementsByClassName("table table-hover table-condensed")[0]
      .children[0] !== undefined &&
    document.getElementsByClassName("table table-hover table-condensed")[0]
      .children[0].rows !== undefined
  ) {
    return [
      document.getElementsByClassName("table table-hover table-condensed")[0]
        .children[0].rows,
      2,
    ];
  }
};

const tableScraper = (event, elements, i, j, sch, tabType) => {
  if (tabType === 2) {
    if (j == 1) {
      event["Department"] = elements[i].children[j].innerHTML;
    } else if (j == 3) {
      event["Course"] = elements[i].children[j].innerHTML;
    } else if (j == 4) {
      event["Type"] = elements[i].children[
        j
      ].lastElementChild.lastElementChild.innerHTML.replace(/\t/g, "");
    } else if (j == 5) {
      event["Section"] = elements[i].children[j].innerHTML;
    } else if (j == 6) {
      event["Description"] = elements[i].children[j].innerHTML.replace(
        /&amp;/g,
        "&"
      );
    } else if (j == 7) {
      event["classNumber"] = elements[i].children[j].innerHTML;
    } else if (j == 8) {
      var instructor = elements[i].children[j].innerHTML
        .replace(/<[^>]*>?/gm, "")
        .trim();

      event["Instructor"] = instructor;
    } else if (j == 9) {
      var table = elements[i].children[j].getElementsByClassName(
        "table table-bordered table-condensed"
      )[0].children[0].children;

      var termBeginandEnd = returnDateAndReoccurence(
        event["Course"].charAt(event["Course"].length - 1)
      );

      event["dayTimeNumber"] = [];

      for (var k = 0; k < table.length; k++) {
        var day = table[k].children[0].innerHTML.replace(/\&nbsp;/g, "").trim();

        var singleSplitDays = day.split(/\s+/);

        if (singleSplitDays.length > 1) {
          // split on one space, and then iterate through and remove the spaces left and right from each side.

          singleSplitDays.forEach((day) => {
            var time = table[k].children[1].innerHTML.trim();
            var classNumber = table[k].children[2].innerHTML.trim();
            event["dayTimeNumber"].push([day, time, classNumber]);
          });
          continue;
        }

        var time = table[k].children[1].innerHTML.trim();
        var classNumber = table[k].children[2].innerHTML.trim();
        event["dayTimeNumber"].push([day, time, classNumber]);
      }

      for (var i = 0; i < event["dayTimeNumber"].length; i++) {
        const arrOfObjects = createEventStrings(termBeginandEnd, event, i);
        console.log(arrOfObjects);
        arrOfObjects.forEach((e) => {
          sch.push(e);
        });
      }
    }
  } else if (tabType === 1) {
    if (j == 1) {
      event["Department"] = elements[i].children[j].innerHTML;
    } else if (j == 2) {
      event["Course"] = elements[i].children[j].innerHTML;
    } else if (j == 3) {
      event["Type"] = elements[i].children[
        j
      ].lastElementChild.lastElementChild.innerHTML.replace(/\t/g, "");
    } else if (j == 4) {
      event["Section"] = elements[i].children[j].innerHTML;
    } else if (j == 5) {
      event["Description"] = elements[i].children[j].innerHTML.replace(
        /&amp;/g,
        "&"
      );
    } else if (j == 6) {
      event["classNumber"] = elements[i].children[j].innerHTML;
    } else if (j == 7) {
      var instructor = elements[i].children[j].innerHTML
        .replace(/<[^>]*>?/gm, "")
        .trim();

      event["Instructor"] = instructor;
    } else if (j == 8) {
      var table = elements[i].children[j].getElementsByClassName(
        "table table-bordered table-condensed"
      )[0].children[0].children;

      var termBeginandEnd = returnDateAndReoccurence(
        event["Course"].charAt(event["Course"].length - 1)
      );

      event["dayTimeNumber"] = [];

      for (var k = 0; k < table.length; k++) {
        var day = table[k].children[0].innerHTML.replace(/\&nbsp;/g, "").trim();

        var singleSplitDays = day.split(/\s+/);

        if (singleSplitDays.length > 1) {
          // split on one space, and then iterate through and remove the spaces left and right from each side.

          singleSplitDays.forEach((day) => {
            var time = table[k].children[1].innerHTML.trim();
            var classNumber = table[k].children[2].innerHTML.trim();
            event["dayTimeNumber"].push([day, time, classNumber]);
          });
          continue;
        }

        var time = table[k].children[1].innerHTML.trim();
        var classNumber = table[k].children[2].innerHTML.trim();
        event["dayTimeNumber"].push([day, time, classNumber]);
      }

      for (var i = 0; i < event["dayTimeNumber"].length; i++) {
        const arrOfObjects = createEventStrings(termBeginandEnd, event, i);

        arrOfObjects.forEach((e) => {
          sch.push(e);
        });
      }
    }
  }
};

const scrapePage = () => {
  var table = getTable();
  var elements = table[0];
  var tableType = table[1];

  if (elements === "err" || Array.from(elements).length === 1) {
    return "err";
  }

  var sch = [];

  for (var i in elements) {
    if (isNaN(i)) {
      continue;
    }
    if (elements[i].className === "active") {
      continue;
    }
    var event = new Object();

    for (var j = 0; j < elements[i].children.length; j++) {
      tableScraper(event, elements, i, j, sch, tableType);
    }
  }

  console.log(sch);
  return sch;
};
