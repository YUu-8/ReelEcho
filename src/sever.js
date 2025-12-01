const express = require('express');
const bodyParser = require('body-parser');
const favouriteRoutes = require('./favourites.routes');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use('/api/favourites', favouriteRoutes);

app.listen(PORT, () => {
  console.log(`the sever run at http://localhost:${PORT}`);
});