var Waterline = require('waterline'),
    TAXI_FIXTURE = require('../support/manyToMany.taxi.fixture'),
    DRIVER_FIXTURE = require('../support/manyToMany.driver.fixture'),
    assert = require('assert'),
    _ = require('lodash');

describe('Association Interface', function() {

  describe.only('n:m association :: findOne().populate()', function() {
    /////////////////////////////////////////////////////
    // TEST SETUP
    ////////////////////////////////////////////////////

    var Taxi, Driver, waterline;

    before(function(done) {
      waterline = new Waterline();

      waterline.loadCollection(TAXI_FIXTURE);
      waterline.loadCollection(DRIVER_FIXTURE);

      Events.emit('fixture', TAXI_FIXTURE);
      Events.emit('fixture', DRIVER_FIXTURE);

      Connections.associations = _.clone(Connections.test);

      waterline.initialize({
        adapters: {
          wl_tests: Adapter
        },
        connections: Connections
      }, function(err, ontology) {
        if (err) return done(err);

        Taxi = ontology.collections.taxi;
        Driver = ontology.collections.driver;

        done();
      });
    });

    after(function(done) {
      waterline.teardown(done);
    });


    describe('Many To Many Association', function() {

      /////////////////////////////////////////////////////
      // TEST SETUP
      ////////////////////////////////////////////////////

      var driverRecord;

      before(function(done) {
        Driver.create({ name: 'manymany findOne'}, function(err, driver) {
          if(err) return done(err);

          driverRecord = driver;

          var taxis = [];
          for(var i=0; i<2; i++) {
            driverRecord.taxis.add({ medallion: i });
          }

          driverRecord.save(function(err) {
            if(err) return done(err);
            done();
          });
        });
      });

      describe('.findOne', function() {

        /////////////////////////////////////////////////////
        // TEST METHODS
        ////////////////////////////////////////////////////

        it('should return taxis when the populate criteria is added', function(done) {
          Driver.findOne(driverRecord.id)
          .populate('taxis')
          .exec(function(err, driver) {
            if(err) return done();

            assert(Array.isArray(driver.taxis));
            assert(driver.taxis.length === 2);

            done();
          });
        });

        it('should not return a taxis object when the populate is not added', function(done) {
          Driver.findOne(driverRecord.id)
          .exec(function(err, driver) {
            if(err) return done(err);

            var obj = driver.toJSON();
            assert(!obj.taxis);

            done();
          });
        });

        it('should call toJSON on all associated records if available', function(done) {
          Driver.findOne(driverRecord.id)
          .populate('taxis')
          .exec(function(err, driver) {
            if(err) return done(err);

            var obj = driver.toJSON();
            assert(!obj.name);

            assert(Array.isArray(obj.taxis));
            assert(obj.taxis.length === 2);

            assert(obj.taxis[0].hasOwnProperty('createdAt'));
            assert(!obj.taxis[0].hasOwnProperty('medallion'));
            assert(obj.taxis[1].hasOwnProperty('createdAt'));
            assert(!obj.taxis[1].hasOwnProperty('medallion'));

            done();
          });
        });

      });
    });
  });
});
