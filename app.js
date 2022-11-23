const http = require('http');
const BP = require('bp-api')

require('dotenv').config();

const bp = new BP("testssatanya.bpium.ru", process.env.BIPIUM_LOGIN, process.env.BIPIUM_PASS);

const hostname = "127.0.0.1";
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end("Hello World");
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

(async () => {

    const orderCatalog = 11;

    //all record with status = выполнено
    let recordsOrder = await bp.getAllRecords(orderCatalog, {});
    let dataRecordsOrder = await recordsOrder;
    let idsOrder = dataRecordsOrder.map(it => it);
      let arrIdsOrder = [];
      for (let id of idsOrder) {
        let status = String(id.values["2"]);
        if(status==="2"){
        arrIdsOrder.push({
          id:id.id,
          status:String(id.values["2"])
        });
       }
      }

      //arrIdsOrder.forEach(element => console.log(element))

    //change comment if status = выполнено
    let getComment = await fetch("https://test.bpium.ru/api/webrequest/request");
    let data = await getComment.json();
    //console.log(data.value);
    
    for (const element of arrIdsOrder){
      let changeComment = await bp.patchRecord(orderCatalog, element.id, {        
            3: data.value,       
        })
    console.log("Change comment: ");
    console.log(changeComment);
    }

    const processCatalog = 8;
    let recordsEvent = await bp.getAllRecords(processCatalog, {});
    let dataEvent = await recordsEvent;

    //create record in Order
    let createRecordOrder = await bp.postRecord(orderCatalog,{
    "2": [1],
    "3": 'Comment from app.js',
    });
    console.log("Create record: ");
    console.log(createRecordOrder);

    //if process===empty then continue creating a record for the Storage
    if (Object.keys(dataEvent).length !=0){
      let idsEvent = dataEvent.map(it => it);
      let arrIdsEvent = [];
      for (let id of idsEvent) {
        arrIdsEvent.push(id.id);
      }
      //arrIdsEvent.forEach(element=> console.log(element));
      for (let id of arrIdsEvent){
        let recordEvent = await bp.getRecordById(processCatalog,id);
        //console.log(typeof recordEvent.values);
        let eventStr = JSON.stringify(recordEvent.values, ["8"], '\t'); 
        let replaceKey = eventStr.replace('8','id');
        
        let eventJSON = JSON.parse(replaceKey);
        let eventValues = JSON.parse(eventJSON.id);
        
        let valuesRecordId = eventValues.recordId;
        let valuesCatalogId = eventValues.catalogId;
        let valuesEvent = eventValues.values;
        
        let strValuesEvent = JSON.stringify(valuesEvent);  

        let replaceKeyComment = strValuesEvent.replace('3','comment');
        let replaceKeyStatus = replaceKeyComment.replace('2','status');

        let valuesEventFormat = JSON.parse(replaceKeyStatus);
        //console.log(valuesCatalogId,valuesRecordId, valuesEventFormat);
        let createRecordStorage = await bp.postRecord(12,{"2": valuesEventFormat.comment,
        "3": new Date(),
        "4": [{"catalogId": valuesCatalogId,
        "recordId": valuesRecordId}]});
        console.log("Create record: ");
        console.log(createRecordStorage);
      }
      for (let i of arrIdsEvent){
        let recordsEvent = await bp.deleteRecord(processCatalog,i);
      }
    }
    else console.log("Object empty");
})();
