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
				url: HOST_URL + '/api/datatable/organisations',
				type: 'POST',
				
				data: function(d){
					var data = {
						// parameters for custom backend script demo
						columnsDef: [
							'id', 'org_name', 'admin_name','admin_email' ,'action' ],
						orgName:window.orgName,
					}
					return $.extend(d,data);
				},
				
			},
			columns: [
				{data: 'id'},
				{data: 'org_name'},
				{data: 'admin_name'},
				{data: 'admin_email'},
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
							<a href="javascript:;" class="btn btn-sm btn-clean edit-org btn-icon" title="Edit details">\
								<i class="la la-edit"></i>\
							</a>\
							<a href="javascript:;" class="btn btn-sm btn-clean btn-icon delete-org" title="Delete">\
								<i class="la la-trash"></i>\
							</a>\
						';
					},
				},
				{
					targets: 1,
					title: 'ORGANISATION NAME',
					orderable: false,
					render: function(data, type, full, meta) {
						return data.split('_').join(' ').toUpperCase();
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
					titleAttr : 'PDF'
				} 
			],
			createdRow: function(row, data, dataIndex){
				$('td:eq(2)', row).css('min-width', '150px');

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
