const PORT = 3411

const express = require('express');
const app = express();

const router = require('./routers/main');
app.use(router);

app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
})