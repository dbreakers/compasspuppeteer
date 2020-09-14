const puppeteer = require('puppeteer');

const do_logon = async (res,req,r,browser,page) => {
	//const navigationPromise = page.waitForNavigation();
	await page.goto('https://compass.scouts.org.uk/');
	//await page.type('[type="text"]', _request.query.name);
	await page.type('[type="text"]', r.body.user  ); //
	 
	await page.type('[type="password"]', r.body.password);
	 
	await  page.click('.btn')
	await page.waitForNavigation(); 
	//await page.goto('https://compass.scouts.org.uk/MemberProfile.aspx');
}


const open_browser = async () => {
	return await puppeteer.launch({headless:true,devtools:false , args:	[
                '--disable-gpu',
                '--disable-setuid-sandbox',
                '--no-sandbox',	
                '--proxy-server="direct://"',
                '--proxy-bypass-list=*',
				'--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
        '--single-process'
    ]});
}

const logon = async (res,req,r) => {
	const browser = await open_browser();				
	const page = await browser.newPage();
    await page.goto('https://compass.scouts.org.uk/');
	await page.type('[type="text"]', r.body.user);
	await page.type('[type="password"]', r.body.password);
	await  page.click('.btn');
	await page.waitForNavigation();	 	
    await page.waitForNavigation();	 	
	var btn = await page.$$('.btn');
	await browser.close()
	return (btn.length );
}

const scrapeActiveRoles = async (res,req,r) => {
	const browser = await open_browser();
//				console.log("In function",r );	
	const page = await browser.newPage();
	await do_logon(res,req,r,browser,page)
	await page.goto('https://compass.scouts.org.uk/MemberProfile.aspx');
	const name = await page.evaluate(() => {
		  
			return document.querySelectorAll(".clicktitle")[0].innerHTML; 
		})
	const roles = await page.evaluate(() =>	 {
	  return Array.from(document.getElementById('ctl00_UserTitleMenu_cboUCRoles').options, opt=>({"roleid" : opt.value, "roledescription" : opt.innerText}))
	})
	return {"roles" : roles, "name" : name}
}

const scrapeAllRoles = async (res,req,r) => {
	var stripblanks = 	function (data2) {  
							for(var i=data2.length;i>0;i--){
								if (data2[i-1].length===0) {
									data2.splice(i-1, 1);
								}  
							} 
						}  
	const browser = await open_browser();
	const page = await browser.newPage();
	await do_logon(res,req,r,browser,page)
	await page.goto('https://compass.scouts.org.uk/MemberProfile.aspx');
	var cn = await 	page.evaluate(() => {		 
						return document.querySelectorAll("#myCN")[0].value; 			
					})
		
	await page.goto('https://compass.scouts.org.uk/MemberProfile.aspx?CN='+cn+'&Page=ROLES&TAB');
	 
	const data = await page.evaluate(() => {
	 
	  var fieldlist = ['role','class','location','start','end','status','options','active','roleid'];
	  var rows = document.querySelectorAll('#tbl_p3_roles tr');
	  console.log(rows.length);
	  return Array.from(rows, row => {
		  
		  var cl = row.classList;
		  var cla = Array.from(cl)
		  var classf = cla.find(t=>t == 'msTRRL')
		   
		  if(classf == 'msTRRL') {
		    const columns = row.querySelectorAll('td');
			r = Array.from(columns, column => column.innerText);
			if (cla.find(t=>t=='ROLE_HIDEME') == undefined) {r.push(false)} else {r.push(true)}
			r.push(row.getAttribute("data-pk"))
			v2 = new Object;
			for(var m=0; m < r.length; m++) { v2[fieldlist[m]] = r[m];}
			return v2;
		  } else {return []}
	    })
	  })
	  
	 
      stripblanks(data);
	  return data;
	
}

const scrapeHierarchy2 = async (res,req,r) => {
	const browser = await open_browser();
	const page = await browser.newPage();
	await do_logon(res,req,r,browser,page)
	await page.goto('https://compass.scouts.org.uk/MemberProfile.aspx');
	const getcn = async (page,r) => { 
		if (r.params.hasOwnProperty('rid')) {		 
			await page.select('#ctl00_UserTitleMenu_cboUCRoles', r.params.rid);
			var cn = r.params.uid;
		} else {		
			var cn = await page.evaluate(() => {
				return document.querySelectorAll("#myCN")[0].value; 
			})
		}
		return cn;
		}
	const cn = await getcn(page,r);
	await page.goto('https://compass.scouts.org.uk/MemberProfile.aspx?CN='+cn+'&Page=ROLES&TAB');
	var roledetails = new Object
	var rows = await page.$$('#tbl_p3_roles tr.msTRRL input.VIEWROLE')
	for (var i=0;i<rows.length;i++) {
		await page.goto('https://compass.scouts.org.uk/MemberProfile.aspx?CN='+cn+'&Page=ROLES&TAB');
		await 	page.evaluate((i) => { 
					let elements = document.querySelectorAll('#tbl_p3_roles tr.msTRRL input.VIEWROLE');
					$(elements[i ]).click();  	
				},i)
		var frame = page.mainFrame().childFrames()[0];
		await frame.waitForSelector('#ctl00_workarea_txt_p1_membername',{visible:true});
		text = 	await frame.evaluate((i) => {
					return Array.from(document.querySelectorAll('#mpage1 tr td select'),a=>{return [a.id||a.classList,a.options[a.options.selectedIndex].innerText,a.value]})
				},i);        
		r =  await page.evaluate((i) => {let elements = document.querySelectorAll('#tbl_p3_roles tr.msTRRL'); return elements[i].getAttribute("data-pk")},i)
		roledetails[r]=text;
	}
	await browser.close(); 
	return roledetails
}

const  scrapeUser = async (res,req,r) => {
	const browser = await open_browser();
//				console.log("In function",r );	
	const page = await browser.newPage();
	await do_logon(res,req,r,browser,page)
		await page.goto('https://compass.scouts.org.uk/MemberProfile.aspx');
    const getcn = async (page,r) => { 
   // console.log(r);
	
	if (r.params.hasOwnProperty('rid')) {		 
		 await page.select('#ctl00_UserTitleMenu_cboUCRoles', r.params.rid);
		 var cn = r.params.uid;
    } else 
    {		
	 
		var cn = await page.evaluate(() => {
		 
			return document.querySelectorAll("#myCN")[0].value; 
			
		})
		
	}
	 
	return cn;
	}
	const cn = await getcn(page,r);
	 //await page.waitForNavigation(); 
	 
	await page.goto('https://compass.scouts.org.uk/MemberProfile.aspx?CN='+cn+'&Page=TRAINING&TAB');
	const data = await page.evaluate(() => {
	  var fieldlist = ['role','start','status','location','ta','completed','blank','roleid','ta_number','ta_name'];
	  var rows = document.querySelectorAll('#tbl_p5_TrainModules tr');
	 
	  return Array.from(rows, row => {
		if(row.className==="msTR") {
			const columns = row.querySelectorAll('td');
			r = Array.from(columns, column => column.innerText);
			r.push(row.querySelectorAll('input')[0].id.substring(8,20))
			v2 = new Object;
			for(var m=0; m < r.length; m++) {
			//	  console.log(fieldlist[m]);
				  v2[fieldlist[m]] = r[m];
				}
			return v2;
		} else {return []}      
	  });    
	});     

	var stripblanks = function (data2) {  
		for(var i=data2.length;i>0;i--){
			if (data2[i-1].length===0) {
				data2.splice(i-1, 1);
			}  
		} 
	}  

	stripblanks(data);
    const pta = await page.evaluate(() => {
		var ptas =  new Object;
		var plps = new Object;
			var rows = document.querySelectorAll('#tbl_p5_TrainModules tr');
  	    for(var i=0; i<rows.length;i++) {
		if (rows[i].className.substring(0,12)==="trPLP trPLP_") {
			var	role = rows[i].className.substring(12,20);  
			ptas[role] = Array.from(rows[i+2].querySelectorAll('input'),a=>a.value)[0]  
			plps[role] = Array.from(rows[i+3].querySelectorAll('input'),a=>a.value)[0]  
		} 
			   
	}
    return [ptas,plps] 
	})
  //  console.log(pta) 	
	const data2 = await page.evaluate(() => {
		var rows = document.querySelectorAll('#tbl_p5_TrainModules tr');
	     
		return Array.from(rows, row => {
			if (row.className.substring(0,12)==="trPLP trPLP_") {
				role = row.className.substring(12,20);  
			}
			if(row.className==="msTR trMTMN") {
				const columns = row.querySelectorAll('td');
				var f =  Array.from(columns, column => column.innerText);				
				f.push(role)
				//console.log(f[2])
			    f.push(f[0].split('-')[0].trim())
		 		f.push(f[0].split('-')[1].trim())
				return f
			} else {return []}
		  
		});  
	});     
	
    
	const mandatory = await page.evaluate(() => {
		var mandatory2 = [];
		var fieldlist = ['blank','description','lastcompleted','expires','type','number','name'];	
		var rows = document.querySelectorAll('#tbl_p5_TrainOGL tr');
		for (var i=0; i< rows.length; i++) {
			var cl = rows[i].classList;
			var cla = Array.from(cl)
			var classf = cla.find(t=>t.indexOf('OGLdata')>0)
		 	if (classf != undefined) {
				var columns = rows[i].querySelectorAll('td');
				var v = Array.from(columns, column => column.innerText);
				v.push(classf.substr(classf.length-2));
				v.push(v[1].split('-')[0].trim())
				v.push(v[1].split('-')[1].trim())
				v2 = new Object;
				for(var m=0; m < v.length; m++) {
				  console.log(fieldlist[m]);
				  v2[fieldlist[m]] = v[m];
				}
				mandatory2.push(v2);
			} 	
		}
		return mandatory2
	})	
	const name = await page.evaluate(() => {
		  
			return document.querySelectorAll(".clicktitle")[0].innerHTML; 
		})
	const roles = await page.evaluate(() => {
		return Array.from(document.getElementById('ctl00_UserTitleMenu_cboUCRoles').options, opt=>opt.value)
	})
    await page.goto('https://compass.scouts.org.uk/MemberProfile.aspx?CN='+cn+'&Page=PERMITS&TAB');
	const permits = await page.evaluate(() => {
	   var fieldlist = ['blank','activity','category','type','restrictions','expires','expired'];
	   var permit = [];
	   var rows = document.querySelectorAll('#tbl_p4_permits tr');
	   for (var i=0; i< rows.length; i++) {
		 if(rows[i].className=="msTR msTRPERM") {
			 var columns = rows[i].querySelectorAll('td');
			 var v = Array.from(columns, column => column.innerText);
			 if(rows[i].style.display=="none") {v.push(true)} else {v.push(false)}
			 
			 v2 = new Object;
				for(var m=0; m < v.length; m++) {
			 
				  v2[fieldlist[m]] = v[m];
				}
			 permit.push(v2);  
		 }
	   }
	   return permit;
	})
	await page.goto('https://compass.scouts.org.uk/MemberProfile.aspx?CN='+cn);
	await page.click("#bnEP1")
	 
	//var frame = age.mainFrame().childFrames()[0];
	
//	console.log(frame);
	await page.waitForSelector(".popup_iframe_div",{visible:true});	 
	var frame = page.mainFrame().childFrames()[0];
	
	await frame.waitForSelector("#ctl00_workarea_txt_p1_title",{visible:true});	 
	//	await page.waitFor(5000)  
	const contact = await frame.$$eval('#mpage2', elements => {
		var ids = Array.from(elements[0].querySelectorAll('input'),e=>e.id);
		var values = Array.from(elements[0].querySelectorAll('input'),e=>e.value);
 		var r = new Object; 
		for (i=0; i < ids.length; i++){
		if (ids[i].indexOf('txt_p2')>-1) {	
	    r[ids[i].substring((ids[i].indexOf('_p2')+4))] = values[i];  
		}		
        }
        var values = Array.from(elements[0].querySelectorAll('select'),e=>e.selectedOptions[0].innerText)	
        var ids = Array.from(elements[0].querySelectorAll('select'),e=>e.id)		
        for (i=0; i < ids.length; i++){
		  r["type_"+	ids[i].substring((ids[i].indexOf('_p2')+4))] = values[i];  
    	}	
		ids = elements[0].querySelectorAll('input[name=p2_telephone]:checked')[0].id;
		r['default_tel'] = ids.substring(ids.indexOf('_p2')+4)
	    ids = elements[0].querySelectorAll('input[name="ctl00$workarea$p2_mainemail"]:checked')[0].id;
		r["default_mail"] = ids.substring(ids.indexOf('_p2')+4)
		return r
	})
	const general = await frame.$$eval('#mpage1', elements => {
		var ids = Array.from(elements[0].querySelectorAll('input'),e=>e.id);
		var values = Array.from(elements[0].querySelectorAll('input'),e=>e.value);
 		var r = new Object; 
		for (i=0; i < ids.length; i++){
		if (ids[i].indexOf('txt_p1')>-1) {	
	    r[ids[i].substring((ids[i].indexOf('_p1')+4))] = values[i];  
		}		
        }
        var values = Array.from(elements[0].querySelectorAll('select'),e=>e.selectedOptions[0].innerText)	
        var ids = Array.from(elements[0].querySelectorAll('select'),e=>e.id)		
        for (i=0; i < ids.length; i++){
		  r["type_"+	ids[i].substring((ids[i].indexOf('_p1')+4))] = values[i];  
    	}	
 
		return r
	})
	 
	 await page.goto('https://compass.scouts.org.uk/MemberProfile.aspx?CN='+cn+'&Page=ROLES&TAB');
	 
	const data_roles = await page.evaluate(() => {
	 
	  var fieldlist = ['role','class','location','start','end','status','options','active','roleid'];
	  var rows = document.querySelectorAll('#tbl_p3_roles tr.msTRRL');
	//  console.log(rows.length);
	  return Array.from(rows, row => {
		  
		  var cl = row.classList;
		  var cla = Array.from(cl)
		    const columns = row.querySelectorAll('td');
			r = Array.from(columns, column => column.innerText);
			if (cla.find(t=>t=='ROLE_HIDEME') == undefined) {r.push(false)} else {r.push(true)}
			r.push(row.getAttribute("data-pk"))
			v2 = new Object;
			for(var m=0; m < r.length; m++) { v2[fieldlist[m]] = r[m];}
			 
			
			return v2;
		   
		 
		  
	    })
	  })
	  
	  var roledetails = new Object
	var rows = await page.$$('#tbl_p3_roles tr.msTRRL input.VIEWROLE')
	for (var i=0;i<rows.length;i++) {
		//console.log(i);
		//await page.goto('https://compass.scouts.org.uk/MemberProfile.aspx?CN='+cn+'&Page=ROLES&TAB');
	    r =  await page.evaluate((i) => {let elements = document.querySelectorAll('#tbl_p3_roles tr.msTRRL'); if (i<elements.length) {
		                                 return elements[i].getAttribute("data-pk")} else {return ""}},i)
       // console.log("r",r)
	    if (r!="") {
		text = await 	page.evaluate((r) => { 
	//	console.log("Test",r);   
		  var content = $.ajax({
        type: "GET",
        url: "https://compass.scouts.org.uk/Popups/Profile/AssignNewRole.aspx?VIEW="+r,
        async: false
        }).responseText;
		
		const doc = new DOMParser().parseFromString(content, 'text/html')
		var a = Array.from(doc.querySelectorAll('#mpage1 tr td select'),a=>{ var b="";
																			 if(a.options.selectedIndex>=0) { b= a.options[a.options.selectedIndex].innerText}
		                                                                     return [a.id||a.classList,a.value,b]})
		var a1 = Array.from(doc.querySelectorAll("#mpage1 tr td label"),a=>a.id)
        var a2 = Array.from(doc.querySelectorAll("#mpage1 tr td label"),a=>a.innerText)		
																			       
		var b = Array.from(doc.querySelectorAll("#mpage2  tr.trTrainData td label"),a=>a.innerHTML)
		var c = Array.from(doc.querySelectorAll("#mpage2  tr.trTrainData td input"),a=>a.value)
        var d = Array.from(doc.querySelectorAll("#mpage2  tr.trTrainData td input"),a=>a.id)
		
		var e = Array.from(doc.querySelectorAll("#mpage2   td input"),a=>a.value)
        var f = Array.from(doc.querySelectorAll("#mpage2   td input"),a=>a.id)
		var g = Array.from(doc.querySelectorAll("#mpage2   td select"),a=>a.value)
		var h = Array.from(doc.querySelectorAll("#mpage2   td select"),a=>a.id)
		var i = Array.from(doc.querySelectorAll("#mpage2   td select"),a=>a.selectedOptions[0].innerText)
		var m = Array.from(doc.querySelectorAll("#mpage2   td select"),a=>a.getAttribute("data-app_code"))
		var j = new Array;
	//	console.log(a)
		for(var loop=0; loop<a.length;loop++) {
		if (typeof a[loop][0] == 'string') { 
			if (a[loop][0].indexOf('ctl00_workarea_cbo_p1_')==0) {
			  var obj = new Object;
			  obj.level = a[loop][0].substring(a[loop][0].length-1);
			  obj.description = a[loop][2];
			  obj.id = a[loop][1];
			  obj.screenid = a[loop][0]
			  obj.label = ""
			  for(var loop2=0;loop2<a1.length;loop2++) {
			//	console.log(a1[loop2].substring(a1[loop2].indexOf("p1_")))
			//	console.log(a[loop][0].substring(a[loop][0].indexOf("p1_")))
				  
				  if (a1[loop2].substring(a1[loop2].indexOf("p1_"))==a[loop][0].substring(a[loop][0].indexOf("p1_"))) {
					  obj.label = a2[loop2]
				  }
			  }
			  j.push(obj)
			}
		}
		}	
		var k = new Array;
		var fieldlist = ['approve_id','approver','blank','date']
		var index = 0
		for (var loop=0; loop<b.length; loop++) {
			 var obj = new Object
			 obj.label = b[loop]
			for (var loop2=0; loop2<((c.length/b.length)); loop2++) {
			   obj[fieldlist[loop2]]=c[index]
			   index++
			  
			}
			k.push(obj);
		}
		var l = new Object		
		for (var loop=0; loop<e.length; loop++) {
			if (f[loop].indexOf('ctl00_workarea_txt_p2_')==0) {
			//	var obj = new Object
				l[f[loop].substring(f[loop].indexOf("p2_")+3)] = e[loop]
			}
		}
		for (var loop=0; loop<h.length; loop++) {
			if (h[loop]!="") {
			//	var obj = new Object
				l[h[loop].substring(h[loop].indexOf("p2_")+3)] = i[loop]
				l[h[loop].substring(h[loop].indexOf("p2_")+3)+"_value"] = g[loop]
			} else
			{
				l[m[loop]] = i[loop]
				l[m[loop]+"_value"] = g[loop]
			}
		}
		//console.log(j)
		return (JSON.stringify([j,k,l]));
		
		 
		},r)
		
	//	console.log(i)
		roledetails[r]= JSON.parse(text);
		}
	}
 //await page.waitFor(10000)  
    await page.goto('https://compass.scouts.org.uk/MemberProfile.aspx?CN='+cn+'&Page=DISCLOSURES&TAB');
    //dbsdetails = [];
	const dbsdetails = await page.evaluate(() => {
	 //console.log(elements.length);
	var elements = document.querySelectorAll('#tbl_p12_disclosures tr');
		var a = [];
		
	//	var fieldlist = ['country','provider','type','number','issuedby','issuedate','status','expiry']
		var fieldlist = ['country','provider','type','number','issuedby','issuedate','status','expiry']
		for (i=0; i < elements.length; i++){
			b = Array.from(elements[i].querySelectorAll("td label"),a=>a.innerText);
			if (b.length>0) {
			obj = new Object;
			for (j=0;j <b.length;j++) {
			if (b.length==8||j<4) {
			obj[fieldlist[j]] = b[j]
            } else
			{
				obj[fieldlist[j+1]] = b[j]
			}
			}
			a.push(obj)
			}
		}
		return a 
    })
	 
		
	await browser.close(); 
	
	stripblanks(data2);
	var data4 = {};
	var fieldlist = ['course','learning_req','learning_method','completed','validated_by','validated_on','blank','roleid','courseid','coursename'];
 
	// Reformat PLP Data
	for(var i=0;i<data.length;i++) {
 
	  var data3 = [];
      for(var j=0;j<data2.length;j++) {
 
	  if (data[i].roleid == data2[j][7]) {
		   plpobj = new Object;
	 
		   for(var k=0;k<fieldlist.length;k++){
			 plpobj[fieldlist[k]]= data2[j][k] 
		   }            
		   data3.push(plpobj);
         }		   
      }
      data4[data[i].roleid] = new Object;
      data4[data[i].roleid] = data3;	  
	}
 
	rep = new Object;
	rep['name'] = name;
	rep['roles'] = data;
	rep['training'] = data4;
	rep['mandatory']= mandatory;
	rep['permits'] = permits;
	rep['droles'] = roles;
	rep['contact'] = contact;
	rep['general'] = general;
	rep['allroles']=data_roles;
	rep['pta'] = pta;
	rep['roledetail'] = roledetails;
	rep['dbs'] = dbsdetails;
 
	return rep
}

const scrapeUsers = async (res,req,r) => {
const browser = await open_browser(); 
const page = await browser.newPage();
await do_logon(res,req,r,browser,page);
console.log(r.params.rid);
await page.goto('https://compass.scouts.org.uk/ScoutsPortal.aspx');
  await page.select('#ctl00_UserTitleMenu_cboUCRoles',r.params.rid);
await page.waitForSelector("#mn_SB",{visible:true})
await page.hover("#mn_SB");
await page.click("#mn_HS");
await page.goto('https://compass.scouts.org.uk/SearchResults.aspx');
const list = await page.evaluate(() => {
     return document.getElementById("ctl00_plInnerPanel_head_txt_h_Data").getAttribute("value")  
    });  
await browser.close(); 
return JSON.parse(list)	
}	

const scrapeReport = async (res,req,r) => {
var list = [];
var rep = r.params.rep; 
const browser = await open_browser(); 
const page = await browser.newPage();
await do_logon(res,req,r,browser,page);
await page.goto('https://compass.scouts.org.uk/ScoutsPortal.aspx');
  await page.select('#ctl00_UserTitleMenu_cboUCRoles',r.params.rid);
await page.goto('https://compass.scouts.org.uk/Reports.aspx');
await page.evaluate((rep) => {
      let elements = $('.RCAP').toArray();
      $(elements[ rep ]).click();
    },rep);  
  await page.waitForSelector("#report_iframe",{visible:true});	 
	await page.waitForSelector("#report_iframe",{visible:true});	
	var frame = page.mainFrame().childFrames()[0];
	await frame.waitForSelector('#ReportViewer1_ctl05_ctl00_CurrentPage:enabled');
   // console.log("kk")
const t = await frame.$$eval('#RunReportform script', elements => { 
  
  //console.log("ll")
  var s = elements;
  console.log(s.length)
  var s2 = s[7].innerText;
    var s3 = s2.substring(s2.indexOf("ExportUrlBase"))
    var s4 = s3.substring(0,s3.indexOf('"',20))
   var  s4 = s4.substring(16)
 
 //  console.log(s4)
 var s6 = '{"j" : "https://compass.scouts.org.uk'+s4+'CSV"}'
 var s7 = JSON.parse(s6)
 var s8 = ""
// $.get(s7.j, function( data ) {
  // s8 = data
//});
  return $.ajax({
        type: "GET",
        url:s7.j,
        async: false
    }).responseText; 
})
//await page.waitFor(5000)  
//  await page.waitForNavigation(); 
await browser.close()
return t
} 

const scrapeHierarchy = async (res,req,r) => {
	const browser = await open_browser();
	const page = await browser.newPage();
	await do_logon(res,req,r,browser,page)
	await page.goto('https://compass.scouts.org.uk/MemberProfile.aspx');
	const getcn = async (page,r) => { 
		if (r.params.hasOwnProperty('rid')) {		 
			await page.select('#ctl00_UserTitleMenu_cboUCRoles', r.params.rid);
			var cn = r.params.uid;
		} else {		
			var cn = await page.evaluate(() => {
				return document.querySelectorAll("#myCN")[0].value; 
			})
		}
		return cn;
		}
	const cn = await getcn(page,r);
	await page.goto('https://compass.scouts.org.uk/MemberProfile.aspx?CN='+cn+'&Page=ROLES&TAB');
	var roledetails = new Object
	var rows = await page.$$('#tbl_p3_roles tr.msTRRL input.VIEWROLE')
	for (var i=0;i<rows.length;i++) {
		//await page.goto('https://compass.scouts.org.uk/MemberProfile.aspx?CN='+cn+'&Page=ROLES&TAB');
	    r =  await page.evaluate((i) => {let elements = document.querySelectorAll('#tbl_p3_roles tr.msTRRL'); return elements[i].getAttribute("data-pk")},i)
		text = await 	page.evaluate((r) => { 
		   
		  var content = $.ajax({
        type: "GET",
        url: "https://compass.scouts.org.uk/Popups/Profile/AssignNewRole.aspx?VIEW="+r,
        async: false
        }).responseText;
		
		const doc = new DOMParser().parseFromString(content, 'text/html')
		var a = Array.from(doc.querySelectorAll('#mpage1 tr td select'),a=>{ console.log(a.options,a.options.selectedIndex); 
		                                                                     var b=""
																			 if(a.options.selectedIndex>=0) { b= a.options[a.options.selectedIndex].innerText}
		                                                                     return [a.id||a.classList,a.value,b]})
		 
		return (JSON.stringify(a));
		
		//console.log(Array.from(doc.querySelectorAll('#mpage1 tr td select'),a=>{return [a.id||a.classList,c[a.options.selectedIndex].innerText,a.value]}).length)
		//return "kk" //Array.from(doc.querySelectorAll('#mpage1 tr td select'),a=>{return [a.id||a.classList,a.options[a.options.selectedIndex].innerText,a.value]})[0]
		},r)
		
		//console.log(text) ;
		
		roledetails[r]= JSON.parse(text);
		//await page.waitFor(15000)  
	}
	await browser.close(); 
	return roledetails
}


const scrapeReports = async (res,req,r) => {
var list = [];
const browser = await open_browser(); 
const page = await browser.newPage();
await do_logon(res,req,r,browser,page);
await page.select('#ctl00_UserTitleMenu_cboUCRoles', r.params.rid);
await page.goto('https://compass.scouts.org.uk/Reports.aspx');
var list = await page.evaluate(()=> {
	return Array.from(document.getElementsByClassName('RCAP'),e=>e.innerText)

})
await browser.close(); 
return list
}
/*
const  scrapeReport2 = async (res,req,r) => {
	const browser = await open_browser(); 
	const page = await browser.newPage();
	await do_logon(res,req,r,browser,page);
	await page.goto('https://compass.scouts.org.uk/Reports.aspx');
	var rid = r.params.reportid;
	await page.evaluate((rid) => {
      let elements = $('.RCAP').toArray();
      $(elements[ rid ]).click();
    },rid);   
	await page.waitForSelector("#report_iframe",{visible:true});	 
	await page.waitForSelector("#report_iframe",{visible:true});	
	var frame = page.mainFrame().childFrames()[0];
	await frame.waitForSelector('#ReportViewer1_ctl04_ctl00:enabled');	
	var report = []
	var table2 = []
	var first = true;
	do {
 		if (!first) {
			frame.click('#ReportViewer1_ctl05_ctl00_Next_ctl00')
			await page.waitFor(1000)  
			await frame.waitForSelector('#ReportViewer1_ctl04_ctl00:enabled');	
		} 
		first = false;
		
		var values = await frame.$$eval('#ReportViewer1_fixedTable table', elements => {   
			var elements = elements[30];
			var f = function(table) {
				const res = [];

				table.querySelectorAll('tbody tr').forEach((row, y) =>
					row.querySelectorAll('td').forEach((cell, x) => {
						const rowspan = Number(cell.getAttribute('rowspan') || 1);
						const colspan = Number(cell.getAttribute('colspan') || 1);
						while (res[y] && res[y][x]) x++;
						for (let yy = y; yy < y + rowspan; yy++) {
							const resRow = res[yy] = res[yy] || [];
							for (let j = 0; j < colspan; j++) {
								resRow.row = row;
								resRow[x + j] = cell.innerText;
							}
						}
					})
				);

				return res.filter(row => row.length > 0);
			};
			return f(elements);
   
		});
		if (report.length==0){
			report = values;
		} else { 
			report.concat(values)
		}

 
		var d = await frame.$$eval('#ReportViewer1_ctl05_ctl00_Next_ctl00',e=>{   return e[0].style.display}) 
	} while (d!='none')
	await browser.close(); 
	return report;
}
*/

const  scrapeAddress = async (res,req,r) => {
	const browser = await open_browser();
//				console.log("In function",r );	
	const page = await browser.newPage();
	await do_logon(res,req,r,browser,page)
		await page.goto('https://compass.scouts.org.uk/MemberProfile.aspx');
    const getcn = async (page,r) => { 
   // console.log(r);
	
	if (r.params.hasOwnProperty('rid')) {		 
		 await page.select('#ctl00_UserTitleMenu_cboUCRoles', r.params.rid);
		 var cn = r.params.uid;
    } else 
    {		
	 
		var cn = await page.evaluate(() => {
		 
			return document.querySelectorAll("#myCN")[0].value; 
			
		})
		
	}
	 
	return cn;
	}
	const cn = await getcn(page,r);
	 //await page.waitForNavigation(); 
	await page.goto('https://compass.scouts.org.uk/MemberProfile.aspx?CN='+cn);
	await page.click("#bnEP1")
	const name = await page.evaluate(() => {		  
			return document.querySelectorAll(".clicktitle")[0].innerHTML; 
		})

	await page.waitForSelector(".popup_iframe_div",{visible:true});	 
	var frame = page.mainFrame().childFrames()[0];
	await frame.waitForSelector("#ctl00_workarea_txt_p1_title",{visible:true});	 
	const contact = await frame.$$eval('#mpage2', elements => {
		var ids = Array.from(elements[0].querySelectorAll('input'),e=>e.id);
		var values = Array.from(elements[0].querySelectorAll('input'),e=>e.value);
 		var r = new Object; 
		for (i=0; i < ids.length; i++){
		if (ids[i].indexOf('txt_p2')>-1) {	
	    r[ids[i].substring((ids[i].indexOf('_p2')+4))] = values[i];  
		}		
        }
        var values = Array.from(elements[0].querySelectorAll('select'),e=>e.selectedOptions[0].innerText)	
        var ids = Array.from(elements[0].querySelectorAll('select'),e=>e.id)		
        for (i=0; i < ids.length; i++){
		  r["type_"+	ids[i].substring((ids[i].indexOf('_p2')+4))] = values[i];  
    	}	
		ids = elements[0].querySelectorAll('input[name=p2_telephone]:checked')[0].id;
		r['default_tel'] = ids.substring(ids.indexOf('_p2')+4)
	    ids = elements[0].querySelectorAll('input[name="ctl00$workarea$p2_mainemail"]:checked')[0].id;
		r["default_mail"] = ids.substring(ids.indexOf('_p2')+4)
		return r
	})
	const general = await frame.$$eval('#mpage1', elements => {
		var ids = Array.from(elements[0].querySelectorAll('input'),e=>e.id);
		var values = Array.from(elements[0].querySelectorAll('input'),e=>e.value);
 		var r = new Object; 
		for (i=0; i < ids.length; i++){
		if (ids[i].indexOf('txt_p1')>-1) {	
	    r[ids[i].substring((ids[i].indexOf('_p1')+4))] = values[i];  
		}		
        }
        var values = Array.from(elements[0].querySelectorAll('select'),e=>e.selectedOptions[0].innerText)	
        var ids = Array.from(elements[0].querySelectorAll('select'),e=>e.id)		
        for (i=0; i < ids.length; i++){
		  r["type_"+	ids[i].substring((ids[i].indexOf('_p1')+4))] = values[i];  
    	}	
 
		return r
	})
	 
 
	  
 
	await browser.close(); 
	 
 
	rep = new Object;
	rep['name'] = name;
	rep['contact'] = contact;
	rep['general'] = general;
	 
	//throw 'Uh-oh!';
	return rep
}
module.exports.scrapeAddress = scrapeAddress;
module.exports.scrapeReports = scrapeReports;
module.exports.scrapeUsers = scrapeUsers;
module.exports.scrapeUser = scrapeUser;
module.exports.scrapeReport = scrapeReport;
module.exports.scrapeActiveRoles = scrapeActiveRoles;
module.exports.logon = logon;
module.exports.scrapeAllRoles = scrapeAllRoles;
module.exports.scrapeHierarchy = scrapeHierarchy;
