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
				url: HOST_URL + '/api/datatable/users',
				type: 'POST',
				
				data: function(d){
					var data = {
						// parameters for custom backend script demo
						columnsDef: [
							'id', 'email', 'name' , 'role', 'permissions','assigned_location','org_name', 'action' ],
						orgName:window.orgName,
					}
					return $.extend(d,data);
				},
				
			},
			columns: [
				{data: 'id'},
				{data: 'email'},
				{data: 'name'},
				{data: 'role'},
				{data: 'permissions'},
				{data: 'assigned_location'},
				{data: 'org_name'},
				{data: 'action'},
			],
			columnDefs: [
			
				{
					targets: -4,
					title: 'Permissions',
					orderable: false,
					render: function(data, type, full, meta) {
						if(data){
						return JSON.parse(data).map(permission=>{
								return permission;
							}).join(", ");
						
						}else{
							return '';
						}
				
				
					},
				},
				{
					targets: -1,
					title: 'Action',
					orderable: false,
					render: function(data, type, full, meta) {
						return '\
							<div class="dropdown dropdown-inline">\
							<a href="javascript:;" class="btn btn-sm btn-clean edit-user btn-icon" title="Edit details">\
								<i class="la la-edit"></i>\
							</a>\
							<a href="javascript:;" class="btn btn-sm btn-clean btn-icon delete-user" title="Delete">\
								<i class="la la-trash"></i>\
							</a>\
						';
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
				$('td:eq(4)', row).css('min-width', '400px');
				$('td:eq(-1)', row).css('min-width', '100px');

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
