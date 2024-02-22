import "./polyfills";
import express from "express";
import { Database } from "./database";
import { Temporal } from "@js-temporal/polyfill";

// Refactor the following code to get rid of the legacy Date class.
// Use Temporal.PlainDate instead. See /test/date_conversion.spec.mjs for examples.

const createApp = (database: Database) => {
  const app = express();

  app.put("/prices", (req, res) => {
    const type = req.query.type as string;
    const cost = parseInt(req.query.cost as string);
    database.setBasePrice(type, cost);
    res.json();
  });

  app.get("/prices", (req, res) => {
    const age = req.query.age ? parseInt(req.query.age as string) : undefined;
    const type = req.query.type as string;
    const baseCost = database.findBasePriceByType(type)!.cost;
    const date = parseDate(req.query.date as string);
    const plainDate = parsePlainDate(req.query.date as string);
    const cost = calculateCost(age, type, date, plainDate, baseCost);
    res.json({ cost });
  });

  const parseDate = (dateString: string | undefined): Date | undefined => {
    if (dateString) {
      return new Date(dateString);
    }
  };

  const parsePlainDate = (dateString: string | undefined): Temporal.PlainDate | undefined => {
    if (dateString) {
      return Temporal.PlainDate.from(dateString);
    }
  };

  const calculateCost = (age: number | undefined, type: string, date: Date | undefined, plainDate: Temporal.PlainDate | undefined, baseCost: number) => {
    if (type === "night") {
      return calculateCostForNightTicket(age, baseCost);
    } else {
      return calculateCostForDayTicket(age, date, plainDate, baseCost);
    }
  };

  const calculateCostForNightTicket = (age: number | undefined, baseCost: number) => {
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

  const calculateCostForDayTicket = (age: number | undefined, date: Date | undefined, plainDate: Temporal.PlainDate | undefined, baseCost: number) => {
    let reduction = calculatePlainReduction(plainDate);
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


  const calculatePlainReduction = (plainDate: Temporal.PlainDate | undefined) => {
    if (plainDate && isPlainMonday(plainDate) && !isPlainHoliday(plainDate)) {
      return 35;
    }
    return 0;
  };

  const isPlainMonday = (date: Temporal.PlainDate) => date.dayOfWeek === 1;
  const isPlainHoliday = (date: Temporal.PlainDate) => {
    const holidays = database.getHolidays();
    for (let row of holidays) {
      let holiday = Temporal.PlainDate.from(row.holiday);
      if (date && holiday.equals(date)) {
        return true;
      }
    }
    return false;
  };

  const isMonday = (date: Date) => date.getDay() === 1;

  const isHoliday = (date: Date | undefined) => {
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
