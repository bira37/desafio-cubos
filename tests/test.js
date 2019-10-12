'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');
const should = chai.should();
const expect = chai.expect;
const DataHandler = require('../data/data_handler');

chai.use(chaiHttp);

before('Close the app instance initialized by the require import and resetting database', () => {
  console.log('Closing the server to run tests...');
  server.close();
  DataHandler.createDatabase();
});

afterEach('Reset Database for the next test', () => {
  DataHandler.createDatabase();
});

describe('Check for correctness of valid post requests', () => {

  describe('Register a daily rule', () => {
    it('should be successful and return the id', done => {
      let body = {
        "type": "daily",
        "intervals": [
          {
            "start": "09:30",
            "end": "10:10"
          }
        ] 
      };
      chai.request(server).post('/api/rules').send(body).end((err, res) => {
        res.should.have.status(200);
        expect(res.body).has.own.property('id');
        done();
      });
    });
  });

  describe('Register a weekly rule', () => {
    it('should be successful and return the id', done => {
      let body = {
        "type": "weekly",
        "days": [
          {
            "day": "Monday",
            "intervals": [
              {
                "start": "14:00",
                "end": "14:30"
              }
            ]
          }
        ] 
      };
      chai.request(server).post('/api/rules').send(body).end((err, res) => {
        res.should.have.status(200);
        expect(res.body).has.own.property('id');
        done();
      });
    });
  });

  describe('Register a once rule', () => {
    it('should be successful and return the id', done => {
      let body = {
        "type": "once",
        "dates": [
          {
            "date": "25-06-2018",
            "intervals": [
              {
                "start": "08:30",
                "end": "09:20"
              }
            ]
          }
        ] 
      };
      chai.request(server).post('/api/rules').send(body).end((err, res) => {
        res.should.have.status(200);
        expect(res.body).has.own.property('id');
        done();
      });
    });
  });

});

describe('Check correctness of valid delete requests', () => {

  describe('Delete an existing rule', () => {
    it('should return the correct number of deleted intervals', done => {
      let body = {
        "type": "daily",
        "intervals": [
          {
            "start": "09:30",
            "end": "10:10"
          },
          {
            "start": "10:30",
            "end": "11:10"
          }
        ] 
      };
      chai.request(server).post('/api/rules').send(body).end((err, res) => {
        res.should.have.status(200);
        const id = res.body['id'];
        
        chai.request(server).delete('/api/rules/' + id).end((err, res) => {
          res.should.have.status(200);
          expect(res.body).has.own.property('deletedItems', 2);
          done();
        });
      });
    });
  });

  describe('Delete non-existing rule', ()=>{
    it('should return no deleted intervals', done => {
      chai.request(server).delete('/api/rules/thisiddoesnotexist').end((err, res) => {
        res.should.have.status(200);
        expect(res.body).has.own.property('deletedItems', 0);
        done();
      });
    });
  });

});

describe('Check correctness of valid get requests', ()=>{

  beforeEach('Register some intervals to the database', ()=>{
    let body = {
      "type": "daily",
      "intervals": [
        {
          "start": "09:30",
          "end": "10:10"
        }
      ] 
    };
    chai.request(server).post('/api/rules').send(body).end();
    body = {
      "type": "weekly",
      "days": [
        {
          "day": "Monday",
          "intervals": [
            {
              "start": "14:00",
              "end": "14:30"
            }
          ]
        }
      ] 
    };
    chai.request(server).post('/api/rules').send(body).end();
    body = {
      "type": "once",
      "dates": [
        {
          "date": "26-06-2018",
          "intervals": [
            {
              "start": "07:30",
              "end": "08:20"
            },
            {
              "start": "08:30",
              "end": "09:20"
            },
          ]
        }
      ] 
    };
    chai.request(server).post('/api/rules').send(body).end();
  });

  describe('Get all rules', () => {
    it('should have the registered rules added before the test', done => {
      chai.request(server).get('/api/rules').end((err, res) => {
        expect(res.body.daily.length).to.equal(1);
        expect(res.body.weekly['Monday'].length).to.equal(1);
        expect(res.body.once['26-06-2018'].length).to.equal(2);
        res.should.have.status(200);
        done();
      });
    });
  });

  describe('Get rules in range', () => {
    it('should return the expected body', done => {
      chai.request(server).get('/api/rules?start=25-06-2018&end=27-06-2018').end((err, res) => {
        let expected_body = [
          {
            "day": "25-06-2018",
            "intervals": [
              {
                "start": "09:30",
                "end": "10:10"
              },
              {
                "start": "14:00",
                "end": "14:30"
              }
            ]
          },
          {
            "day": "26-06-2018",
            "intervals": [
              {
                "start": "07:30",
                "end": "08:20"
              },
              {
                "start": "08:30",
                "end": "09:20"
              },
              {
                "start": "09:30",
                "end": "10:10"
              }
            ]
          },
          {
            "day": "27-06-2018",
            "intervals": [
              {
                "start": "09:30",
                "end": "10:10"
              }
            ]
          }
        ];
        res.should.have.status(200);
        expect(res.body).to.deep.equal(expected_body);
        done();
      });
    });
  });
  
});


describe('Check for bad formatted body errors and interval conflicts', () => {

  describe('Invalid rule type', () => {
    it('should return status 400', done => {
      let body = {
        "type": "monthly",
        "intervals": [
          {
            "start": "09:30",
            "end": "10:10"
          }
        ] 
      };
      chai.request(server).post('/api/rules').send(body).end((err, res)=> {
        expect(res.body).has.own.property('message');
        res.should.have.status(400);
        done();
      });
    });
  });

  describe('Unordered intervals on request body', () => {
    it('should return status 400', done => {
      let body = {
        "type": "daily",
        "intervals": [
          {
            "start": "09:30",
            "end": "10:10"
          },
          {
            "start": "08:30",
            "end": "08:45"
          }
        ] 
      };
      chai.request(server).post('/api/rules').send(body).end((err, res)=> {
        expect(res.body).has.own.property('message');
        res.should.have.status(400);
        done();
      });
    });
  });

  describe('Invalid interval on request body', () => {
    it('should return status 400', done => {
      let body = {
        "type": "daily",
        "intervals": [
          {
            "start": "10:30",
            "end": "09:10"
          }
        ] 
      };
      chai.request(server).post('/api/rules').send(body).end((err, res)=> {
        expect(res.body).has.own.property('message');
        res.should.have.status(400);
        done();
      });
    });
  });

  describe('Wrongly formatted interval on request body', () => {
    it('should return status 400', done => {
      let body = {
        "type": "daily",
        "intervals": [
          {
            "start": "1:30",
            "end": "9:40"
          }
        ] 
      };
      chai.request(server).post('/api/rules').send(body).end((err, res)=> {
        expect(res.body).has.own.property('message');
        res.should.have.status(400);
        done();
      });
    });
  });

  describe('Registering rule that conflicts with existing one', () => {
    it('should return status 400', done => {
      let body = {
        "type": "daily",
        "intervals": [
          {
            "start": "09:30",
            "end": "11:30"
          }
        ] 
      };
      chai.request(server).post('/api/rules').send(body).end((err, res)=> {
        let body = {
          "type": "weekly",
          "days": [
            {
              "day": "Monday",
              "intervals": [
                {
                  "start": "11:00",
                  "end": "14:30"
                }
              ]
            }
          ] 
        };
        chai.request(server).post('/api/rules').send(body).end((err, res) => {
          expect(res.body).has.own.property('message');
          res.should.have.status(400);
          done();
        });
      });
    });
  });

});
