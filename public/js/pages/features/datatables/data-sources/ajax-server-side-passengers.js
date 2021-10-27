"use strict";
var KTDatatablesDataSourceAjaxServer = function() {
	var getColumns =function(){
		return window.allowedBookingColumnsKey.map(key=>{
			return {data:key};
		})
	};

	var initTable1 = function() {
		var table = $('#kt_datatable');
		// begin first table
		window.ktDataTable = table.DataTable({
            scrollX: true,
			scrollCollapse: true,
			searchDelay: 500,
			processing: true,
			serverSide: true,
			ajax: {
				url: HOST_URL + '/api/datatable/passengers',
				type: 'POST',
				data: function(d){
					var data = {
						// parameters for custom backend script demo
						columnsDef: window.userRole ==='Center' ? ['id',...window.allowedBookingColumnsKey]: ['id',...window.allowedBookingColumnsKey,'action'],
						orgName:window.orgName,
						startDate:parseInt(new Date($('#kt_datepicker [name="start"]').val()).getTime()/1000) || 1,
						endDate:parseInt(new Date($('#kt_datepicker [name="end"]').val()).getTime()/1000) || 32503660200
					}
					return $.extend(d,data);
				},
			},
			columns:window.userRole ==='Center' ? [{data:'id'},...getColumns()] :[{data:'id'},...getColumns(),{data:'action'}],
			columnDefs: [
	
				( window.userRole ==='Center' ? {}:{
					targets: -1,
					title: 'Action',
					orderable: false,
					render: function(data, type, full, meta) {
						return (window.userRole ==='Owner' ?'<a href="javascript:;" class="btn btn-sm btn-clean btn-icon" title="Delete details">\
								<i class="la la-trash"></i>\
							</a>' :'')
							+'<a href="javascript:;" class="btn btn-sm btn-clean edit-booking btn-icon" title="Edit details">\
								<i class="la la-edit"></i>\
							</a>\
							<a href="/Voucher.pdf" target="_blank" class="btn btn-sm btn-clean btn-icon" title="Print" data-toggle="modal" data-target="#print-booking">\
							<i class="la la-print"></i>\
							</a>'
							+(!window.bookingAutoNotification ? '<a href="javascript:;" class="btn btn-sm btn-clean btn-icon" title="Send notification" data-toggle="modal"  data-target="#print-booking">\
							<i class="flaticon2-bell-3" style="font-size:14px;"></i>\
							</a>':'');
					},
				}),
	
				( window.allowedBookingColumnsKey.indexOf("status") >0 ?{
					targets:  window.allowedBookingColumnsKey.indexOf("status")+1,
					title: 'Status',
					orderable: false,
					render: function(data, type, full, meta) {
						if(!data || typeof data !== 'string'){
							data='pending';
						}
						data=data.toLowerCase();
						if ( 'negative' === data ) {
							data = "<div class='status-wrapper'>\
							<div class='am-status status-green'> <span>Negative</span> </div>\
							<a href='javascript:;' class='btn btn-sm btn-clean btn-icon' data-toggle='dropdown'>\
							<i class='far fa-edit'></i>\
							</a>\
							<div class='dropdown-menu dropdown-menu-sm dropdown-menu-right'>\
							<form class='form'>\
							<div class='form-group row ml-5'>\
							<label class='col-12 col-form-label'>Change Status</label>\
								<div class='col-12 col-form-label'>\
									<div class='radio-list'>\
										<label class='radio radio-accent radio-success'>\
										<input type='radio' name='am-status-val' value='negative' checked='checked'/>\
											<span></span>\
											Negative\
										</label>\
										<label class='radio radio-accent radio-danger'>\
										<input type='radio' name='am-status-val' value='positive'/>\
										<span></span>\
											Positive\
										</label>\
										 <label class='radio radio-accent radio-warning'>\
										 <input type='radio' name='am-status-val' value='pending'/>\
										 <span></span>\
											Pending\
										</label>\
										<label class='radio radio-accent radio-primary'>\
										<input type='radio' name='am-status-val' value='attended' />\
										<span></span>\
										   Attended\
									   </label>\
									   \
									</div>\
								</div>\
							</div>\
						</form>\
							</div>\
						</div>";
						}  else if ( 'positive' === data ) {
							data = "<div class='status-wrapper'>\
							<div class='am-status status-red'> \
							<span>Positive</span> \
							</div><a href='javascript:;' class='btn btn-sm btn-clean btn-icon' data-toggle='dropdown'>\
								<i class='far fa-edit'></i>\
								</a>\
								<div class='dropdown-menu dropdown-menu-sm dropdown-menu-right'>\
								<form class='form'>\
								<div class='form-group row ml-5'>\
									<label class='col-12 col-form-label'>Change Status</label>\
									<div class='col-12 col-form-label'>\
										<div class='radio-list'>\
											<label class='radio radio-accent radio-success'>\
											<input type='radio' name='am-status-val' value='negative'/>\
												<span></span>\
												Negative\
											</label>\
											<label class='radio radio-accent radio-danger'>\
											<input type='radio' name='am-status-val' value='positive' checked='checked'/>\
											<span></span>\
												Positive\
											</label>\
											 <label class='radio radio-accent radio-warning'>\
											 <input type='radio' name='am-status-val' value='pending'/>\
											 <span></span>\
												Pending\
											</label>\
											<label class='radio radio-accent radio-primary'>\
											<input type='radio' name='am-status-val' value='attended' />\
											<span></span>\
											   Attended\
										   </label>\
										   \
										</div>\
									</div>\
								</div>\
							</form>\
								</div>\
							</div>";
		
						}else if ( 'attended' === data ) {
							data = "<div class='status-wrapper'>\
							<div class='am-status status-blue'> \
							<span>Attended</span> \
							</div><a href='javascript:;' class='btn btn-sm btn-clean btn-icon' data-toggle='dropdown'>\
								<i class='far fa-edit'></i>\
								</a>\
								<div class='dropdown-menu dropdown-menu-sm dropdown-menu-right'>\
								<form class='form'>\
								<div class='form-group row ml-5'>\
									<label class='col-12 col-form-label'>Change Status</label>\
									<div class='col-12 col-form-label'>\
										<div class='radio-list'>\
											<label class='radio radio-accent radio-success'>\
											<input type='radio' name='am-status-val' value='negative'/>\
												<span></span>\
												Negative\
											</label>\
											<label class='radio radio-accent radio-danger'>\
											<input type='radio' name='am-status-val' value='positive' />\
											<span></span>\
												Positive\
											</label>\
											 <label class='radio radio-accent radio-warning'>\
											 <input type='radio' name='am-status-val' value='pending'/>\
											 <span></span>\
												Pending\
											</label>\
											<label class='radio radio-accent radio-primary'>\
											<input type='radio' name='am-status-val' value='attended' checked='checked'/>\
											<span></span>\
											   Attended\
										   </label>\
										   \
										</div>\
									</div>\
								</div>\
							</form>\
								</div>\
							</div>";
		
						}else{
							data = "<div class='status-wrapper'>\
							<div class='am-status status-yellow'> <span>Pending</span>\
							</div><a href='javascript:;' class='btn btn-sm btn-clean btn-icon' data-toggle='dropdown'>\
							<i class='far fa-edit'></i>\
							</a>\
							<div class='dropdown-menu dropdown-menu-sm dropdown-menu-right'>\
							<form class='form'>\
							<div class='form-group row ml-5'>\
								<label class='col-12 col-form-label'>Change Status</label>\
								<div class='col-12 col-form-label'>\
									<div class='radio-list'>\
										<label class='radio radio-accent radio-success'>\
										<input type='radio' name='am-status-val' value='negative'/>\
											<span></span>\
											Negative\
										</label>\
										<label class='radio radio-accent radio-danger'>\
										<input type='radio' name='am-status-val' value='positive'/>\
											<span></span>\
											Postive\
										</label>\
										 <label class='radio radio-accent radio-warning'>\
										 <input type='radio' name='am-status-val' value='pending' checked='checked'/>\
										 <span></span>\
											Pending\
										</label>\
										<label class='radio radio-accent radio-primary'>\
										<input type='radio' name='am-status-val' value='attended' />\
										<span></span>\
										   Attended\
									   </label>\
									   \
									</div>\
								</div>\
							</div>\
						</form>\
							</div>\
						</div>";
						};
						return data;
				
					},
				}: {}),
				{
					// targets: window.allowedBookingColumnsKey.indexOf("service")+1,
					// title: 'Service',
					// orderable: false,
					// render: function(data, type, full, meta) {
					// 	if(!data){
					// 		return '';
					// 	}
					// 	var serviceTypes = ['Clinic PCR testing - Basic','Clinic PCR testing - Urgent','Clinic PCR testing - Express','Hotel PCR testing - Basic','Hotel PCR testing - Urgent','Hotel PCR testing - Express', 'Home PCR testing - Basic'];
					// 	data = serviceTypes.includes(data) ? data : 'Clinic PCR testing - Basic';

					// 	var list = serviceTypes.map(service=>{
					// 		return "<label class='radio  radio-primary'><input type='radio' name='am-service-val' value='"+service+"' "+(data===service?"checked='checked'":"" )+"/><span></span>"+service+"</label>";
					// 	}).join("");
					// 	return "<div class='service-wrapper'>\
					// 	<div class='am-service'> <span>"+data+"</span> </div>\
					// 	<a href='javascript:;' class='btn btn-sm btn-clean btn-icon' data-toggle='dropdown'>\
					// 	<i class='far fa-edit'></i>\
					// 	</a>\
					// 	<div class='dropdown-menu dropdown-menu-sm dropdown-menu-right' id='service-dropdown'>\
					// 	<form class='form'>\
					// 	<div class='form-group row ml-5'>\
					// 		<div class='col-12 col-form-label'>\
					// 			<div class='radio-list'>"+list+"</div>\
					// 		</div>\
					// 	</div>\
					// </form>\
					// 	</div>\
					// </div>";
					// },
			
				},
				
			],

			dom: 'Bfrtip',
			buttons: [
				{ 
					extend:'copyHtml5',
					exportOptions: {
						format: {
							body: function ( data, rowIdx,columnIdx ) {
								if(data.toString().includes('am-status')){
									data=$(data).find('.am-status span').html();
								}
								return data;
							},
						},
						columns:  [...Array(window.allowedBookingColumnsKey.length+1)].map((val,i) => i)

					}
				},
				{ 
					extend:'csvHtml5',
					exportOptions: {
						format: {
							body: function ( data, rowIdx,columnIdx ) {
								if(data.toString().includes('am-status')){
									data=$(data).find('.am-status span').html();
								}
								return data;
							}
						},
						columns:  [...Array(window.allowedBookingColumnsKey.length+1)].map((val,i) => i)
					}
				},
				{
					extend : 'pdfHtml5',
					title : function() {
						return "passengers";
					},
					orientation : 'landscape',
					pageSize : 'A2',
					text : '<i class="fa fa-file-pdf-o"> PDF</i>',
					titleAttr : 'PDF',
					exportOptions: {
						format: {
							body: function ( data, rowIdx,columnIdx ) {
								if(data.toString().includes('am-status')){
									data=$(data).find('.am-status span').html();
								}
								return data;
							}
						},
						columns:  [...Array(window.allowedBookingColumnsKey.length+1)].map((val,i) => i)
					}
				} 
			],
			createdRow: function(row, data, dataIndex){
				$('td:eq(-1),td:eq(14)', row).css('min-width', '150px');
				$('td:eq(5)', row).css('min-width', '200px');

			 },
			 
		});
		
		$('.copy-export').off();
		$('.copy-export').on('click', function() {
			$('.buttons-copy').click()
		});

		$('.csv-export').off();
		$('.csv-export').on('click', function() {
			$('.buttons-csv').click()
		});

		$('.pdf-export').off();
		$('.pdf-export').on('click', function() {
			$('.buttons-pdf').click()
		});


	};

	return {

		//main function to initiate the module
		init: function() {
			initTable1();
		},

	};

}();

jQuery(document).ready(function() {
	KTDatatablesDataSourceAjaxServer.init();
});
