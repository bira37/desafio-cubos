'use strict';

const DataHandler = require('../data/data_handler');

exports.getRules = async (req, res) => {
  try {
    const queryKeys = Object.keys(req.query);
    /* Check if query is for all rules or specific range */
    
    if(queryKeys.includes('start') && queryKeys.includes('end')){
      
      const start = req.query['start'];
      const end = req.query['end'];

      /* Validate Date Format (dd-mm-yyyy) and range */
      if(!DataHandler.validateDate(start)) throw {'message': 'Error: start date formatted incorrectly'};
      
      if(!DataHandler.validateDate(end)) throw {'message': 'Error: end date formatted incorrectly'};
      
      if(DataHandler.compareDates(start, end) > 0) throw {'message': 'Error: start date is greater than end date'};
      
      /* Query date range */
      const response = DataHandler.getRules(start, end);

      /* Send response */
      res.status(200).send(response);
    }
    else {
      /* Query all rules */
      const response = DataHandler.getAllRules();
      
      /* Send response */
      res.status(200).send(response);
    }
  }
  catch (err){
    res.status(400).send(err);
  }
}

exports.createRule = async (req, res) => {
  try {
    /* Check if rule is for a daily, weekly or once type and process it */
    if(req.body['type'] == 'daily'){
      /* Validate daily rule and insert it */
      if(!DataHandler.validateDailyRule(req.body)) throw {'message': 'Error: body badly formatted and/or given intervals intersects existing ones'};

      const ruleId = DataHandler.insertDailyRule(req.body);

      res.status(200).send({'id': ruleId});
    }
    else if(req.body['type'] == 'weekly'){
      /* Validate weekly rule and insert it */
      if(!DataHandler.validateWeeklyRule(req.body)) throw {'message': 'Error: body badly formatted and/or given intervals intersects existing ones'};

      const ruleId = DataHandler.insertWeeklyRule(req.body);

      res.status(200).send({'id': ruleId});
    }
    else if(req.body['type'] == 'once'){
      /* Validate once rule and insert it */
      if(!DataHandler.validateOnceRule(req.body)) throw {'message': 'Error: body badly formatted and/or given intervals intersects existing ones'};

      const ruleId = DataHandler.insertOnceRule(req.body);

      res.status(200).send({'id': ruleId});
    }
    else throw {'message': 'Error: rule type does not exist'};
  }
  catch (err){
    res.status(400).send(err);
  }
}

exports.deleteRule = async (req, res) => {
  try {
    /* Delete Rules with given id */
    const deletedItems = DataHandler.deleteRule(req.params.id);
    res.status(200).send({'message': 'Rule successfully deleted', 'deletedItems': deletedItems});
  }
  catch (err){
    res.status(400).send(err);
  }
}

