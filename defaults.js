const defaultValues = {
  slipHtml: Buffer.from(` <div class="p-20 slip-main">
                        <h4>Thank you for booking Home PCR Testing! </h4>
                        <br/>
                        <div class="booking-slip-header d-flex align-items-center justify-content-between border-primary border-3 border card-rounded" style="margin: 0 -15px; padding: 15px;">
                        <img data-lazysrc="media/logos/logo-colored.png" class="w-auto h-80px" src="media/logos/logo-colored.png" style="opacity: 1;"> 
                        <h1>VOUCHER: {{Voucher}}</h1>
                        <img style="max-width:150px;height:auto!important;" src="" class="w-auto h-60px"> 
                        </div>
                        <div class="passenger-details d-flex align-items-center justify-content-between mt-20">
                        <div><h2>Passenger Name</h2><p class="slip-passenger-name">{{Passenger name}}</p> </div>
                        <div><h2>Booking Date</h2><p class="slip-booking-date">{{Booking date}}</p> </div>
                        </div>
                        <div class="booking-slip-details mt-10">
                        
                        <div class="row"><div class="col-4 slip-detail-title d-flex align-items-center justify-content-end bg-secondary h-60px card-rounded mt-3"><h6>Service Type</h6></div><div class="col-8 slip-detail d-flex align-items-center justify-content-start h-50px"><p id="slip-service">{{Service}}</p></div> </div>
                        
                        <div class="row"><div class="col-4 slip-detail-title d-flex align-items-center justify-content-end bg-secondary h-60px card-rounded mt-3"><h6>Phone</h6></div><div class="col-8 slip-detail d-flex align-items-center justify-content-start h-50px"><p id="slip-phone">{{Phone}}</p></div> </div>
                        <div class="row"><div class="col-4 slip-detail-title d-flex align-items-center justify-content-end bg-secondary h-60px card-rounded mt-3"><h6>Email</h6></div><div class="col-8 slip-detail d-flex align-items-center justify-content-start h-50px"><p id="slip-email">{{Email}}</p></div> </div>
                        <div class="row"><div class="col-4 slip-detail-title d-flex align-items-center justify-content-end bg-secondary h-60px card-rounded mt-3"><h6>Nationality</h6></div><div class="col-8  slip-detail d-flex align-items-center justify-content-start h-50px"><p id="slip-nationality">{{Nationality}}</p></div> </div>
                        
                        <br/>
                        <p><strong>Contact for any queries.</p>

                        </div>
                        </div>`).toString('base64'),

  bookingCreateEmail: Buffer.from(`<p> Dear {{Passenger name}}</p><p><br></p>
													
                        <p> Thanks for using 247medservices.com !</p>

                        <p> We have successfully received your application and here is the details you submitted:</p><p><br></p>

                        <p> Booking ID: {{Booking ID}} </p>
                        <p>	Voucher: {{Voucher}} </p>
                        <p>	Passenger name: {{Passenger name}}</p>
                        <p>	Passenger DOB: {{Passenger dob}}</p>
                        <p>	Service: {{Service}}</p>
                        <p>	Departure: {{Travel date}}</p>
                        <p> Phone: {{Phone}}</p>
                        <p>	Email: {{Email}}</p>
                        <p>	Nationality: {{Nationality}}</p>
                        <p>	Passport/UAE ID: {{Passport/UAE ID}}</p>
                        <p>	Booking date: {{Booking date}}</p><p><br></p>

                        <p>	You can visit any of the below center of your choice:</p>

                        <p>{{Center list}}</p>
                        <p>	Thanks </p>
                        <p>	247 Med Services  </p>

                        </div>`).toString('base64'),
  bookingAutoNotification : false,
  userLocations:[]

    
};

exports.defaultValues = defaultValues;
