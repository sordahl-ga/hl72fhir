module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    if (req.query.id) {
        var msg = JSON.parse(context.req.rawBody);
        //Get Subject
        var subject = "Patient/";
        var patientenc = "Encounter/";
        //Assuming first number is MR
        var patid = msg['PID']['PID.3'][0];
        subject = subject + patid['PID.3.1'].toString();
        //TODO: Figure out ENCID Mapping
        patientenc = patientenc +  msg['PID']['PID.18']['PID.18.1'].toString();
        //Requestor Doc
        var reqPractitioner = null;
        if (msg['ORC']['ORC.12'][0].toString().length > 0) {
            reqPractitioner = {};
            reqPractitioner.resourceType="Practitioner";
            reqPractitioner.active=true;
            var reqhumanName = {
                    family: [msg['ORC']['ORC.12'][0]['ORC.12.2'].toString()],
                    given: [msg['ORC']['ORC.12'][0]['ORC.12.3'].toString(),msg['ORC']['ORC.12'][0]['ORC.12.4'].toString()],
                    text: msg['ORC']['ORC.12'][0]['ORC.12.3'].toString() + ' ' + msg['ORC']['ORC.12'][0]['ORC.12.2'].toString()
            };
            reqPractitioner.name = [reqhumanName];
            reqPractitioner.id = msg['ORC']['ORC.12'][0]['ORC.12.1'].toString();
        }

        var procedurereq = {};
        procedurereq.resourceType = "ProcedureRequest";
        procedurereq.identifier = [];
        var placer = {
           "type": {
           "coding": [
             {
               "system": "http://hl7.org/fhir/identifier-type/PLAC",
               "code": "PLAC"
             }
           ]
         },
         "value": msg['ORC']['ORC.2']['ORC.2.1'].toString(),
         "system":msg['ORC']['ORC.2']['ORC.2.2'].toString()
       }
       procedurereq.identifier.push(placer);
       if (msg['ORC']['ORC.3'].toString().length > 0) {
	    var filler = {
	           "type": {
	           "coding": [
	             {
	               "system": "http://hl7.org/fhir/identifier-type/FILL",
	               "code": "FILL"
	             }
	           ]
	         },
	         "value": msg['ORC']['ORC.3']['ORC.3.1'].toString(),
	         "system":msg['ORC']['ORC.3']['ORC.3.2'].toString()
	       }
	    procedurereq.identifier.push(filler);   
        }
        procedurereq.status = msg['ORC']['ORC.5'].toString();
        procedurereq.subject = {"reference":subject};
        procedurereq.context = {"reference":patientenc};
        var timestamp = msg['ORC']['ORC.9'].toString();
        procedurereq.authoredOn = timestamp.substr(0,4) + "-" + timestamp.substr(4,2) + "-" + timestamp.substr(6,2) + "T" + timestamp.substring(8,10) +":"+timestamp.substring(10,12) + ":" + timestamp.substring(12,14)+".000Z";
        if (reqPractitioner) {
	        procedurereq.requester = {};
	        procedurereq.requester.agent = {"reference" : "Practitioner/" + reqPractitioner.id, "display": reqhumanName.text};
        }
        procedurereq.reasonCode = [];
        procedurereq.reasonCode.push({"text":msg['ORC']['ORC.16'].toString()});
        procedurereq.code = {"text": msg['OBR']['OBR.24'].toString()};
 
        var messageHeader = {};

        messageHeader.resourceType = "MessageHeader";
        messageHeader.source = {
	        name: msg['MSH']['MSH.3'].toString()
        }
        messageHeader.destination = [{
	        name: 'Azure FHIR'
        }]
        var timestamp = msg['MSH']['MSH.7'].toString();
        messageHeader.timestamp = timestamp.substr(0,4) + "-" + timestamp.substr(4,2) + "-" + timestamp.substr(6,2) + "T" + timestamp.substring(8,10) +":"+timestamp.substring(10,12) + ":" + timestamp.substring(12,14)+".000Z";
        messageHeader.event = {"code" : msg['MSH']['MSH.9']['MSH.9.2'].toString()};
        messageHeader.focus = [];
        messageHeader.focus.push({"reference":subject});
        //messageHeader.data = [Patient];
        var bundle = {};
        bundle.resourceType = "Bundle";
        bundle.type = "message";
        bundle.entry = [];
        bundle.entry.push({"resource" : messageHeader});
        if (reqPractitioner) bundle.entry.push({"resource" : reqPractitioner});
        bundle.entry.push({"resource" : procedurereq});
        bundle.total = bundle.entry.length;
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: JSON.stringify(bundle)
        };
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass an id on the query string"
        };
    }
};