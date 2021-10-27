"use strict";
var KTDatatablesDataSourceAjaxServer = function() {

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
				url: HOST_URL + '/api/datatable/centers',
				type: 'POST',
				data: function(d){
					var data = {
						// parameters for custom backend script demo
						columnsDef: [
							'id', 'center_id', 'center_name' ,'concerned_person' , 'phone', 'email' ,'timings' , 'address' , 'google_map', 'action' ],
						orgName:window.orgName,
					}
					return $.extend(d,data);
				},
				
			},
			columns: [
				{data: 'id'},
				{data: 'center_id'},
				{data: 'center_name'},
				{data: 'concerned_person'},
				{data: 'phone'},
				{data: 'email'},
				{data: 'timings'},
				{data: 'address'},
				{data: 'google_map'},
				{data: 'action'},
			
		
			], 
			columnDefs: [
				{
					targets: -1,
					title: 'Action',
					orderable: false,
					render: function(data, type, full, meta) {
						return '\
							<div class="dropdown dropdown-inline">\
							<a href="javascript:;" class="btn btn-sm btn-clean edit-center btn-icon" title="Edit details">\
								<i class="la la-edit"></i>\
							</a>\
							<a href="javascript:;" class="btn btn-sm btn-clean delete-center btn-icon delete-center" title="Delete">\
								<i class="la la-trash"></i>\
							</a>\
						';
					},
				},
				{
					targets: -2,
					title: 'Maps',
					orderable: false,
					render: function(data, type, full, meta) {
						return '<a href="'+data+'" target="_blank" class="btn btn-sm btn-clean btn-icon" title="Maps">\
						<span class="svg-icon svg-icon-primary svg-icon-2x">\
							<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" \
							width="24px" height="24px" viewBox="0 0 24 24" version="1.1">\
    						<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\
        						<rect x="0" y="0" width="24" height="24"/>\
        						<path d="M5,10.5 C5,6 8,3 12.5,3 C17,3 20,6.75 20,10.5 C20,12.8325623 17.8236613,16.03566 13.470984,20.1092932 C12.9154018,20.6292577 12.0585054,20.6508331 11.4774555,20.1594925 C7.15915182,16.5078313 5,13.2880005 5,10.5 Z M12.5,12 C13.8807119,12 15,10.8807119 15,9.5 C15,8.11928813 13.8807119,7 12.5,7 C11.1192881,7 10,8.11928813 10,9.5 C10,10.8807119 11.1192881,12 12.5,12 Z" fill="#000000" fill-rule="nonzero"/>\
    								</g></svg><!--end::Svg Icon--></span></a>';
								},
				},

			],


			dom: 'Bfrtip',
			buttons: [
				'copy', 'csv', 'excel',
				{
					extend : 'pdfHtml5',
					title : function() {
						return "centers";
					},
					orientation : 'landscape',
					pageSize : 'A2',
					text : '<i class="fa fa-file-pdf-o"> PDF</i>',
					titleAttr : 'PDF',
					exportOptions: {
						columns:  [0,1,2,3,4,5,6,7,8],
						format: {
							body: function ( data, rowIdx,columnIdx) {
								if(columnIdx===8){
									data=$(data).attr('href');
								}
								return data;
							},
						},
					}
				},
					{ 
						extend:'copyHtml5',
						exportOptions: {
							columns:  [0,1,2,3,4,5,6,7,8],
							format: {
								body: function ( data, rowIdx,columnIdx) {
									if(columnIdx===8){
										data=$(data).attr('href');
									}
									return data;
								},
							},
	
						}
					},
					{ 
						extend:'csvHtml5',
						exportOptions: {
							columns:  [0,1,2,3,4,5,6,7,8],
							format: {
								body: function ( data, rowIdx,columnIdx) {
									if(columnIdx===8){
										data=$(data).attr('href');
									}
									return data;
								},
							},
						}
					},
				
			],
			createdRow: function(row, data, dataIndex){
				$('td:eq(7),td:eq(2)', row).css('min-width', '300px');
				$('td:eq(6)', row).css('min-width', '200px');
				$('td:eq(-1)', row).css('min-width', '150px');

			 },
		});
		

		$('.copy-export').on('click', function() {
			$('.buttons-copy').click()
		});
		$('.csv-export').on('click', function() {
			$('.buttons-csv').click()
		  });
		  $('.excel-export').on('click', function() {
			$('.buttons-excel').click()
		  });
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
