const fn = require('./scheduler');
require('dotenv').config();

const env = {
    secrets: Object.assign({}, process.env)
};

function callback(err, result) {
    if (err) {
        console.log("Failed");
        console.error(err);
        return;
    }
    console.log("Successful");
    console.dir(result);
}

fn(env, callback);