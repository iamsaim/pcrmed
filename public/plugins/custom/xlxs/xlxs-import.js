$(function(){


const upload = function(e,callback) {
   let targId=e.target.id;
   let file = e.target.files[0];
   let arr=[]
   if (!file) return;
   let FR = new FileReader();
   FR.onload = function(e) {
     let data = new Uint8Array(e.target.result);
     let workbook = XLSX.read(data, {type: 'array',cellDates: true});
     let sheet = workbook.Sheets[workbook.SheetNames[0]];
     let range = XLSX.utils.decode_range(sheet['!ref']);
      for(let R = range.s.r; R <= range.e.r; ++R) {
        let row=[];
        for(let C = range.s.c; C <= range.e.c; ++C) {
         let cellref = XLSX.utils.encode_cell({c:C, r:R});
         if(!sheet[cellref]) continue;
         let cell = sheet[cellref];
         if(cell.v){
           row.push(cell.v);
         };
       };
       arr.push(row);

      };
      callback(arr.slice(2));
    }; 
   FR.readAsArrayBuffer(file);

}

$('body').on('click','#upload-field-passengers',function(){
  toastr.info('',"Only xlxs file allowed. Leave first two rows empty and don't include Sr. No and Booking ID columns.");

});
$('#upload-field-passengers').change(function(e){
  upload(e, storePassengers);
  $('#upload-field-passengers').val(null);
});

function storePassengers(passengers){

  if(passengers.length>500){
    toastr.error('','Only 500 rows can be imported at once.');
    return;
  }
     $.ajax({
      url: '/api',
      type: "POST",
      data: {
        action: "selectCustomId",
        limit: passengers.length,
        orgName:window.orgName,
      },
      dataType: "json",
    })
    .done(function (response) {
      if(response.message==="success"){
        passengers=passengers.filter(passenger=>{
          if(passenger.length<1){
            return false;
          }else{
            return true;
          }
        });

        passengers=passengers.map((passenger,idxPassenger)=>{
          //Add customId Row
          passenger.unshift(response.ids[idxPassenger]);

          passenger = [...passenger,...new Array(window.allowedBookingColumnsKey.length).fill(null)];
          passenger = passenger.slice(0,window.allowedBookingColumnsKey.length);
          
          passenger=passenger.map((field,idxField)=>{
            //Parse dates in unix format
            var datesIdx=[3,5,10,12,17];
            datesIdx =datesIdx.map((date,idx)=>{
              return window.allowedBookingColumnsKey.indexOf(window.allBookingColumnsKey[date]);
            }).filter(val=>val>=0);
            if(datesIdx.includes(idxField)){
              field =  parseInt(new Date(field).getTime()/1000);
            }
            return field;
          });


          return passenger;
        }); 

 
        $
        .ajax({
          url: '/api',
          type: "POST",
          data: {
            action: "insertBookings",
            passengers: JSON.stringify(passengers),
            orgName: window.orgName,
          },
          dataType: "json",
        })
        .done(function (response) {
          if(response.message==="success"){
            window.ktDataTable.ajax.reload();
            toastr.success('', 'Passengers added!');
          }else {
            var errMesage = response.message.split(':')[1];
            errMesage = errMesage.replace('ticket', 'voucher number');
            errMesage = errMesage || 'Some error occured!';
            toastr.error('', errMesage);
          }
        });

      }
    });


}


$('#upload-field-centers').change(function(e){
  upload(e, storeCenters);
  $('#upload-field-centers').val(null);
});


function storeCenters(centers){
  centers=centers.map(center=>{
    return center.slice(0,7);
}); 


  centers=centers.filter(center=>{
      if(centers.includes('') || center.includes('') || center.length<1){
        return false;
      }else{
        return true;
      }
  }); 


  $
    .ajax({
      url: '/api',
      type: "POST",
      data: {
        action: "insertCenters",
        centers: JSON.stringify(centers),
        orgName: window.orgName,
      },
      dataType: "json",
    })
    .done(function (response) {
      if(response.message==="success"){
        window.ktDataTable.ajax.reload();
        toastr.success('', 'Centers added!');
      }else{
        toastr.error('', 'Some error occured!');
      }
    });
}




});
