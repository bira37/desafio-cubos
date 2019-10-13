'use strict';
const fs = require('fs');
const uniqid = require('uniqid');

/* Class used to access database and validate data */
module.exports = class DataHandler {

  /* Creates the database json file (or reset the database) */
  static createDatabase(){
    let data = {
      'daily': [],
      'weekly': {
        'Sunday': [],
        'Monday': [],
        'Tuesday': [],
        'Wednesday': [],
        'Thursday': [],
        'Friday': [],
        'Saturday': []
      },
      'once': {}
    }
    let stringData = JSON.stringify(data, null, 2);
    fs.writeFileSync('data/database.json', stringData);
  }

  static startDatabase(){
    try {
      let rawData = fs.readFileSync('data/database.json');
    }
    catch (err){
      console.log('Database not found. Creating...');
      this.createDatabase();
      console.log('Database Created');
    }
  }

  static readDatabase(){
    let rawData = fs.readFileSync('data/database.json');
    let db = JSON.parse(rawData);
    return db;
  }

  static writeDatabase(db){
    let stringData = JSON.stringify(db, null, 2);
    fs.writeFileSync('data/database.json', stringData);
  }
  
  /* Get the day of the week from a date string */
  static getWeekDay(dateString){
    let [day, month, year] = dateString.split('-');
    
    /* Retrieve the day number */
    const weekDay = new Date(`${year}-${month}-${day}`).getUTCDay();
    
    /* Return the string */
    if(weekDay == 0) return 'Sunday';
    else if(weekDay == 1) return 'Monday';
    else if(weekDay == 2) return 'Tuesday';
    else if(weekDay == 3) return 'Wednesday';
    else if(weekDay == 4) return 'Thursday';
    else if(weekDay == 5) return 'Friday';
    else return 'Saturday';
  }

  /* Compares two dates. Returns -1 if start < end / 0 if start == end / 1 if start > end */
  static compareDates(start, end){
    
    /* Convert date from dd-mm-yyyy to yyyy-mm-dd format for Date Object */
    let [startDay, startMonth, startYear] = start.split('-');
    let startDate = new Date(`${startYear}-${startMonth}-${startDay}`);
    let [endDay, endMonth, endYear] = end.split('-');
    let endDate = new Date(`${endYear}-${endMonth}-${endDay}`);
    
    /* Compare */
    if(startDate < endDate) return -1;
    else if(startDate > endDate) return 1;
    else return 0;

  }

  /* Validate interval (check if it is correctly formatted and start < end) */
  static validateInterval(interval){
    let [startHour, startMinute] = interval['start'].split(':');
    let [endHour, endMinute] = interval['end'].split(':');

    /* Validate each field */
    if(startHour.length != 2 || isNaN(startHour) || startHour < '00' || startHour >= '24') return false;

    if(endHour.length != 2 || isNaN(endHour) || endHour < '00' || endHour >= '24') return false;

    if(startMinute.length != 2 || isNaN(startMinute) || startMinute < '00' || startMinute >= '60') return false;

    if(endMinute.length != 2 || isNaN(endMinute) || endMinute < '00' || endMinute >= '60') return false;

    if(startHour > endHour || (startHour == endHour && startMinute >= endMinute)) return false;

    return true;
  }

  /* Compares two intervals. 
  Returns -1 if left comes before right
  Returns 0 if left intersects right (not including the boundaries)
  Returns 1 if left comes after right */
  static compareIntervals(left, right){

    /* Convert to Dates with the same day to simplify comparisons */
    let leftStartTime = new Date('January 15, 1997 ' + left['start']);
    let leftEndTime = new Date('January 15, 1997 ' + left['end']);
    let rightStartTime = new Date('January 15, 1997 ' + right['start']);
    let rightEndTime = new Date('January 15, 1997 ' + right['end']);
    
    /* Compare */
    if(leftEndTime <= rightStartTime) return -1;
    else if(rightEndTime <= leftStartTime) return 1;
    else return 0;
  }

  /* Check if date is formatted dd-mm-yyyy */
  static validateDate(dateString){
    let [day, month, year] = dateString.split('-');

    /* Validate each field */
    if(day.length != 2 || isNaN(day)) return false;

    if(month.length != 2 || isNaN(month)) return false;

    if(year.length != 4 || isNaN(year)) return false;

    return true;
  }

  /* Validates Daily Rule format */
  static validateDailyRule(rule){
    let valid = true;

    /* Check if intervals are well formatted */
    rule.intervals.forEach(interval => {
      if(!this.validateInterval(interval)) valid = false;
    });
    /* Check if intervals are ordered */
    for(let i = 1; i < rule.intervals.length; i++){
      if(this.compareIntervals(rule.intervals[i-1], rule.intervals[i]) != -1) valid = false;
    }
    /* Read database */
    let db = this.readDatabase();

    /* Check intersection with all intervals of database */
    rule.intervals.forEach(interval => {
      /* Check with all daily intervals */
      db.daily.forEach(dbInterval => {
        if(this.compareIntervals(interval, dbInterval) == 0) valid = false;
      });
      
      /* Check with all weekly intervals */
      for(let dayKey in db.weekly){
        db.weekly[dayKey].forEach(dbInterval=> {
          if(this.compareIntervals(interval, dbInterval) == 0) valid = false;
        });
      }
      /* Check with all once intervals */
      for(let dateKey in db.once){
        db.once[dateKey].forEach(dbInterval=> {
          if(this.compareIntervals(interval, dbInterval) == 0) valid = false;
        });
      }
    });

    return valid;
  }
  
  /* Validates Weekly Rule format */
  static validateWeeklyRule(rule){
    let valid = true;

    /* Run for each week day given */
    rule.days.forEach(item => {
      /* Check if intervals are well formatted */
      item.intervals.forEach(interval => {
        if(!this.validateInterval(interval)) valid = false;
      });
      
      /* Check if intervals are ordered */
      for(let i = 1; i < item.intervals.length; i++){
        if(this.compareIntervals(item.intervals[i-1], item.intervals[i]) != -1) valid = false;
      }

      /* Read database */
      let db = this.readDatabase();

      /* Check if intersects any interval */
      item.intervals.forEach(interval => {

        /* Check for daily intervals */
        db.daily.forEach(dbInterval => {
          if(this.compareIntervals(interval, dbInterval) == 0) valid = false;
        });
        
        /* Check for the same week day intervals */
        db.weekly[item.day].forEach(dbInterval => {
          if(this.compareIntervals(interval, dbInterval) == 0) valid = false;
        });

        /* Check of any once interval with the same week day */
        for(let dateKey in db.once){
          const weekDay = this.getWeekDay(dateKey);
          if(weekDay === item.day){
            db.once[dateKey].forEach(dbInterval => {
              if(this.compareIntervals(interval, dbInterval) == 0) valid = false;
            });
          }
        }

      });
    });

    return valid;
  }
  
  /* Validates Once Rule format */
  static validateOnceRule(rule){
    let valid = true;

    /* Run for each date given */
    rule.dates.forEach(item => {
      /* Check if intervals are well formatted */
      item.intervals.forEach(interval => {
        if(!this.validateInterval(interval)) valid = false;
      });
      
      /* Check if intervals are ordered */
      for(let i = 1; i < item.intervals.length; i++){
        if(this.compareIntervals(item.intervals[i-1], item.intervals[i]) != -1) valid = false;
      }
      
      /* Read database */
      let db = this.readDatabase();

      /* Check if intersects any interval */
      item.intervals.forEach(interval => {
        const weekDay = this.getWeekDay(item.date);
        /* Check for daily intervals */
        db.daily.forEach(dbInterval => {
          if(this.compareIntervals(interval, dbInterval) == 0) valid = false;
        });
      
        /* Check for the same week day intervals */
        db.weekly[weekDay].forEach(dbInterval => {
          if(this.compareIntervals(interval, dbInterval) == 0) valid = false;
        });
        
        /* Check of any once interval with the same date */
        if(Object.keys(db.once).includes(item.date)){
          db.once[item.date].forEach(dbInterval => {
            if(this.compareIntervals(interval, dbInterval) == 0) valid = false;
          });
        }

      });
    });

    return valid;
  }
  
  /* Inserts a daily rule */
  static insertDailyRule(rule){
    /* Read Database */
    let db = this.readDatabase();

    const id = uniqid();

    /* Add each interval */
    rule.intervals.forEach(interval => {
      db.daily.push({'start': interval['start'], 'end': interval['end'], 'id': id});
    });

    /* Write database */
    this.writeDatabase(db);

    /* Return the id of the rule */
    return id;
  }
  
  /* Inserts a weekly rule */
  static insertWeeklyRule(rule){
    /* Read database */
    let db = this.readDatabase();
    
    const id = uniqid();

    /* Add all intervals for each day */
    rule.days.forEach(item => {
      item.intervals.forEach(interval => {
        db.weekly[item.day].push({'start': interval['start'], 'end': interval['end'], 'id': id});
        
      });
    });

    /* Write database */
    this.writeDatabase(db);

    /* Return the id of the rule */
    return id;
  }
  
  /* Inserts an once rule */
  static insertOnceRule(rule){
    /* Read database */
    let db = this.readDatabase();
    
    const id = uniqid();

    /* Add all intervals for each date */
    rule.dates.forEach(item => {
      item.intervals.forEach(interval => {
        /* Create empty array if key does not exist */
        if(!Object.keys(db.once).includes(item.date))
          db.once[item.date] = []
        
        db.once[item.date].push({'start': interval['start'], 'end': interval['end'], 'id': id});
      });
    });

    /* Write database */
    this.writeDatabase(db);

    /* Return the id of the rule */
    return id;
  }
  
  /* Return all the rules */
  static getAllRules(){
    /* Read database */
    let db = this.readDatabase();

    /* Return database json */
    return db;
  }
  
  /* Returns all the rules in the date range formatted */
  static getRules(start, end){
    /* Read database */
    let db = this.readDatabase();
    
    /* Convert to Date to simplify calculations */
    let [startDay, startMonth, startYear] = start.split('-');
    let startDate = new Date(`${startYear}-${startMonth}-${startDay}`);
    
    let [endDay, endMonth, endYear] = end.split('-');
    let endDate = new Date(`${endYear}-${endMonth}-${endDay}`);

    let ruleList = [];

    /* Iterate over all days and get all intervals */
    for(let currentDate = startDate; currentDate <= endDate; currentDate.setDate(currentDate.getDate()+1)){
      let isoDate = currentDate.toISOString();
      let currentDateString = `${isoDate.slice(8,10)}-${isoDate.slice(5, 7)}-${isoDate.slice(0, 4)}`;

      let weekDay = this.getWeekDay(currentDateString);

      
      /* Initialize json for the current day */
      let currentJson = {'day': currentDateString, 'intervals': []};
      
      /* Populate with all daily rules */
      db.daily.forEach(interval => {
        currentJson['intervals'].push({'start': interval['start'], 'end': interval['end']});
      });
      
      /* Populate with weekly rules for this day */
      db.weekly[weekDay].forEach(interval => {
        currentJson['intervals'].push({'start': interval['start'], 'end': interval['end']});
      });
      
      /* Populate with once rules for this day */
      if(Object.keys(db.once).includes(currentDateString)){
        db.once[currentDateString].forEach(interval => {
          currentJson['intervals'].push({'start': interval['start'], 'end': interval['end']});
        });
      }

      /* Sort the intervals inside the json */
      currentJson['intervals'].sort((left, right) => {
        return this.compareIntervals(left, right);
      });

      /* Push json to the list */
      ruleList.push(currentJson);
    }

    return ruleList;
  }
  
  /* Deletes rule by id */
  static deleteRule(ruleId){
    /* Read database */
    let db = this.readDatabase();

    let deleteCount = 0;
    /* Iterate over all daily rules */
    for(let i = 0; i<db.daily.length; i++){
      if(ruleId === db.daily[i]['id']){
        db.daily.splice(i, 1);
        deleteCount++;
        i--;
      }
    }
    
    /* Iterate over all weekly rules */
    for(let dayKey in db.weekly){
      for(let i = 0; i < db.weekly[dayKey].length; i++){
        if(db.weekly[dayKey][i]['id'] == ruleId){
          db.weekly[dayKey].splice(i, 1);
          deleteCount++;
          i--;
        }
      }
    }
    /* Iterate over all once rules */
    for(let dateKey in db.once){
      for(let i = 0; i < db.once[dateKey].length; i++){
        if(ruleId == db.once[dateKey][i]['id']){
          db.once[dateKey].splice(i, 1);
          deleteCount++;
          i--;
        }
      }
      if(db.once[dateKey].length == 0) delete db.once[dateKey];
    }
    /* Write database */
    this.writeDatabase(db);

    /* Return number of deleted items */
    return deleteCount;
  }
}
