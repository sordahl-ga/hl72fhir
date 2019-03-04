module.exports = async function (context, req) {
    Array.prototype.isArray = true;
    function safeaccess(v) {
        if (v) {
            if (v.isArray)
                return v[0];
            return v.toString();
        }
        return "";
    }
    context.log('ORU2FHIR Fired');
    //Trinity Report Extraction Only nothing discrete!
    if (req.query.id) {
        var msg = JSON.parse(context.req.rawBody);
        var instance = msg['MSH']['MSH.3'].toString();
        var source = msg['MSH']['MSH.4'].toString();
        var RHM = source +"-"+instance;
        
        //Get Subject
        var subject = "Patient/";
        var patientenc = "Encounter/";
        //Assuming first number is MR
        var patid = safeaccess(msg['PID']['PID.3']);
        subject = subject + RHM + "-" + patid['PID.3.1'].toString();
        //TODO: Figure out ENCID Mapping
        patientenc = patientenc + RHM + "-" + msg['PID']['PID.18']['PID.18.1'].toString();
        var diagreport = {};
        diagreport.resourceType = "DiagnosticReport";
        var orderid = "";
        for (index = 0; index < msg['ORC'].length; ++index) {
            var orc = msg['ORC'][index];
            if (orc['ORC.3'] && orc['ORC.3'].length > 0 && orc['ORC.3'][0]['ORC.3.1'].toString().length > 0) {
                orderid = RHM + "-" + msg['ORC']['ORC.3'][0]['ORC.3.1'].toString().replace("{","").replace("}","");
                break;
            }
        }
        if (orderid==="") {
            for (index = 0; index < msg['OBR'].length; ++index) {
                 var obr = msg['OBR'][index];
                 if (obr['OBR.2'].toString().length > 0) {
                    orderid = RHM + "-" + obr['OBR.2']['OBR.2.1'].toString().replace("{","").replace("}","");
                    break;
                 }
            }
        }
        diagreport.id = orderid;
        diagreport.code = {"coding":[]};
        var i=0;
        for (index = 0; index < msg['OBR'].length; ++index) {
            var obr = msg['OBR'][index];
            if (i===0) diagreport.status = obr['OBR.25']['OBR.25.1'].toString();
            diagreport.code.coding.push({"code":obr['OBR.4']['OBR.4.1'].toString(),"display":obr['OBR.4']['OBR.4.2'].toString(),"system":RHM});
            if (i===0) {
                var timestamp =obr['OBR.22']['OBR.22.1'].toString();
                if (timestamp.length > 0)
                    diagreport.issued = timestamp.substr(0,4) + "-" + timestamp.substr(4,2) + "-" + timestamp.substr(6,2) + "T" + timestamp.substring(8,10) +":"+timestamp.substring(10,12) + ":" + timestamp.substring(12,14)+".000Z";
            }
            i++;
        }
        diagreport.subject = {"reference":subject};
        diagreport.context = {"reference":patientenc};
        var report = "";
        //Turn OBX into report
        for (index = 0; index < msg['OBX'].length; ++index) {
            var obx = msg['OBX'][index];
            if (obx['OBX.2']['OBX.2.1'].toString()==="FT" || obx['OBX.2']['OBX.2.1'].toString()==="TX")
                report = report + obx['OBX.5']['OBX.5.1'].toString();
        }
        if (report==="") report="Discrete Values Only";
        diagreport.text = {"status":"generated","div":report};
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
        messageHeader.focus.push({"reference":patientenc});
        //messageHeader.data = [Patient];
        var bundle = {};
        bundle.resourceType = "Bundle";
        bundle.type = "message";
        bundle.entry = [];
        bundle.entry.push({"resource" : messageHeader});
        bundle.entry.push({"resource" : diagreport});
        bundle.total = bundle.entry.length;
        msg = JSON.stringify(bundle);
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