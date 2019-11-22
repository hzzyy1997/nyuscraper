const Course = require('./course.model');
const Professor = require('./professor.model');
const mongoose = require('mongoose');

require('dotenv').config();

function dbConnection() {
    let mongo_uri = process.env.JACK_URL;
    console.log(mongo_uri)
    mongoose.connect(mongo_uri, { useNewUrlParser: true, useCreateIndex: true });
    const connection = mongoose.connection;
    connection.once('open', () => {
        console.log("MongoDB database is connected successfully");
    })
}

dbConnection()

async function changeProf() {
    const profs = await Professor.find({})
    for (professor of profs) {
        const prof = await Professor.findOne({ _id: professor._id }).populate({ path: "courses", select: "school" })
        console.log(prof.courses[0].school)
        await Professor.findOneAndUpdate({ _id: professor._id }, {school : prof.courses[0].school})
    }
}

async function checkProf() {
    const profs = await Professor.find({"school":{ $exists: true } })
    console.log(profs.length)
}

