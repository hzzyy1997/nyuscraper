const cheerio = require('cheerio');
const axios = require('axios');
const mongoose = require('mongoose');
const fs = require('fs');
const Course = require('./course.model');
const Professor = require('./professor.model');

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

function fatchSingleCourse(baseUrl, courseUrl, course, professor) {
    let promise = new Promise(function (resolve, reject) {
        setTimeout(() => {
            const url = baseUrl + courseUrl
            axios.get(url)
                .then((response) => {
                    const $ = cheerio.load(response.data)
                    const leftElem = $('div.pull-left')
                    const rightElem = $('div.pull-right')
                    const title = $('div.primary-head')
                    const courseCodeSec = $('h1.page-title')
                    course.code = $(courseCodeSec[0]).text().trim()
                    course.name = $(title[0]).text().trim()
                    if (leftElem.length !== rightElem.length) {
                        console.error(`divs dont match at ${url}`);
                    } else {
                        let isClass = false
                        let res = null
                        for (let i = 0; i < leftElem.length; i++) {
                            let varName = $(leftElem[i]).text().trim()
                            let varVal = $(rightElem[i]).text().trim()
                            switch (varName) {
                                case "Session":
                                    if (varVal === "Regular Academic Session") {
                                        isClass = true
                                    }
                                    break;
                                case "Class Number":
                                    course.number = varVal
                                    break;
                                case "Career":
                                    course.level = varVal
                                    break;
                                case "Units":
                                    course.unit = varVal
                                    break;
                                case "Description":
                                    course.description = varVal
                                    break;
                                case "Enrollment Requirements":
                                    course.requirement = varVal
                                    break;
                                case "Notes":
                                    course.note = varVal
                                    break;
                                case "Instructor(s)":
                                    professor.name = varVal
                                    break;
                                case "Topic":
                                    if (varVal[0] !== "R") {
                                        course.topic = varVal
                                    }
                            }
                        }
                        if (isClass) {
                            if (professor.name.includes(',')) {
                                professor.name.split
                            }
                            res = [course, professor]
                        }
                        resolve(res)
                    }
                })
        }, 1000);
    });
    return promise
}

async function storeToDB(course, prof) {
    const findExistingCourse = Course.findOne({name : course.name, major : course.major, school: course.school})
    const findExistingProf = Professor.findOne({name : prof.name})
    await Promise.all([findExistingCourse, findExistingProf]).then(async function(values) {
        const existingCourse = values[0]
        const existingProf = values[1]
        if (existingCourse && existingProf) {
            console.log("info already in db: ", existingCourse.name, " ", existingProf.name)
        } else if (existingCourse) {
            // course already in database
            prof.courses = [existingCourse._id]
            newProf = new Professor(prof)
            savedProf = await newProf.save()
            await Course.findByIdAndUpdate(existingCourse._id, { $addToSet : {profs : savedProf._id } })
            console.log("Course Already Exist: ", existingCourse.name, "Adding ", savedProf.name)
        } else if (existingProf) {
            // professor already in database
            console.log("step:1", existingProf._id)
            course.profs = [existingProf._id]
            newCourse = new Course(course)
            savedCourse = await newCourse.save()
            await Professor.findByIdAndUpdate(existingProf._id, {$addToSet : {courses : savedCourse._id }})
            console.log("Professor Already Exist: ", existingProf.name, "Adding ", savedCourse.name)
        } else {
            // both not  in database
            newProf = new Professor(prof)
            savedProf = await newProf.save()
            newCourse = new Course(course)
            savedCourse = await newCourse.save()
            savedInfo = await Promise.all([savedProf, savedCourse])
            await Course.findByIdAndUpdate(savedInfo[1]._id, { $addToSet : {profs : savedInfo[0]._id } })
            await Professor.findByIdAndUpdate(savedInfo[0]._id, {$addToSet : {courses : savedInfo[1]._id }})
            console.log("Adding: ", savedProf.name, "Adding: ", savedCourse.name)
        }
    });
}


// dbConnection()
// storeToDB(course, prof)

(async() => {
    dbConnection()
    const courseStr = fs.readFileSync("./course_num_clean.txt").toString();
    courseArr = courseStr.split(',')
    console.log(courseArr.length)
    const baseUrl = "https://m.albert.nyu.edu/app/catalog/classsection/NYUNV/1198/"
    const course = {}
    const professor = {}
    for (let i = 0; i < courseArr.length; i++) {
        if (courseArr[i][0] === 'm') {
            course.major = courseArr[i].slice(6,)
        } else if (courseArr[i][0] === 's') {
            course.school = courseArr[i].slice(7,)
            professor.school = courseArr[i].slice(7,)
        } else {
            const info = await fatchSingleCourse(baseUrl, courseArr[i], course, professor)
            if (info) {
                courseInfo = info[0]
                profInfo = info[1]
                storeToDB(courseInfo, profInfo)
            }
        }
    }
})()

// async function testSingle(){
//     const res = await fatchSingleCourse("https://m.albert.nyu.edu/app/catalog/classsection/NYUNV/1204/", "7690", {}, {})
//     console.log(res)
// }

// testSingle()