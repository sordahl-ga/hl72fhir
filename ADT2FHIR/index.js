module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    Array.prototype.isArray = true;
    function safeaccess(v) {
        if (v) {
            if (v.isArray)
                return v[0].toString();
            return v.toString();
        }
        return "";
    }
    if (req.query.id) {
        var msg = JSON.parse(context.req.rawBody);
        var instance = msg['MSH']['MSH.3'].toString();
        var source = msg['MSH']['MSH.4'].toString();
        var RHM = source +"-"+instance;
        //Reference Resources (Practition, Orginization, etc...)
        //GP
        var genPractitioner = null;
        if (msg['PD1'] && msg['PD1']['PD1.4'].toString().length > 0) {
            genPractitioner = {};
            genPractitioner.resourceType="Practitioner";
            genPractitioner.active=true;
            var gphumanName = {
                family: [msg['PD1']['PD1.4']['PD1.4.2'].toString()],
                given: [msg['PD1']['PD1.4']['PD1.4.3'].toString(),msg['PD1']['PD1.4']['PD1.4.4'].toString()],
                text: msg['PD1']['PD1.4']['PD1.4.3'].toString() + ' ' + msg['PD1']['PD1.4']['PD1.4.2'].toString()
            };
            genPractitioner.name = [gphumanName];
            genPractitioner.id = RHM + "-" + msg['PD1']['PD1.4']['PD1.4.1'].toString();
        }
        //Attending Doc
        var attPractitioner = null;
        if (msg['PV1']['PV1.7'].toString().length > 0) {
            attPractitioner = {};
            attPractitioner.resourceType="Practitioner";
            attPractitioner.active=true;
            var atthumanName = {
                family: [msg['PV1']['PV1.7']['PV1.7.2'].toString()],
                given: [msg['PV1']['PV1.7']['PV1.7.3'].toString(),msg['PV1']['PV1.7']['PV1.7.4'].toString()],
                text: msg['PV1']['PV1.7']['PV1.7.3'].toString() + ' ' + msg['PV1']['PV1.7']['PV1.7.2'].toString()
            };
            attPractitioner.name = [atthumanName];
            attPractitioner.id = RHM + "-" + msg['PV1']['PV1.7']['PV1.7.1'].toString();
        }
        //Admitting Doc
        var admPractitioner = null;
        if (msg['PV1']['PV1.17'].toString().length > 0) {
            admPractitioner = {};
            admPractitioner.resourceType="Practitioner";
            admPractitioner.active=true;
            var admhumanName = {
                family: [msg['PV1']['PV1.17']['PV1.17.2'].toString()],
                given: [msg['PV1']['PV1.17']['PV1.17.3'].toString(),msg['PV1']['PV1.17']['PV1.17.4'].toString()],
                text: msg['PV1']['PV1.17']['PV1.17.3'].toString() + ' ' + msg['PV1']['PV1.17']['PV1.17.2'].toString()
            };
            admPractitioner.name = [admhumanName];
            admPractitioner.id = RHM + "-" + msg['PV1']['PV1.17']['PV1.17.1'].toString();
        }
        // Reffering Doc
        var refPractitioner = null;
        if (msg['PV1']['PV1.8'].toString().length > 0) {
            refPractitioner = {};
            refPractitioner.resourceType="Practitioner";
            refPractitioner.active=true;
            var refhumanName = {
                family: [msg['PV1']['PV1.8']['PV1.8.2'].toString()],
                given: [msg['PV1']['PV1.8']['PV1.8.3'].toString(),msg['PV1']['PV1.8']['PV1.8.4'].toString()],
                text: msg['PV1']['PV1.8']['PV1.8.3'].toString() + ' ' + msg['PV1']['PV1.8']['PV1.8.2'].toString()
            };
            refPractitioner.name = [refhumanName];
            refPractitioner.id = RHM + "-" + msg['PV1']['PV1.8']['PV1.8.1'].toString();
        }
        //Patient Resource
        var Patient = {};
        var pinternalenc = null;
        var pinternal = null;
        var pempi = null;
        Patient.resourceType = "Patient";
        Patient.active=true;
        //Gender
        Patient.gender = msg['PID']['PID.8'].toString();
        if (Patient.gender==="F") {
            Patient.gender = "female";
        } else if (Patient.gender==="M") {
            Patient.gender = "male";
        } else if (Patient.gender==="O") {
            Patient.gender = "other";
        } else {
            Patient.gender = "unknown";
        }
        //Birthdate
        var date = msg['PID']['PID.7'].toString();
        Patient.birthDate = date.substr(0,4) + "-" + date.substr(4,2) + "-" + date.substr(6,2);
        //Handle Repeting Field PID-3 for IDs
        Patient.identifier = [];
        for (index = 0; index < msg['PID']['PID.3'].length; ++index) {
            var entry = msg['PID']['PID.3'][index];
            var pi = {
                "use": "usual",
                "type": {
                "coding": [
                    {
                    "system": "http://hl7.org/fhir/v2/0203/" + entry['PID.3.5'].toString(),
                    "code": entry['PID.3.5'].toString()
                    }
                ]
                },
                "value": entry['PID.3.1'].toString(),
                "assigner":  entry['PID.3.4'].toString()
            }
            Patient.identifier.push(pi);
            if (entry['PID.3.5'].toString()==="AI") pinternalenc = pi;
            if (entry['PID.3.5'].toString()==="MR") pinternal = pi;
        }
        if (!pinternalenc) {
            var pi = {
                "use": "usual",
                "type": {
                "coding": [
                    {
                    "system": "http://hl7.org/fhir/v2/0203/AI",
                    "code": "AI"
                    }
                ]
                },
                "value": msg['PID']['PID.18']['PID.18.1'].toString(),
                "assigner":  msg['PID']['PID.18']['PID.18.4'].toString()
            }
            Patient.identifier.push(pi);
            pinternalenc = pi;
        }
        //SS#
        var ssi = {
                "use": "usual",
                "type": {
                "coding": [
                    {
                    "system": "http://hl7.org/fhir/v2/0203/SS",
                    "code": "SS"
                    }
                ]
                },
                "value": msg['PID']['PID.19'].toString(),
                "system": "http://hl7.org/fhir/sid/us-ssn"
            }
            Patient.identifier.push(ssi);
            //EXT ID
            var extid = {
                    "use": "usual",
                    "type": {
                    "coding": [
                        {
                        "system": "http://hl7.org/fhir/v2/0203",
                        "code": "EMPI"
                        }
                    ]
                    },
                    "value": msg['PID']['PID.2']['PID.2.1'].toString(),
                    "assigner":  msg['PID']['PID.2']['PID.2.4'].toString()
                }
                Patient.identifier.push(extid);	   
                //Name
                var humanName = {
                    family: [msg['PID']['PID.5']['PID.5.1'].toString()],
                    given: [msg['PID']['PID.5']['PID.5.2'].toString(),safeaccess(msg['PID']['PID.5']['PID.5.3'])],
                    text: msg['PID']['PID.5']['PID.5.2'].toString() + ' ' + msg['PID']['PID.5']['PID.5.1'].toString()
                };
                Patient.name = [humanName];
                //Address (Assume first sub-segment is home)
                var homeaddr = {};
                homeaddr.use = "home";
                homeaddr.line = [];
                homeaddr.line.push(msg['PID']['PID.11']['PID.11.1'].toString());
                homeaddr.line.push(msg['PID']['PID.11']['PID.11.2'].toString());
                homeaddr.city = msg['PID']['PID.11']['PID.11.3'].toString();
                homeaddr.state = msg['PID']['PID.11']['PID.11.4'].toString();
                homeaddr.postalCode = msg['PID']['PID.11']['PID.11.5'].toString();
                homeaddr.country = msg['PID']['PID.11']['PID.11.6'].toString();
                Patient.address = [homeaddr];
                //Telecom (assume first sub-segment is home phone)
                var phone = {};
                phone.system="phone";
                phone.value=msg['PID']['PID.13']['PID.13.1'].toString();
                phone.use="home";
                //Email
                var email = {};
                email.system="email";
                email.value=msg['PID']['PID.13']['PID.13.4'].toString();
                Patient.telecom = [phone,email];
                //Marital Status (You would normally do a code look up here)
                var marital = {};
                var maritalCoding = {};
                maritalCoding.system="http://hl7.org/fhir/ValueSet/marital-status";
                maritalCoding.code = msg['PID']['PID.16'].toString()
                if (maritalCoding.code==="S") {
                    maritalCoding.display="Never Married";
                    marital.text="Single";
                } else if (maritalCoding.code==="M") {
                    maritalCoding.display="Married";
                    marital.text="Married";
                }
                marital.coding = [maritalCoding];
                Patient.maritalStatus= marital;
                //RACE
                //TODO: MAP TO US-CORE-RACE Source System Custom Codes
                Patient.extension = [];
                var race = {
                            "url": "http://hl7.org/fhir/StructureDefinition/us-core-race",
                            "valueCodeableConcept": {
                                "text": "",
                                "coding": [
                                    {
                                        "system": "",
                                        "code": msg['PID']['PID.10'].toString(),
                                        "display": ""
                                    }
                                ]
                            }
                }
                Patient.extension.push(race);
                //GP Reference
                if (genPractitioner) Patient.generalPractitioner = "Practitioner/" + genPractitioner.id;
                Patient.id = RHM + "-" + pinternal.value;
                //Location
                var location = null;
                if (msg['PV1']['PV1.3'].toString().length > 0) {
                    var lpv1 = msg['PV1']['PV1.3'];
                    if (lpv1['PV1.3.1']) {
                        var unit = (lpv1['PV1.3.1'].toString().length > 0 ? lpv1['PV1.3.1'].toString() : lpv1);
                        var room = lpv1['PV1.3.2'].toString();
                        var bed =  lpv1['PV1.3.3'].toString();
                        var fac =  lpv1['PV1.3.4'].toString();
                        var ls = unit;
                    } else {
                        ls = lpv1;
                    }
                    if (room != null && room.length > 0) ls = ls + "-" + room;
                    if (bed !=null && bed.length > 0) ls =ls + "-" + bed;
                    if (fac != null && fac.length > 0) ls =ls + "-" + fac;
                    location = {};
                    location.resourceType="Location";
                    location.id = RHM + "-" + ls;
                    location.identifier=[{"value":RHM + "-" + ls}];
                }
                //Encounter
                var encounter = {"class":{"code": msg['PV1']['PV1.20']['PV1.20.1'].toString()}};
                encounter.resourceType="Encounter";
                encounter.id = RHM + "-" + pinternalenc.value;
                encounter.subject={"reference":"Patient/" + Patient.id};
                if (location)
                    encounter.location = [{"location": {"reference":"Location/" + location.id}}];
                //Admission and Discharge Date/Time
                encounter.period = {};
                var admdate = safeaccess(msg['PV2']['PV2.8']);
                if (admdate.length != null && admdate.length > 11)
                    encounter.period.start = admdate.substr(0,4) + "-" + admdate.substr(4,2) + "-" + admdate.substr(6,2) + "T" + admdate.substring(8,10) +":"+admdate.substring(10,12)+":00.000Z";
                var disch = safeaccess(msg['PV1']['PV1.46']);
                if (disch !=null && disch.length > 11) {
                    encounter.period.end = disch.substr(0,4) + "-" + disch.substr(4,2) + "-" + disch.substr(6,2) + "T" + disch.substring(8,10) +":"+disch.substring(10,12)+":00.000Z";	
                }
                //Encounter Types Patient Type and Adm Type
                encounter.type = [];
                var enctext = {};
                enctext.text = msg['PV1']['PV1.18'].toString();
                encounter.type.push(enctext);
                var enctext1 = {};
                enctext1.text = msg['PV1']['PV1.4'].toString();
                encounter.type.push(enctext1);
                encounter.hospitalization = {};
                encounter.hospitalization.dischargeDisposition = {};
                encounter.hospitalization.dischargeDisposition.text=msg['PV1']['PV1.36'].toString();
                encounter.participant = [];
                if (admPractitioner) {
                    var part =  {
                        "type": [
                            {
                            "coding": [
                                {
                                "system": "http://hl7.org/fhir/v3/ParticipationType",
                                "code": "ADM",
                                "display": "admitter"
                                }
                            ],
                            "text": "Admitting Physician"
                            }
                        ],
                        "period": {
                            "start": encounter.period.start
                        },
                        "individual": {
                            "reference": "Practitioner/" + admPractitioner.id,
                            "display": admhumanName.text
                        }
                    };
                    encounter.participant.push(part);
                }
                if (attPractitioner) {
                var part =  {
                    "type": [
                        {
                        "coding": [
                            {
                            "system": "http://hl7.org/fhir/v3/ParticipationType",
                            "code": "ATND",
                            "display": "attender"
                            }
                        ],
                        "text": "Attending Physician"
                        }
                    ],
                    "period": {
                        "start": encounter.period.start
                    },
                    "individual": {
                        "reference": "Practitioner/" + attPractitioner.id,
                        "display": atthumanName.text
                    }
                };
                encounter.participant.push(part);
            }
            if (refPractitioner) {
                var part =  {
                    "type": [
                        {
                        "coding": [
                            {
                            "system": "http://hl7.org/fhir/v3/ParticipationType",
                            "code": "REF",
                            "display": "referrer"
                            }
                        ],
                        "text": "Reffering Physician"
                        }
                    ],
                    "period": {
                        "start": encounter.period.start
                    },
                    "individual": {
                        "reference": "Practitioner/" + refPractitioner.id,
                        "display": refhumanName.text
                    }
                };
                encounter.participant.push(part);
            }
            
            var messageHeader = {};

            messageHeader.resourceType = "MessageHeader";
            messageHeader.source = {
                name: RHM
            }
            messageHeader.destination = [{
                name: 'Azure FHIR'
            }]
            var timestamp = msg['MSH']['MSH.7'].toString();
            messageHeader.timestamp = timestamp.substr(0,4) + "-" + timestamp.substr(4,2) + "-" + timestamp.substr(6,2) + "T" + timestamp.substring(8,10) +":"+timestamp.substring(10,12) + ":" + timestamp.substring(12,14)+".000Z";
            messageHeader.event = {"code" : msg['MSH']['MSH.9']['MSH.9.2'].toString()};
            messageHeader.reason = {};
            messageHeader.reason.coding = [];
            messageHeader.reason.coding.push({"code" : msg['EVN']['EVN.4'].toString()});
            messageHeader.focus = [];
            messageHeader.focus.push({"reference":"Patient/" + Patient.id});
            messageHeader.focus.push({"reference":"Encounter/" + encounter.id});
            var bundle = {};
            bundle.resourceType = "Bundle";
            bundle.type = "message";
            bundle.entry = [];
            bundle.entry.push({"resource" : messageHeader});
            if (genPractitioner) bundle.entry.push({"resource" : genPractitioner});
            if (admPractitioner) bundle.entry.push({"resource" : admPractitioner});
            if (attPractitioner) bundle.entry.push({"resource" : attPractitioner});
            if (refPractitioner) bundle.entry.push({"resource" : refPractitioner});
            if (location) bundle.entry.push({"resource" : location});
            bundle.entry.push({"resource" : Patient});
            bundle.entry.push({"resource" : encounter});
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