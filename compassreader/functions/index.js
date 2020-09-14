const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
 
const scraper = require('./compass_scripts/reader')
var cors = require('cors')

const app = express()
app.use(express.json()); //Used to parse JSON bodies
app.use(cors({ origin: true }));

 
app.post('/user/', (request, resolve) => {
	//console.log("Body",request.body)
    const scrapeUser = new Promise((resolve, reject) => {
    scraper
      .scrapeUser(resolve,reject,request )
      .then(data => {
        resolve(data)
      }).catch(err => reject('User Scrape failed'))
    })
	Promise.all([scrapeUser]).then(data => {
      resolve.send(data)
    }).catch(err => resolve.status(500).send(err))
})


app.post('/activeroles', (request, resolve) => {
	//console.log(request.params)
    const scrapeActiveRoles = new Promise((resolve, reject) => {
    scraper
      .scrapeActiveRoles(resolve,reject,request)
      .then(data => {
        resolve(data)
      }).catch(err => reject('User Roles Scrape failed'))
    })
	Promise.all([scrapeActiveRoles]).then(data => {
      resolve.send(data)
    }).catch(err => resolve.status(500).send(err))
})

app.post('/allroles', (request, resolve) => {
	//console.log(request.params)
    const scrapeAllRoles = new Promise((resolve, reject) => {
    scraper
      .scrapeAllRoles(resolve,reject,request)	
      .then(data => {
        resolve(data)
      }).catch(err => reject('User Roles Scrape failed'))
    })
	Promise.all([scrapeAllRoles]).then(data => {
      resolve.send(data)
    }).catch(err => resolve.status(500).send(err))
})


app.post('/role/:rid/user/:uid', (request, resolve) => {
	//console.log(request.params)
    const scrapeUser = new Promise((resolve, reject) => {
    scraper
      .scrapeUser(resolve,reject,request)
      .then(data => {
        resolve(data)
      }).catch(err => reject('User Scrape failed'))
    })
	Promise.all([scrapeUser]).then(data => {
      resolve.send(data)
    }).catch(err => resolve.status(500).send(err))
})

app.post('/role/:rid/users/', (request, resolve) => {
	//console.log(request.params)
    const scrapeUsers = new Promise((resolve, reject) => {
    scraper
      .scrapeUsers(resolve,reject,request)
      .then(data => {
        resolve(data)
      }).catch(err => reject('User Scrape failed'))
    })
	Promise.all([scrapeUsers]).then(data => {
      resolve.send(data)
    }).catch(err => resolve.status(500).send(err))
})

app.post('/role/:rid/reports/', (request, resolve) => {
	//console.log(request.params)
    const scrapeReports = new Promise((resolve, reject) => {
    scraper
      .scrapeReports(resolve,reject,request)
      .then(data => {
        resolve(data)
      }).catch(err => reject('Report List Scrape failed'))
    })
	Promise.all([scrapeReports]).then(data => {
      resolve.send(data)
    }).catch(err => resolve.status(500).send(err))
})

app.post('/role/:rid/report/:rep', (request, resolve) => {
	//console.log(request.params)
    const scrapeReport = new Promise((resolve, reject) => {
    scraper
      .scrapeReport(resolve,reject,request)
      .then(data => {
        resolve(data)
      }).catch(err => reject('Report Scrape failed'))
    })
	Promise.all([scrapeReport]).then(data => {
      resolve.send(data)
    }).catch(err => resolve.status(500).send(err))
})

app.post('/logon', (request, resolve) => {
	//console.log(request.params)
    const dologon = new Promise((resolve, reject) => {
    scraper
      .logon(resolve,reject,request)
      .then(data => {
        resolve(data)
      }).catch(err => reject('Logon failed'))
    })
	Promise.all([dologon]).then(data => {
      resolve.send(data)
    }).catch(err => resolve.status(500).send(err))
})

app.post('/role/:rid/userhierarchy/:uid', (request, resolve) => {
	//console.log(request.params)
    const dohier = new Promise((resolve, reject) => {
    scraper
      .scrapeHierarchy(resolve,reject,request)
      .then(data => {
        resolve(data)
      }).catch(err => reject('Logon failed'))
    })
	Promise.all([dohier]).then(data => {
      resolve.send(data)
    }).catch(err => resolve.status(500).send(err))
})

app.post('/role/:rid/useraddress/:uid', (request, resolve) => {
	//console.log(request.params)
    const doaddress = new Promise((resolve, reject) => {
    scraper
      .scrapeAddress(resolve,reject,request)
      .then(data => {
        resolve(data)
      }).catch(err => reject('Logon failed'))
    })
	Promise.all([doaddress]).then(data => {
      resolve.send(data)
    }).catch(err => resolve.status(500).send(err))
})

app.post('/userhierarchy/', (request, resolve) => {
	//console.log(request.params)
    const dohier = new Promise((resolve, reject) => {
    scraper
      .scrapeHierarchy(resolve,reject,request)
      .then(data => {
        resolve(data)
      }).catch(err => reject('Logon failed'))
    })
	Promise.all([dohier]).then(data => {
      resolve.send(data)
    }).catch(err => resolve.status(500).send(err))
}) 
 
 
exports.compass = functions.runWith({ memory: '2GB' }).https.onRequest(app);
