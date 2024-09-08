const fs = require('fs');

const toursFile = `${__dirname}/../dev-data/data/tours-simple.json`;
let tours = [];
try {
  tours = JSON.parse(fs.readFileSync(toursFile));
} catch (error) {
  console.error('Failed to read or parse the JSON file:', error);
}

// MiddleWare function to check IDs
exports.checkID = (req, res, next, val) => {
  console.log(`From checkID Middleware ${val}`);
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'invalid ID',
    });
  }
  next();
};

// check body middleware
exports.checkBody = (req, res, next) => {
  console.log(`from check body`);
  // Check if the body has tourName and tourPrice properties
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'fail',
      message: 'name or price or both were not found',
    });
  }
  next();
};
// If not send back 400 status
// Add to post handle stack

// Tour Route Handlers
exports.getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours: tours },
  });
};

exports.getTour = (req, res) => {
  const id = req.params.id * 1;
  const tour = tours.find((el) => el.id === id);
  if (!tour) return res.status(400).json({ status: 'tour not found' });
  res.status(200).json({
    status: 'success',
    data: { tour },
  });
};

exports.createTour = (req, res) => {
  // write in to file
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);
  tours.push(newTour);
  fs.writeFile(toursFile, JSON.stringify(tours), (err) => {
    res.status(201).json({ status: 'success', data: { tour: newTour } });
  });
};

exports.updateTour = (req, res) => {
  const id = req.params.id * 1;
  const tour = tours.find((el) => el.id === id);
  const newTour = { ...tour, ...req.body };
  tours.map((tour) => {
    if (tour.id === id) return { ...tour, ...req.body };
    return tour;
  });
  fs.writeFile(toursFile, JSON.stringify(tours), (err) => {
    res.status(204).json({
      status: '<tour changed>',
      data: { tours: newTour },
    });
  });
};
