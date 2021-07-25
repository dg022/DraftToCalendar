chrome.runtime.onMessage.addListener(msgObj => {
    console.log('buckets of yolo there boiz', msgObj);

    var sch = scrapePage();
    
    chrome.runtime.sendMessage({
        data: sch
    }, function (response) {
        console.log(response)
    });

});

    // var date = new DateTime();
    // console.log(nextWeekdayDate(date, 5)); // Outputs the date next Friday after today.

    const nextWeekdayDate = (date, day_in_week) => {

        var ret = new Date(date||new Date());
        ret.setDate(ret.getDate() + (day_in_week - 1 - ret.getDay() + 7) % 7 + 1);
        return ret;
  
  
    }


    const reoccurenceStrings = new Object()
    reoccurenceStrings['08-December-2021'] = '20211208T000000Z'
    reoccurenceStrings['01-April-2022'] = '20220401T000000Z'

    const createReccurenceString = (Until, Days)=>{

        'FREQ=WEEKLY;INTERVAL=1;BYDAY=SU,MO,TU,WE,TH,FR,SA;UNTIL=20220401T000000Z'
        return  'FREQ=WEEKLY;INTERVAL=1;BYDAY='+Days+';UNTIL='+Until

    }

    const returnDaysString = (arr) =>{
        const daysConversion = new Object()
        daysConversion['M'] = 'MO'
        daysConversion['Tu'] = 'TU'
        daysConversion['W'] = 'WE'
        daysConversion['Th'] = 'TH'
        daysConversion['F'] = 'FR'
        days = []
        for(var i = 0; i < arr.length; i++){

         days.push( daysConversion[arr[i][0]])
    
        }
        return days.toString()
    
    }

    function convertTo24Hour(time) {
        var hours = parseInt(time.substr(0, 2));
        if(time.indexOf('AM') != -1 && hours == 12) {
            time = time.replace('12', '0');
        }
        if(time.indexOf('PM')  != -1 && hours < 12) {
            time = time.replace(hours, (hours + 12));
        }
        return time.replace(/(AM|PM)/,'').trim();
    }



    const dayOfTheWeek = new Object()
    dayOfTheWeek['M'] = 1
    dayOfTheWeek['Tu'] = 2
    dayOfTheWeek['W'] = 3
    dayOfTheWeek['Th'] = 4
    dayOfTheWeek['F'] = 5


const createEventStrings = (termBeginandEnd, event)=>{
  
    const date = new Object()
    date['January'] = '01'
    date['February'] = '02'
    date['March'] = '03'
    date['April'] = '04'
    date['May'] = '05'
    date['June'] = '06'
    date['July'] = '07'
    date['August'] = '08'
    date['September'] = '09'
    date['October'] = '10'
    date['November'] = '11'
    date['December'] = '12'

    var ev = []
    
    for(const DateTime in date){

       
        if( DateTime && termBeginandEnd[0].trim().includes(DateTime)){
            
            //Given the start day of the term, this will spit out the first class for this course. 
            //I need a list of the days in which it repeats. 

            var nextDay = nextWeekdayDate(new Date(termBeginandEnd[0].trim().replace(DateTime, date[DateTime]).split("-").reverse().join("-") + " EST"), dayOfTheWeek[event['dayTimeNumber'][0][0]] )
            var proccesedTime = event['dayTimeNumber'][0][1].split(' -  ')
            if(!/\d/.test(proccesedTime[0]) || !/\d/.test(proccesedTime[1]) ){
                continue
            }
            var BeginningOfEvent  = convertTo24Hour(proccesedTime[0])
            var EndOfEvent  = convertTo24Hour(proccesedTime[1])
            nextDay.setHours(BeginningOfEvent.split(':')[0], BeginningOfEvent.split(':')[1]);
            var startTimeString =  nextDay.toISOString()
            nextDay.setHours(EndOfEvent.split(':')[0], EndOfEvent.split(':')[1]);
            var endTimeString =  nextDay.toISOString()
            
            var reccurString = createReccurenceString(reoccurenceStrings[termBeginandEnd[1].trim()], returnDaysString(event['dayTimeNumber']))

            const eventToAdd = {
                'summary':event['Description'],
                'location':event['classNumber'],
                'start':{
                    'dateTime':startTimeString, 
                    'timeZone': 'America/New_York'
                },
                'end':{
                    'dateTime':endTimeString,
                    'timeZone': 'America/New_York'
                },
                'recurrence': [
                    reccurString
                  ]
            }
           
            ev.push(eventToAdd)

           
            
        }

    }
    
    return ev
}



const checkIfAllTimesEqual = (array) =>{
    var time = array[0][1]
    for(var i = 1; i < array.length; i++){

        if(array[i][1]!==time){
            return false
        }

    }
    return true
}

const scrapePage = ()=>{


    var table = document.querySelector('tbody')
    var elements = document.getElementsByClassName("table table-hover table-condensed")[0].children[1].rows;
    var sch = []
    
    for( var i in elements){

        // 1 Department
        // 2 Course
        // 3 Type (lec, tut)
        // 4 Section
        // 5 Description
        // 6 classNmbr
        // 7 Instructor
        // 8 Day/Times/Location 
        // 10 Delivery Type
        if(isNaN(i)){
            continue
        }
        var event = new Object();

        for(var j = 0; j <elements[i].children.length; j++ ){
            
            if (j == 1){
                if(elements[i].children[j].innerHTML.includes('Credits')){
                    continue
                }

                event['Department'] = elements[i].children[j].innerHTML
            }
            else if (j == 2){
                
                event['Course'] = elements[i].children[j].innerHTML
            }
            else if (j == 3){
                
                event['Type'] = elements[i].children[j].lastElementChild.lastElementChild.innerHTML.replace(/\t/g, '')
            }
            else if (j == 4){
                
                event['Section'] =  elements[i].children[j].innerHTML
            }
            else if (j == 5){
                
                event['Description'] = elements[i].children[j].innerHTML.replace(/&amp;/g, "&")
            }
            else if (j == 6){
            
                event['classNumber'] = elements[i].children[j].innerHTML
            }
            else if (j == 7){
                var instructor = elements[i].children[j].innerHTML.replace(/<[^>]*>?/gm, '').trim();

                event['Instructor'] = instructor 
            }
            else if (j == 8){
                var table = elements[i].children[j].getElementsByClassName('table table-bordered table-condensed')[0].children[0].children
                var termBeginandEnd = elements[i].children[j].lastElementChild.innerHTML.replace(/<[^>]*>?/gm, '').trim().replace('Runs From:' ,'');
                termBeginandEnd = termBeginandEnd.split('To:')
            

 
                event['dayTimeNumber'] = []
            

                for(var k =0; k < table.length; k++){
                    var  day  = table[k].children[0].innerHTML.replace(/\&nbsp;/g, '').trim()
                    var  time  = table[k].children[1].innerHTML.trim()
                    var  classNumber  = table[k].children[2].innerHTML.trim()
                    event['dayTimeNumber'].push([day, time, classNumber])

                }
                //This returns true or false depending if all the times are the exact same. 
                if(checkIfAllTimesEqual(event['dayTimeNumber'])){

                    
                    const arrOfObjects = createEventStrings(termBeginandEnd, event)
                    
                    arrOfObjects.forEach(e=>{
                        sch.push(e)
                    })
                }
                

            }
        }
        

    
        
    }

    return sch






}