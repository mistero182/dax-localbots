#!/usr/bin/env node

const commander = require('commander');
const program = new commander.Command();
const comparer = require('./methods/comparer.js');

program
  .command('clear')
  .description('Clear previous session framework')
  .action(async (obj, opts) => {
      let res = await comparer.clear();
      console.log(res);
  });

program
  .command('view <object>')
  .description('Print selected object')
  .option('-t, --props <propsPath>', 'Path of props, eg. ".propLvl_1.propLvl_2.propLvl_3"', null)
  .option('-s, --save', 'Save modified file', false)
  .action(async (obj, opts) => {
      let res = await comparer.load({obj, ...opts});

	  if (opts.save) {
         if (opts.props) {
             console.log(res.obj);
             console.log(`\n Results saved at ${obj}${res.path}.js`);
         } else {
             console.log(res.obj);
         }
      } else {
          console.log(res);
      }
  });

program
  .command('keys <obj>')
  .description('View keys in given object')
  .option('-t, --props <propsPath>', 'Path of props, eg. ".propLvl_1.propLvl_2.propLvl_3"', null)
  .action(async (obj, opts) => {
      let res = await comparer.keys({obj, ...opts});
      console.log(res);
  });

program
  .command('values <obj> [prop]')
  .description('View values in given object')
  .option('-n, --noNull', 'Clean undefined props in object', false)
  .option('-s, --save', 'Save repeated objets in ./..values.js', false)
  .action(async (obj, prop, opts) => {
      let res = await comparer.values({obj, prop, ...opts});
      
      console.log(res);

      if (opts.save) console.log(`\n Results saved at ${obj}_values.js`);
  });
  
program
  .command('toArray <obj> [prop]')
  .description('Convert objects in array of values, set the props in ther order that you want')
  .option('-n, --noNull', 'Clean undefined props in object', false)
  .option('-s, --save', 'Save repeated objets in ./..values.js', false)
  .action(async (obj, prop, opts) => {
      let res = await comparer.toArray({obj, prop, ...opts});
      
      console.log(res);

      if (opts.save) console.log(`\n Results saved at ${obj}_array.js`);
  });  

program
  .command('removeNulls <obj> [prop]')
  .description('Remove results that have null value for given property')
  .option('-s, --save', 'Save repeated objets in ./.._noNull.js', false)
  .action(async (obj, prop, opts) => {
      let res = await comparer.removeNulls({obj, prop, ...opts});

      console.log(`${res.length} objects removed`);
      if (opts.save) console.log(`\n Results saved at ${obj}_noNulls.js`);
  });  

program
  .command('sort <obj> [prop]')
  .description('View keys in given object, set [prop] if object is')
  .option('-s, --save', 'Save repeated objets in ./objectUniques.js', false)
  .action(async (obj, prop, opts) => {
      let res = await comparer.sort({obj, prop, ...opts});
      console.log(res);
      if (opts.save) console.log(`\n Results saved at ${obj}_sorted.js`);
  });

program
  .command('uniques <obj> [prop]')
  .description('Verify uniques objects by given prop')
  .option('-s, --save', 'Save repeated objets in ./objectUniques.js', false)
  .action(async (obj, prop, opts) => {
      let objeto = await comparer.load({ obj, path: '.' });

      let res = await comparer.uniquesBy({ obj, prop, ...opts });
      console.log(`Uniques ${res.length} of ${objeto.length}`);
	  if (opts.save) console.log(`\n Results saved at ${obj}_uniques.js`);
  });
  
program
  .command('missedIn <obj1> <obj2> [prop]')
  .description('Check missed items from one collection in another collection [prop]')
  .option('-s, --save', 'Save missed objets in ./missedObjectsFrom.js', false)
  .action(async (obj1, obj2, prop, opts) => {
      let res = await comparer.missedIn({ obj1, obj2, prop, ...opts });

      console.log(res);
      console.log(`Missed objects: ${res.length}`);
	  if (opts.save) console.log(`\n Results saved at missedFrom_${obj1}.js`);
  });  

program
  .command('toRequestAPIUpdater <obj>')
  .description('Create request urls to API Updater')
  .option('-s, --save', 'Save repeated objets in ./objectUniques.js', true)
  .action(async (obj, opts) => {
      let res = await comparer.toRequestAPIUpdater({ obj, ...opts });
	  if (opts.save) console.log(`\n Results saved at ${obj}_requestAPIUpdater.js`);
  });

program
  .command('especialRequest <obj>')
  .description('Create request urls to API Updater')
  .option('-s, --save', 'Save repeated objets in ./objectUniques.js', true)
  .action(async (obj, opts) => {
      let res = await comparer.especialRequest({ obj, ...opts });
	  if (opts.save) console.log(`\n Results saved at ${obj}_requestAPIUpdater.js`);
  });

program
  .command('flat <obj> [prop]')
  .description('Flat prop object')
  .option('-s, --save', 'Save repeated objets in ./object_flatted.js', false)
  .action(async (obj, prop, opts) => {
      let res = await comparer.flat({ obj, prop, ...opts });
      console.log(res);

	  if (opts.save) console.log(`\nResults saved at ${obj}_flatted.js`);
  });

program
.command('countBy <obj> [prop]')
.description('Count by prop')
.option('-s, --save', 'Save repeated objets in ./object_counted.js', false)
.action(async (obj, prop, opts) => {
  let res = await comparer.countBy({ obj, prop, ...opts });
  console.log(res);

  if (opts.save) console.log(`\nResults saved at ${obj}_counted.js`);
});

program
  .command('repeated <obj> [prop]')
  .description('Verify uniques objects by prop')
  .option('-s, --save', 'Save repeated objets in ./objectRepeated.js', false)
  .action(async (obj, prop, opts) => {
      let res = await comparer.repeatedBy({ obj, prop, ...opts });
      console.log(res);
      console.log(`\n${res.length} elements repeated in object`)
	  if (opts.save) console.log(`\nResults saved at ${obj}_repeated.js`);
  });

program
  .command('compare <obj1>  <obj2>')
  .description('Compare ubiquitous properties in two given objects <obj1> <obj2>')
  .option('-s, --save', 'Save repeated objets in ./Difference_object1_object2.js', false)
  .option('-b, --compareBy <propToCompare>', 'Set a different prop to compare by', 'ProductUrl')
  .action(async (obj1, obj2, opts) => {
      let res = await comparer.compare({ obj1, obj2, ...opts });
	  console.log(`\n${res.length} elements with differents values for the same props between both objects`);
	  if (opts.save) console.log(`\nResults saved at difference_${obj1}_${obj2}.js`);
  });
  
program
  .command('schema <obj>')
  .description('Verify props in object match with schema')
  .option('-s, --save', 'Save schema verification in ./object_schemaVerification.js', false)
  .action(async (obj, opts) => {
      let res = await comparer.schema({ obj, ...opts });
      if (res.length > 0) {
            console.log(`\nBad property keys finded: `);
            console.log(res);
      } else {
            console.log(`\nNo bad property keys finded`);
      }

	  //console.log(`\n${res.length} elements with differents values for the same props between both objects`);
	  if (opts.save) console.log(`\nResults saved at ${obj}_schemaVerification.js`);
  });  

program
  .command('setIndex <obj>')
  .description('Add index to object array in other file...')
  .action(async (obj, opts) => {
      await comparer.setIndex({ obj, ...opts });
      console.log(`Generated File....`);

	  console.log(`\nResults saved at ${obj}WithIndex.js`);
  });   

program
  .command('handled <obj>')
  .description('View Handled items in object')
  .option('-c, --clean', 'Clean al handled items of object, handled items will be saved in ./object_handleds.js', false)
  .action(async (obj, opts) => {
      let res = await comparer.handleds({ obj, ...opts });
      if (res.length === 0) {
          console.log(`Not handled items in object`);
          return null;
      }
      console.log('\n');
      console.log(res);
      console.log(`Total handled items: ${res.length}`);
      if (opts.clean) {
          console.log(`Original Object cleaned of handleds, these ares saved at ./data/${obj}_handleds.js`)
      }
  });

program
  .command('urlErrors <obj>')
  .description('Extract all the urls that match error in Apify log')
  .option('-s, --save', ' ./url_errors.js', false)
  .action(async (obj, opts) => {
        let res = await comparer.urlErrorsFromLog({ obj, ...opts });
        console.log(res);
        
        if (opts.save) console.log(`\nResults saved at ./url_errors.js`);
  });
  
program
  .command('calculeSize <obj>')
  .description('Calcule Size of downloaded content of robot')
  .option('-c, --clean', 'Clean al handled items of object, handled items will be saved in ./object_handleds.js', false)
  .action(async (obj, opts) => {
      let res = await comparer.calculeSize({ obj, ...opts });
      if (res.length === 0) {
          console.log(`Not size object of urls for calcule`);
          return null;
      }
      console.log('\n');
      console.log(res);

      let totalSize = 0;
      res.forEach((request) => {
        totalSize += parseFloat(request.size);
      });

      console.log(`Total urls items: ${res.length}`);
      console.log(`Total bytes downloaded from run: ${totalSize}`);
      if (opts.clean) {
          console.log(`Original Object cleaned of size objects, these ares saved at ./data/${obj}_sizeRequest.js`)
      }
  });
  
program
  .command('specialJoin <obj1>  <obj2>')
  .description('Join two docs with a custom logic objects <obj1> <obj2>')
  .option('-s, --save', 'Save repeated objets in ./Difference_object1_object2.js', false)
  .option('-b, --compareBy <propToCompare>', 'Set a different prop to compare by', 'ProductUrl')
  .action(async (obj1, obj2, opts) => {
      let res = await comparer.specialJoin({ obj1, obj2, ...opts });
      console.log(res);
	  if (opts.save) console.log(`\nResults saved at specialJoin.js`);
  });

program
  .command('toexcel <obj>')
  .description('Generate .xlsx file with object data')
  .action(async (obj, opts) => {
      let res = await comparer.toExcel({ obj, ...opts });
  });

program
  .command('csvToJson <obj>')
  .description('Generate a .json file with csv data file')
  .action(async (obj, opts) => {
      let res = await comparer.csvToJson({ obj, ...opts });

      if (res) {
        console.log(`Saved data in JSON file in ${obj}.json`);
      }
  });

program.parse(process.argv);

