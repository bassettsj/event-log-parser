'use strict';

import fs from 'fs';
import path from 'path';
import promisify from 'es6-promisify';
import {
  groupBy,
  forEach,
  camelCase,
  merge
} from 'lodash';
import csv from 'csv';

let readFile = promisify(fs.readFile);
let csvParse = promisify(csv.parse);
let writeFile = promisify(fs.writeFile);

let csvPromise = readFile(path.join(__dirname, '/../event-logs.csv'), {encoding: 'utf8'})
  .then((data) => csvParse(data, {columns: true}))
  .then((rows)=> {
    rows = rows.map((row) => {
      row.group = camelCase(row.group);
      return row;
    });

    let grouped = groupBy(rows, 'group');
    forEach(grouped, (group, i)=>  {
      let obj = {};
      group.forEach((item)=> {
        obj[item.key] = item;
        delete item.key;
      });
      grouped[i] = obj;
    });
    return grouped;
  })
  .catch(console.error);


let eventLogJsonPromise = readFile(path.join(__dirname, '/../event-logs.json'), {encoding: 'utf8'})
  .then((data)=> JSON.parse(data))
  .catch(console.error);


Promise.all([eventLogJsonPromise, csvPromise])
  .then((results) => {
    let [eventLog, csv] = results;
    let merged = merge(eventLog, csv);
    return merged;
  })
  .then((obj)=> JSON.stringify(obj, null, 4))
  .then((data)=> writeFile(path.join(__dirname, '/../results.json'), data, {encoding: 'utf8'}))
  .catch(console.error);
