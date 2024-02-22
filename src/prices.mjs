import './polyfills';
import express from 'express';
import { Temporal } from '@js-temporal/polyfill';

// Refactor the following code to get rid of the legacy Date class.
// Use Temporal.PlainDate instead. See /test/date_conversion.spec.mjs for examples.

const createApp = database => {
  const app = express();

  app.put('/prices', (req, res) => {
    const type = req.query.type;
    const cost = parseInt(req.query.cost);
    database.setBasePrice(type, cost);
    res.json();
  });

  app.get('/prices', (req, res) => {
    const age = req.query.age ? parseInt(req.query.age) : undefined;
    const type = req.query.type;
    const baseCost = database.findBasePriceByType(type).cost;
    const date = parseDate(req.query.date);
    const plainDate = parsePlainDate(req.query.date);
    const cost = calculateCost(age, type, date, baseCost, plainDate);
    res.json({ cost });
  });

  const parseDate = dateString => {
    if (dateString) {
      return new Date(dateString);
    }
  };

  const parsePlainDate = dateString => {
    return dateString && Temporal.PlainDate.from(dateString);
  };

  const calculateCost = (age, type, date, baseCost, plainDate) => {
    if (type === 'night') {
      return calculateCostForNightTicket(age, baseCost);
    } else {
      return calculateCostForDayTicket(age, date, baseCost, plainDate);
    }
  };

  const calculateCostForNightTicket = (age, baseCost) => {
    if (age === undefined) {
      return 0;
    }
    if (age < 6) {
      return 0;
    }
    if (age > 64) {
      return Math.ceil(baseCost * 0.4);
    }
    return baseCost;
  };

  const calculateCostForDayTicket = (age, date, baseCost, plainDate) => {
    console.log('TEMPORAL DATE: ', plainDate);
    let reduction = calculateReduction(date);
    let otherReduction = calculateOtherReduction(plainDate);
    console.log('OTHER REDUCTION: ' + otherReduction);
    if (age === undefined) {
      return Math.ceil(baseCost * (1 - reduction / 100));
    }
    if (age < 6) {
      return 0;
    }
    if (age < 15) {
      return Math.ceil(baseCost * 0.7);
    }
    if (age > 64) {
      return Math.ceil(baseCost * 0.75 * (1 - reduction / 100));
    }
    return Math.ceil(baseCost * (1 - reduction / 100));
  };

  const calculateOtherReduction = date => {
    let reduction = 0;
    if (date && isPlainMonday(date)) {
      reduction = 35;
    }
    return reduction;
  };

  const calculateReduction = date => {
    let reduction = 0;
    if (date && isMonday(date) && !isHoliday(date)) {
      reduction = 35;
    }
    return reduction;
  };

  const isPlainMonday = (date) => date.dayOfWeek === 1;

  const isPlainHoliday = (date) => {
    const holidays = database.getHolidays();
    for (let row of holidays) {
      let holiday = new Date(row.holiday);
    }

  };

  const isMonday = date => date.getDay() === 1;

  const isHoliday = date => {
    const holidays = database.getHolidays();
    for (let row of holidays) {
      let holiday = new Date(row.holiday);
      if (
        date &&
        date.getFullYear() === holiday.getFullYear() &&
        date.getMonth() === holiday.getMonth() &&
        date.getDate() === holiday.getDate()
      ) {
        return true;
      }
    }
    return false;
  };

  return app;
};

export { createApp };
