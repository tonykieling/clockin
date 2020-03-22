const mongoose  = require("mongoose");

const Invoice   = require("../models/invoice.js");
const Clockin   = require("../models/clockin.js");
// const User      = require("../models/user.js");
// const Client    = require("../models/client.js");

// https://youtu.be/YK-GurROGIg
// @ts-check    // it makes the type checking mandatory for that piece of code
// @type {Array<number>}
// @type {{id: number, anotherField: string, oneMore: number|boolean}}   //=> it should be place just before an object declaration
// templates:
  // node_modules/jsdoc/templates // copy the default and paste it into the the code for a new directory
  // go to jsdoc.json and set the template as:
    // "template": "name-of-the-dir"   / this should be inside "opts"

/**
 * it gets all users from the system - on purpose with no auth
 * @param {[String]} req.headers.authorization 
 * @param {*} res 
 * @returns
 */
const get_all = async (req, res) => {
console.log("GET_ALL Invoices");
  const userAdmin = req.userData.admin;
  const userId    = req.userData.userId;
  const 
    clientId  = req.query.clientId,
    dateStart = new Date(req.query.dateStart || "2000-03-01T09:00:00.000Z"),
    dateEnd   = new Date(req.query.dateEnd || "2100-03-01T09:00:00.000Z");

  try {
    let allInvoices = null;
    if (userAdmin)
      allInvoices = await Invoice
        .find()
        .select(" date date_start date_end notes total_cad user_id status ");
    else
      allInvoices = await Invoice
        .find({ 
          user_id   : userId,
          client_id : clientId,
          date: {
            $gte: dateStart,
            $lte: dateEnd
          },
        })
        // .select(" date date_start date_end notes total_cad status code")
        .sort({date: 1});

    if (!allInvoices || allInvoices.length < 1)
      return res.status(200).json({
        message: `No Invoices at all.`
      });

    res.status(200).json({
      count: allInvoices.length,
      allInvoices
    });
  } catch(err) {
    console.log("Error => ", err.message);
    res.status(422).json({
      error: "EIGA01: Something got wrong."
    });
  }
}


// it gets one user - on purpose with no auth
const get_one = async (req, res) => {
  const invoiceId  = req.params.invoiceId;
  const userAdmin  = req.userData.admin;
  const userId     = req.userData.userId;  
  
  try {
    const invoice = await Invoice
      .findById(invoiceId)
      .select(" date date_start date_end notes total_cad user_id ");

    if (!invoice || invoice.length < 1)
      return res.status(409).json({
        error: `EIGO01: Invoice <id: ${invoiceId}> does not exist.`
      });
    if (userId !== invoice.user_id && !userAdmin)
      return res.status(409).json({
        error: `EIGO02: Invoice <id: ${invoiceId}> belongs to another user.`
      });

    res.status(200).json({
      message: invoice
    });
  } catch(err) {
    console.log("Error => ", err.message);
    if (invoiceId.length !== 24)
      return res.status(422).json({
        error: "EIGO02: invoiceId mystyped."
      });  
    res.status(422).json({
      error: "EIGO03: Something got wrong."
    });
  }
}


// it creates a invoice document on mongoDB
/* 
list of actions:
 1- validate User
 2- validate Client
 - list of clockins for the data range
 - grab the total_cad
 - generate invoice_id
 - write down the total_cad in the invoice
 - write down the invoice_id in each clockin
*/
const invoice_add = async (req, res) => {
console.log("Inside Invoice_add");

  const {
    dateStart,
    dateEnd,
    notes,
    clientId,
    code
  } = req.body;
  const date = req.body.date ? new Date(req.body.date) : new Date();

  const userId      = req.userData.userId;
  const checkUser   = require("../helpers/user-h.js");
  // it checks whether user is OK and grab info about them which will be used later
  const temp_user   = await checkUser.check(userId);
  if (!temp_user.result)
    return res.send({
      error: temp_user.message
    });
  const userExist   = temp_user.checkUser;

  // it checks whether client is OK and grab info about them which will be used later
  const client_id     = req.body.clientId;
  const checkClient   = require("../helpers/client-h.js");
  const temp_client   = await checkClient.check(client_id, userId);
  if (!temp_client.result)
    return res.send({
      error: temp_client.message || temp_client.text
    });
  const clientExist   = temp_client.checkClient;


  let clockins = [];
  try {
    clockins = await Clockin
      .find({
        client_id: clientId,
        user_id: userId,
        date: {
          $gte: dateStart,
          $lte: dateEnd
        }
      });

    if (clockins.length < 1)
      return res.status(208).json({
        message: "No clockins at all.",
        user: userExist.name,
        client: clientExist.name
      });

  } catch(err) {
    return res.status(409).json({
      error: `EIADD06: Something got wrong.`
    });
  }


  // lets record invoice after User and Client validation
  try {
    const newInvoice = new Invoice({
      _id: new mongoose.Types.ObjectId(),
      date,
      date_start: dateStart,
      date_end: dateEnd,
      notes,
      status: "Generated",
      total_cad: 0,
      code,
      client_id: clientId,
      user_id: userId
    });

    await newInvoice.save();

    let totalCadTmp = 0;
    clockins.forEach(async (clockin, i) => {
      totalCadTmp += clockin.worked_hours 
                      ? ((clockin.worked_hours / 3600000) * clockin.rate)
                      : ((clockin.time_end - clockin.time_start) / 3600000) * clockin.rate;
/**
 * the line above should be changed for just take worked_hours whrn all current clockins hav generated invoices
 * deadline = march-2020
 */
      await Clockin
        .updateOne({
          _id: clockin._id
        }, {
          $set: {
            invoice_id: newInvoice._id
          }
        });
    })

    await Invoice
      .updateOne({
        _id: newInvoice._id
      }, {
        $set: {
          total_cad: totalCadTmp.toFixed(2)
        }
      });

    return res.json({
      message: `Invoice <${newInvoice._id}> has been created.`,
      user: userExist.name,
      client: clientExist.name
    });

  } catch(err) {
    console.trace("Error: ", err.message);
    res.status(422).json({
      error: "EIADD07: Something wrong with invoice's data."
    });
  };
}


// Jan 4th-DEFINITION: Invoice CANNOT be mofified. If something to change, delete and generate a new one.
// ONLY to change Invoice's status (Generated, Delivered and Received)
// change user data
// input: token, which should be admin
// TODO: the code has to distinguish between admin and the user which has to change their data (only email or email
// for now, only ADMIN is able to change any user's data
const invoice_modify_status = async (req, res) => {
  console.log("inside modify Invoice");
  const invoiceId  = req.params.invoiceId;
  const userAdmin = req.userData.admin;
  const userId    = req.userData.userId;  

  // this try is for check is the invoiceId passed from the frontend is alright (exists in database), plus
  //  check whether either the invoice to be changed belongs for the user or the user is admin - if not, not allowed to change invoice's data
  let invoice = "";
  try {
    invoice = await Invoice
      .findById(invoiceId);
    if (!invoice)
      return res.json({
        error: `Invoice <id: ${invoice.code}> does not exist.`
      });
      
    if ((userId != invoice.user_id) && !userAdmin)
      return res.json({
        error: `Invoice <id: ${invoice.code}> belongs to another user.`
      });

  } catch(err) {
    console.log("Error => ", err.message);
    return((invoiceId.length !== 24) 
      ? res.json({
        error: "InvoiceId mystyped."
      })
      : res.json({
        error: "EIMS: Something got wrong."
      })
    );
  }


  const status = req.body.newStatus;
// console.log("***req.body", req.body)
// if (1) return res.send({message: "OK"});
  try {
    const invoiceToBeChanged = req.body.dateDelivered
      ?
        await Invoice
        .updateOne({
          _id: invoiceId
        }, {
          $set: {
              status,
              date_delivered: req.body.dateDelivered
          }
        })
        //  {
        //   runValidators: true
        // })
      :
        await Invoice
        .updateOne({
          _id: invoiceId
        }, {
          $set: {
              status,
              date_received: req.body.dateReceived
          }
        })
        // , {
        //   runValidators: true
        // })

    if (invoiceToBeChanged.nModified) {
      return res.json({
        message: `Invoice <${invoice.code}> has been modified.`
      });
    } else
      res.json({
        error: `Invoice <${invoice.code}> not changed.`
      });

  } catch(err) {
    console.trace("Error: ", err.message);
    res.json({
      error: "ECM02: Something bad"
    });
  }
}




// Jan 4th-DEFINITION: Invoice CANNOT be mofified. If something to change, delete and generate a new one.
// ONLY to change Invoice's status (Generated, Delivered and Received)
// change user data
// input: token, which should be admin
// TODO: the code has to distinguish between admin and the user which has to change their data (only email or email
// for now, only ADMIN is able to change any user's data
const invoice_edit = async (req, res) => {
  console.log("======== inside edit Invoice");
  // const invoiceId  = req.params.invoiceId;
  const userAdmin = req.userData.admin;
  const {
    invoiceId,
    code,
    cad_adjustment,
    reason_adjustment
  } = req.body;

  const userId      = req.userData.userId;
  // const checkUser   = require("../helpers/user-h.js");
  // // it checks whether user is OK and grab info about them which will be used later
  // const temp_user   = await checkUser.check(userId);
  // if (!temp_user.result)
  //   return res.send({
  //     error: temp_user.message
  //   });
  // const userExist   = temp_user.checkUser;
// console.log("userExist", userExist)

/**DO NOT NEED TO CHECK CLIENT */
  // it checks whether client is OK and grab info about them which will be used later
//   const client_id     = req.body.clientId;
//   const checkClient   = require("../helpers/client-h.js");
//   const temp_client   = await checkClient.check(client_id, userId);
//   if (!temp_client.result)
//     return res.send({
//       error: temp_client.message || temp_client.text
//     });
//   const clientExist   = temp_client.checkClient;
// console.log("clientExist", clientExist)

  // if (1) return res.send({ error: `req.body`});


  // this try is for check is the invoiceId passed from the frontend is alright (exists in database), plus
  //  check whether either the invoice to be changed belongs for the user or the user is admin - if not, not allowed to change invoice's data
  let invoice = "";
  try {
    invoice = await Invoice
      .findById(invoiceId);
    if (!invoice)
      return res.json({
        error: `Invoice <id: ${invoice.code}> does not exist.`
      });
      
    if ((userId != invoice.user_id) && !userAdmin)
      return res.json({
        error: `Invoice <id: ${invoice.code}> belongs to another user.`
      });

  } catch(err) {
    console.log("Error => ", err.message);
    return((invoiceId.length !== 24) 
      ? res.json({
        error: "InvoiceId mystyped."
      })
      : res.json({
        error: "EIMS: Something got wrong."
      })
    );
  }


  
// if (1) return res.send({message: "OK"});
  try {
    const invoiceToBeEdited = await Invoice
        .updateOne({
          _id: invoiceId
        }, {
          $set: {
              code,
              cad_adjustment,
              reason_adjustment,
          }
        })
        //  {
        //   runValidators: true
        // })
        
    if (invoiceToBeEdited.nModified) {
      return res.json({
        message: `Invoice <${invoice.code}> has been modified.`
      });
    } else
      res.json({
        error: `Invoice <${invoice.code}> not changed.`
      });

  } catch(err) {
    console.trace("Error: ", err.message);
    res.json({
      error: "Error ECE02: Something bad"
    });
  }
}





// FIRST it needs to check whether the user is admin or the clockin belongs to the user which is proceeding
const invoice_delete = async (req, res) => {
  const invoiceId = req.params.invoiceId;
  // const userId    = req.userData.userId;
  // const userAdmin = req.userData.admin;
// console.log("-----------------------");
// console.log(invoiceId);
// return res.send({message: "deleted!!"});
  try {
    // const invoiceToBeDeleted;
    await Invoice
      .deleteOne({ _id: invoiceId});
// console.log("invoiceToBeDeleted", invoiceToBeDeleted);

    const clockinsUpdated = await Clockin
      .updateMany(
        { invoice_id: invoiceId}, 
        { $unset: 
          { invoice_id: 1}
        }
      );
// console.log("clockinsUpdated==>", clockinsUpdated.n, clockinsUpdated.nModified);

    // if (!invoiceToBeDeleted || invoiceToBeDeleted.length < 1)
    //   return res.send({
    //     error: `Error EIDE01: Invoice <${invoiceId} NOT found.`
    //   });

    // if ((userId != invoiceToBeDeleted.user_id) && (!userAdmin))
    //     return res.send({
    //       error: `Error EIDE02: Invoice <${invoiceId}> does not belong to User <${userId}>.`
    //     });

    return res.send({message: "OK"});

  } catch(err) {
    console.log("Error:", err.message);
    return res.send({
      error: `EIDE03: Something went wrong.`
    });
  }

  // try {
  //   const clockinDeleted = await Invoice
  //     .deleteOne({ _id: invoiceId});

  //   if (clockinDeleted.deletedCount)
  //     return res.status(200).json({
  //       message: `Invoice <${invoiceId}> has been deleted`
  //     });
  //   else
  //     throw Error;
  // } catch (err) {
  //   res.status(404).json({
  //     error: `EIDE04: Something bad with Invoice id <${invoiceId}>`
  //   })
  // }
}


module.exports = {
  get_all,
  get_one,
  invoice_add,
  invoice_modify_status,
  invoice_edit,
  invoice_delete
}