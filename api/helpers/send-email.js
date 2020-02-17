require('dotenv').config();
const formatDT = require("./formatDT.js");

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.user,
    pass: process.env.password
  }
});


const sendClockinEmail = (subject, clockin, user, client) => {
  const content = (`
    <div>
      <p>Hi <b>${user.name.split(" ")[0]}</b></p>
      <p>You have just punched in the following data:</p>
      <br>
      <p> <b>- Client: <i>${client.nickname} </i></b></p>
      <p> <b>- Date: <i>${formatDT.showDate(clockin.date)} </i></b></p>
      <p> <b>- Time start: <i>${formatDT.showTime(clockin.time_start)} </i></b></p>
      <p> <b>- Time end: <i>${formatDT.showTime(clockin.time_end)} </i></b></p>
      ${clockin.break_start 
        ? `<p> <b>- Break Start: <i>${formatDT.showTime(clockin.break_start)} </i></b></p>`
        : ""}
      ${clockin.break_end 
        ? `<p> <b>- Break End: <i>${formatDT.showTime(clockin.break_end)} </i></b></p>`
        : ""}
      <p> <b>- Worked hours: <i>${formatDT.showTime(clockin.worked_hours)} </i></b></p>
      <p> <b>- Rate: <i>${clockin.rate} </i></b></p>
      <p> <b>- Notes: <i>${clockin.notes ? clockin.notes : "&lt;empty&gt;"} </i></b></p>
      <br>
      <p>Kind regards from</p>
      <h4>Clockin.js Team :)</h4>
    </div>
  `);
  
  generalSender(user.email, subject, content);
}


const sendResetPassword = (subject, user, code) => {

  const content = (`
    <div>
      <p>Hi <b>${user.name.split(" ")[0]}</b></p>
      <p>Recently you asked to reset your password.</p>
      <p>Click on <a href="https://clockinjs.herokuapp.com/reset_password/${code}">reset password</a> to proceed.</p>
      <br>
      <p>Please, disregard this message in case you do not intend to change your password.</p>
      <br>
      <p>Kind regards from</p>
      <h4>Clockin.js Team :)</h4>
    </div>
  `);

  generalSender(user.email, subject, content);
}


/**
 * this method is called when a new user is signed up
 * it is used to advise and let me knwo so I can add the nes user as mailgun authorized recipient
 * the caller method need to pass only the new user object
 *  */
const gotNewUser = user => {
  const content = (`
    <div>
      <p>New user</p>
      <p><b>${user}</b></p>
      <br>
      <p>Kind regards from</p>
      <h4>Clockin.js Team :)</h4>
    </div>
  `);

  generalSender("tony.kieling@gmail.com", "!!!!! Clockin.js got a new user", content);
}


/**
 * it send a welcome message to the new user
 */
const welcomeEmail = (user, to) => {
  const content = (`
    <div>
      <p>Hi ${user.split(" ")[0]}.</p>
      <p>Welcome to Clockin.js</p>
      <br>
      <p>Kind regards from</p>
      <h4>Clockin.js Team :)</h4>
    </div>
  `);

  generalSender(to, "Welcome - Clockin.js", content);
};



const generalSender = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from  : "Clockin.js<clockin.js@gmail.com>",
      to,
      subject,
      html,
    });
  } catch (err) {
    console.log(`Error in GeneralSender`);
  }
}


module.exports = {
  sendClockinEmail,
  sendResetPassword,
  gotNewUser,
  welcomeEmail
};
