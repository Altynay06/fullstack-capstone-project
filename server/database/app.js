const express = require('express');
const mongoose = require('mongoose');
const fs = require('node:fs');
const path = require('node:path');
const Reviews = require('./review');
const Dealerships = require('./dealership');
const app = express();
app.use(express.json({limit: '64kb'}));
const route = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
app.get('/', (req, res) => res.json({service: 'Dealerships API', status: 'ok'}));
app.get('/fetchReviews', route(async (req, res) => res.json(await Reviews.find().lean())));
app.get('/fetchReviews/dealer/:id', route(async (req, res) => res.json(await Reviews.find({dealership: Number(req.params.id)}).lean())));
app.get('/fetchDealers', route(async (req, res) => res.json(await Dealerships.find().lean())));
app.get('/fetchDealers/:state', route(async (req, res) => res.json(await Dealerships.find(req.params.state === 'All' ? {} : {state: req.params.state}).lean())));
app.get('/fetchDealer/:id', route(async (req, res) => res.json(await Dealerships.find({id: Number(req.params.id)}).lean())));
app.post('/insert_review', route(async (req, res) => {
  const last = await Reviews.findOne().sort({id: -1}).lean();
  const fields = ['name', 'dealership', 'review', 'purchase', 'purchase_date', 'car_make', 'car_model', 'car_year'];
  const data = Object.fromEntries(fields.map(key => [key, req.body[key]]));
  const result = await Reviews.create({...data, id: (last?.id || 0) + 1});
  res.status(201).json(result);
}));
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.name === 'ValidationError' ? 400 : 500).json({error: 'Unable to process request'});
});
async function start(uri = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/dealershipsDB') {
  await mongoose.connect(uri);
  for (const [Model, filename, key] of [[Dealerships, 'dealerships.json', 'dealerships'], [Reviews, 'reviews.json', 'reviews']]) {
    if (await Model.countDocuments() === 0) {
      const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', filename), 'utf8'));
      await Model.insertMany(data[key]);
    }
  }
  return app.listen(process.env.PORT || 3030, '0.0.0.0', () => console.log('Dealerships API listening on port ' + (process.env.PORT || 3030)));
}
if (require.main === module) start().catch(err => {console.error(err); process.exit(1);});
module.exports = {app, start};
