#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/gddy.sqlite');
const fs = require('fs');
const sql = fs.readFileSync('./db/seed_database.sql', 'utf8');

async function migrate() {
  await db.exec(sql, (err) => {
    if (err) {
      console.log(err.message);
      process.exit(1);
    }
  });
  console.log('Database seeded');
}

migrate()
  .catch((err) => {
    console.log(err.message);
  })
  .finally(() => {
    db.close();
  });

