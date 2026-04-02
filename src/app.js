const express = require('express');

const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const passport = require('passport');
const httpStatus = require('http-status');
const multer = require('multer');
const bodyParser = require("body-parser");
const config = require('./config/config');
const morgan = require('./config/morgan');
const { jwtStrategy } = require('./config/passport');
const { authLimiter } = require('./middlewares/rateLimiter');
const routes = require('./routes/v1');
const path = require('path');

const forms = multer();
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');
const { actionLogger } = require('./middlewares/actionLog')
// const auth = require('./middlewares/auth');
const mime = require("mime-types");

const app = express();
if (config.env !== 'test') {
    app.use(morgan.successHandler);
    app.use(morgan.errorHandler);
}


app.use(cors({
    origin: true, // Hoặc 'http://localhost:3003'
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));
app.options('*', cors());

// set security HTTP headers
app.use(helmet());
app.use(bodyParser.json());
// parse json request body
app.use(express.json());
// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));
// app.use(forms.any());
// sanitize request data
app.use(xss());
app.use(mongoSanitize());
// gzip compression
app.use(compression());

// enable cors
// app.use(cors());
// app.options('*', cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

//logger
app.use(actionLogger());

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
    app.use('/v1/auth', authLimiter);
}
// v1 api routes
app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
    next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

app.use(express.json({ limit: '100kb' }));

// Error handling middleware
app.use((err, req, res, next) => {
    if (err.status === 413) {
        return res.status(413).json({ message: 'Payload too large' });
    }
    next(err);
});

module.exports = app;
