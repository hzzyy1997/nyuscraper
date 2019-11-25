const fs = require('fs');
const courseStr = fs.readFileSync("./course_num_clean.txt").toString();
const courseArr = courseStr.split(',')
console.log(courseArr.indexOf("10510"))