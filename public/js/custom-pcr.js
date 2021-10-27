

const lazyLoadImages = function () {
  function reloadImages() {
    $('img[data-lazysrc]').each(function () {
      //* set the img src from data-src
      $(this).attr('src', $(this).attr('data-lazysrc'));
      $(this).css('opacity', '1');

    }
    );
  }
  document.addEventListener('readystatechange', event => {
    if (event.target.readyState === "interactive") {  //or at "complete" if you want it to execute in the most last state of window.
      reloadImages();
    }
  });
}();



$(function () {

  var UpdateBooking = false,
    UpdateUser = false,
    UpdateOrg = false,
    UpdateCenter = false,
    CurrentCenterEditId,
    SendBookingSlipOn = false;
    RenderSlipVoucherNumber = '',
    SlipHtml = '',

  //Init toastr options
  (toastr.options = {
    closeButton: false,
    debug: false,
    newestOnTop: false,
    progressBar: false,
    positionClass: 'toast-top-right',
    preventDuplicates: false,
    onclick: null,
    showDuration: '0',
    hideDuration: '1000',
    timeOut: '3000',
    extendedTimeOut: '1000',
    showEasing: 'swing',
    hideEasing: 'linear',
    showMethod: 'fadeIn',
    hideMethod: 'fadeOut',
  }),
    (BookingFormOptionalInputNames = {
      service: 'serviceType',
      departure: 'passengerDepart',
      phone: 'phone',
      nationality: 'nationality',
      passport_id: 'passport',
      passport_expiry: 'passportExpiry',
    });


  function isJson(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  function isBase64(str) {
    try {
      atob(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  $('#kt_datepicker').datepicker({
    todayHighlight: true,
    templates: {
      leftArrow: '<i class="la la-angle-left"></i>',
      rightArrow: '<i class="la la-angle-right"></i>',
    },
  });
  var arrows;
  if (KTUtil.isRTL()) {
    arrows = {
      leftArrow: '<i class="la la-angle-right"></i>',
      rightArrow: '<i class="la la-angle-left"></i>',
    };
  } else {
    arrows = {
      leftArrow: '<i class="la la-angle-left"></i>',
      rightArrow: '<i class="la la-angle-right"></i>',
    };
  }
  $('#datepicker_depart, #datepicker_dob, #datepicker_expiry').datepicker({
    rtl: KTUtil.isRTL(),
    todayBtn: 'linked',
    clearBtn: true,
    todayHighlight: true,
    templates: arrows,
  });

  /*----------------------------------------------------------------*/

  /*-----stats------*/
  function getStats() {
    if (window.location.pathname !== '/bookings' || window.userRole==='Center') {
      return;
    }
    var now = new Date(),
      dayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0
      ),
      localDayStartTimeInUnix = parseInt(dayStart.getTime() / 1000),
      weekStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - now.getDay(),
        0,
        0,
        0
      ),
      localWeekStartTimeInUnix = parseInt(weekStart.getTime() / 1000),
      monthStart = new Date(now.getFullYear(), now.getMonth(), 0, 0, 0, 0),
      localMonthStartTimeInUnix = parseInt(monthStart.getTime() / 1000),
      startTimes = [
        localDayStartTimeInUnix,
        localWeekStartTimeInUnix,
        localMonthStartTimeInUnix,
      ];
    $.ajax({
      url: '/api',
      type: 'POST',
      data: {
        action: 'getStats',
        startTimes: JSON.stringify(startTimes),
        orgName: window.orgName,
      },
      dataType: 'json',
    }).done(function (response) {
      if (response.message === 'success') {
        var appreciateClasses = 'ki-arrow-up label label-light-success';
        var depreciateClasses = 'ki-arrow-down label label-light-danger';
        var timeFrames = ['month', 'week', 'yesterday'];
        var statTypes = ['bookings', 'attended'];

        var statIdx = 0;
        statTypes.forEach((statType) => {
          timeFrames.forEach((timeFrame) => {
            $('#' + statType + '-since-' + timeFrame).html(
              response.stats[statIdx + 1]
            );
            var statPercent =
              (100 * (response.stats[statIdx + 1] - response.stats[statIdx])) /
              response.stats[statIdx + 1];
            if (statPercent < 0) {
              statPercent = Math.round(-100 * statPercent) / 100;
              $('#' + statType + '-since-' + timeFrame + '-percent')
                .closest('.pt-4')
                .children('i')
                .removeClass(appreciateClasses);
              $('#' + statType + '-since-' + timeFrame + '-percent')
                .closest('.pt-4')
                .children('i')
                .addClass(depreciateClasses);
            } else {
              statPercent = Math.round(100 * statPercent) / 100;
              $('#' + statType + '-since-' + timeFrame + '-percent')
                .closest('.pt-4')
                .children('i')
                .removeClass(depreciateClasses);
              $('#' + statType + '-since-' + timeFrame + '-percent')
                .closest('.pt-4')
                .children('i')
                .addClass(appreciateClasses);
            }
            $('#' + statType + '-since-' + timeFrame + '-percent').html(
              statPercent + '%'
            );
            statIdx = statIdx + 2;
          });
        });
      }
    });
  }
  getStats();
  setInterval(getStats, 60000);

  /*----------------------------------------------------------------*/
  /*------/bookings------*/

  $('#kt_datatable').on('change', '.status-wrapper input', function () {
    var value = $(this).val();
    var ticket = $(this).closest('tr').find('td:nth-child(2)').html();

    $.ajax({
      url: '/api',
      type: 'POST',
      data: {
        action: 'updateBookingStatus',
        passengersData: JSON.stringify({ status: value }),
        conditionalColumn: 'custom_id',
        whereIn: JSON.stringify([ticket]),
        orgName: window.orgName,
      },
      dataType: 'json',
    }).done(function (response) {
      if (response.message === 'success') {
        window.ktDataTable.ajax.reload();
      }
    });
  });

  $('#add-booking').on('hidden.bs.modal', function () {
    UpdateBooking = false;
    $('#add-booking h5').html('Add a booking');

    //jQuery ("[name='passengerId']").removeAttr ('readonly');
    $('#add-booking form')[0].reset();
  });

  $('[name="nationality"]').select2({
    placeholder: 'Search country',
    ajax: {
      url: '/api',
      type: 'POST',
      dataType: 'json',
      data: function (params) {
            var query = {
              action: 'autoCompleteCountries',
              country:params.term,
            }
            return query;
       },
      processResults: function (response) {
        return {
          results: response.result.map((country)=>({id: country.nationality, text:country.nationality}))
    
       };
        }
      }
  });


  $('select[name="centerName"]').select2({
    placeholder: 'Search center name',
    ajax: {
      url: '/api',
      type: 'POST',
      dataType: 'json',
      data: function (params) {
            var query = {
              action: 'autoCompleteCenters',
              center:params.term,
              orgName:window.orgName,

            }
            return query;
       },
      processResults: function (response) {
        return {
          results: response.result.map((center)=>({id: center.center_name, text:center.center_name}))
    
       };
        }
      }
  });

  $('#booking-submit').click(function () {
    var passengersData = [
      $("[name='passengerId']").val(),
      $("[name='ticketNumber']").val(),
      $("[name='passengerName']").val(),
      parseInt(new Date($("[name='passengerDOB']").val()).getTime() / 1000),
      $("[name='serviceType']").val(),
      parseInt(new Date($("[name='passengerDepart']").val()).getTime() / 1000),
      $("[name='phone']").val(),
      $("[name='passengerEmail']").val(),
      $("[name='nationality']").val(),
      $("[name='passport']").val(),
      parseInt(new Date($("[name='passportExpiry']").val()).getTime() / 1000),
      '', //agent
      parseInt(new Date().getTime()/1000), //booking date
      'pending', //status
      '',//lpo no
      '',//invoice
      $("[name='centerName']").val(), //center_name
    ];

    if (UpdateBooking) {
      var passengerDataObject = {};
      passengerDataObject.custom_id = passengersData[0];
      passengerDataObject.ticket = passengersData[1];
      passengerDataObject.name = passengersData[2];
      passengerDataObject.dob = passengersData[3];
      passengerDataObject.service = passengersData[4];
      passengerDataObject.departure = passengersData[5];
      passengerDataObject.phone = passengersData[6];
      passengerDataObject.email = passengersData[7];
      passengerDataObject.nationality = passengersData[8];
      passengerDataObject.passport_id = passengersData[9];
      passengerDataObject.passport_expiry = passengersData[10];
      passengerDataObject.center_name = passengersData[16];


      passengersData = $.ajax({
        url: '/api',
        type: 'POST',
        data: {
          action: 'updateBooking',
          passengersData: JSON.stringify(passengerDataObject),
          whereIn: JSON.stringify([passengersData[0]]),
          conditionalColumn: 'custom_id',
          orgName: window.orgName,
        },
        dataType: 'json',
      }).done(function (response) {
        if (response.message === 'success') {
          $('#add-booking').modal('toggle');
          toastr.success('', 'Booking updated!');

          window.ktDataTable.ajax.reload();
        }
      });
    } else {
      $.ajax({
        url: '/api',
        type: 'POST',
        data: {
          action: 'addBookings',
          passengersData: JSON.stringify(passengersData),
          orgName: window.orgName,
        },
        dataType: 'json',
      }).done(function (response) {
        if (response.message === 'success') {
          $('#add-booking').modal('toggle');
          toastr.success('', 'Booking added!');

          window.ktDataTable.ajax.reload();
        } else {
          var errMesage = response.message.split(':')[1];
          errMesage = errMesage.replace('ticket', 'voucher number');
          errMesage = errMesage || 'Some error occured!';
          toastr.error('', errMesage);
        }
      });
    }
  });

  $('#kt_datatable').on('change', '.service-wrapper input', function () {
    var value = $(this).val();
    var ticket = $(this).closest('tr').find('td:nth-child(2)').html();

    $.ajax({
      url: '/api',
      type: 'POST',
      data: {
        action: 'updateBooking',
        passengersData: JSON.stringify({ service: value }),
        conditionalColumn: 'ticket',
        whereIn: JSON.stringify([ticket]),
      },
      dataType: 'json',
    }).done(function (response) {
      if (response.message === 'success') {
        window.ktDataTable.ajax.reload();
      }
    });
  });
  $('body').on(
    'click',
    '[data-target="#print-booking"]',
    renderBookingSlip
  );
  $('#service_select2, #service_select2_validate').select2({
    placeholder: 'Select a service',
  });

  $('.new-booking-record').click(function () {
    $.ajax({
      url: '/api',
      type: 'POST',
      data: {
        action: 'selectCustomId',
        orgName: window.orgName,
        limit: 1,
      },
      dataType: 'json',
    }).done(function (response) {
      if (response.message === 'success') {
        window.bookingId = response.ids[0];
        $("#add-booking [name='passengerId']").val(window.bookingId);
      }
    });
  });

  $('.new-booking-record').click(function () {
    $('#add-booking').modal({
      backdrop: 'static',
      keyboard: false,
    });
  });

  $('#add-booking').on('click', '.ki-close,[type="reset"]', function (params) {
    $.ajax({
      url: '/api',
      type: 'POST',
      data: {
        action: 'releaseCustomId',
        orgName: window.orgName,
        id: window.bookingId,
      },
      dataType: 'json',
    }).done(function (response) {
      if (response.message === 'success') {
        window.ktDataTable.ajax.reload();
      }
    });
    $('#add-bookin input,select').val('');
  });

  function renderBookingSlip() {
    var tr = $(this).closest('tr');

    var slipMainHtml  = SlipHtml;
   // slipMainHtml = slipMainHtml.replace(/{{Service}}/g,tr.children('td:nth-child(' + (window.allowedBookingColumnsKey.indexOf('service')+2) + ')').find('.am-service span').html()); 
    window.allowedBookingColumnsValue.forEach(function(key,id){
      slipMainHtml = slipMainHtml.replace(new RegExp('{{'+key+'}}','g'), tr.children('td:nth-child(' + (id+2) + ')').html());
    });

    slipMainHtml = slipMainHtml.replace(/{{Agent name}}/g,window.userName); 
    RenderSlipVoucherNumber = tr.children('td:nth-child(' + (2) + ')').html();
    $('.slip-main').replaceWith(slipMainHtml);
    $('.slip-main').attr('class', 'modal-body overlay overlay-block p-20 slip-main');
  }

  var convertBookingSlipToPDF = function (email = '', name = '') {
    var text = document.querySelectorAll('.slip-main');
    toastr.info('Generating pdf...');

    for (let i = 0; i < text.length; i++) {
      text[i].style.fontFeatureSettings = '"liga" 0';
    }
    //a4
    var doc = new jsPDF('p', 'mm', 'a4', true);

    var imgWidth = doc.internal.pageSize.getWidth();
    var pageHeight = doc.internal.pageSize.getHeight()-10;
    var nPages = document.querySelectorAll('.slip-main').length;
    if (nPages < 1) {
      return;
    }

    var ref =this;


    function getClippedRegion(image, sx, sy,width,height) {

      var canvas = document.createElement('canvas'),
          ctx = canvas.getContext('2d');
  
      canvas.width = width;
      canvas.height = height;
  
      ctx.drawImage(image,sx, sy,width,height,0,0,width,height);
  
      return canvas;
  }

    html2canvas($('.slip-main')[0], {
      allowTaint: true,
      removeContainer: true,
      backgroundColor: null,
      imageTimeout: 15000,
      logging: false,
      scale: 2,
      useCORS: true,
      letterRendering: true,
      scrollY: 0,
    }).then(function (canvas) {
      var sizeFactor =  imgWidth / canvas.width;
      var margin  = 5;  //mm
      var position = 0;
      var imgHeight =pageHeight;
      var imgData;
      imgData = getClippedRegion(canvas,0,position/sizeFactor,canvas.width, imgHeight/sizeFactor).toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 0, margin, imgWidth, imgHeight,'','FAST');
      position += imgHeight;

      while (position <= canvas.height*sizeFactor) {
        doc.addPage();

        imgData = getClippedRegion(canvas,0,position/sizeFactor,canvas.width, imgHeight/sizeFactor).toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 0, margin, imgWidth, imgHeight,'','FAST');
        position += imgHeight;
      }



      if (!SendBookingSlipOn) {
        doc.save(
          RenderSlipVoucherNumber  +
          '-booking-slip.pdf'
        );
        toastr.success('Booking slip saved.');

        $('#print-booking').modal('toggle');
      } else {
        var pdf = doc.output('datauristring');
        toastr.options={...toastr.options, timeout:'200000', hideDuration: '10000',
        timeOut: '30000',
        extendedTimeOut: '10000'};
        toastr.info('Sending...');

        //Get passengerObject

        var passenger = {};
        var tr = $(ref).closest('tr');

        window.allowedBookingColumnsKey.forEach(function(key,id){
          passenger[key] = tr.children('td:nth-child(' + (id+2) + ')').html();
        });
       // passenger['service'] = tr.children('td:nth-child(' + (window.allowedBookingColumnsKey.indexOf('service')+2) + ')').find('.am-service span').html(); 

        
        jQuery
          .ajax({
            url: '/api',
            type: 'POST',
            data: {
              action: 'sendBookingSlip',
              name: name,
              email: email,
              pdf: pdf,
              orgName: orgName,
              passenger: JSON.stringify(passenger),
            },
            dataType: 'json',
          })
          .done(function (response) {
            toastr.options={...toastr.options, timeout:'3000', hideDuration: '1000',
            timeOut: '3000',
            extendedTimeOut: '1000'};
            jQuery('.toast').remove();

            if (response.message === 'success') {
              toastr.success('Booking slip sent');
              $('#print-booking').modal('toggle');
            } else {
              toastr.error('Failed!');
            }
      

          });
      }
    });
  };
  $('#print-send-booking-btn').click(function () {
    convertBookingSlipToPDF(
    //  $('#slip-email').html().trim(),
     // $('.slip-passenger-name').html().trim()
    );
  });
  $('body').on('click', ".edit-booking", function () {
    UpdateBooking = true;
    $('#add-booking h5').html('Edit booking');
    var tr = $(this).closest('tr');


    var bookingColumnsToInputNames = {
      custom_id:'passengerId',
      ticket:'ticketNumber',
      name:'passengerName',
      dob:'passengerDOB',
      departure:'passengerDepart',
      phone:'phone',
      service:'serviceType',
      email:'passengerEmail',
      nationality:'nationality',
      passport_id:'passport',
      passport_expiry:'passportExpiry',
      center_name:'centerName',

    };
    window.allowedBookingColumnsKey.forEach(function(key,id){
      var val = tr.children('td:nth-child(' + (id+2) + ')').html();
      if(key==='nationality' || key==='center_name'){
        var newOption = new Option(val,val, false, false);
        $("[name='"+bookingColumnsToInputNames[key]+"']").append(newOption).trigger('change');
      }
      $("[name='"+bookingColumnsToInputNames[key]+"']").val(val).trigger('change');
    });


    $("[name='passengerId']").attr('readonly', 'true');
    $('#add-booking').modal('toggle');

    $('#booking-submit').html('Update');
  });

  $('body').on('click', '[title="Send notification"]', sendNotification);
  function sendNotification() {
    renderBookingSlip.bind(this)();

    convertBookingSlipToPDF = convertBookingSlipToPDF.bind(this);

    $('#print-send-booking-btn').html('Send');
    $('#printBookingLabel').html('Send booking slip');
    SendBookingSlipOn = true;
  }

  $('#print-booking').on('hidden.bs.modal', function () {
    $('#print-send-booking-btn').html('Print');
    $('#printBookingLabel').html('Print booking slip');
    SendBookingSlipOn = false;
  });

  $('body').on('click', "[title='Delete details']", function () {
    var tr = $(this).closest('tr');
    var ids = [parseInt(tr.children(':nth-child(1)').html())];
    $.ajax({
      url: '/api',
      type: 'POST',
      data: {
        action: 'deleteBookings',
        passengerIds: JSON.stringify(ids),
        orgName: window.orgName,
      },
      dataType: 'json',
    }).done(function (response) {
      if (response.message === 'success') {
        toastr.success('', 'Booking deleted!');

        window.ktDataTable.ajax.reload();
      }
    });
  });


  function reRenderBookingTableWithOrgSettings() {
    if(window.ktDataTable){
      window.ktDataTable.destroy();
    }
    $('.datatable-wrapper thead,.datatable-wrapper tr').remove();

    // render table head
    var thead =
      '<thead><tr><th>Sr.</th>' +
      window.allowedBookingColumnsValue
        .map((col) => '<th>' + col + '</th>')
        .join('') +
      '<th>Action</th></tr></thead>';
    $('.datatable-wrapper table').prepend(thead);
    KTDatatablesDataSourceAjaxServer.init();

    //Disable all optional fields in add/edit booking form
    for (var prop in BookingFormOptionalInputNames) {
      var optionals = $(
        '[name="' + BookingFormOptionalInputNames[prop] + '"]'
      );
      if (optionals.length > 0) {
        optionals.closest('.row').parent().css('display', 'none');
      }
    }
    //Enable allowed optional fields in add/edit booking form
    window.allowedBookingColumnsKey.forEach((key) => {
      if (!BookingFormOptionalInputNames[key]) {
        return;
      }
      var allowedOptionals = $(
        '[name="' + BookingFormOptionalInputNames[key] + '"]'
      );
      if (allowedOptionals.length > 0) {
        allowedOptionals
          .closest('.row')
          .parent()
          .css('display', 'block');
      }
    });
  }
  document.querySelector('body').addEventListener('bookingColumnsChanged',reRenderBookingTableWithOrgSettings);

  function initBookingSlip(settings) {
    SlipHtml = isBase64(settings.slipHtml) ? atob(settings.slipHtml) : '';
    $('.slip-main').replaceWith(SlipHtml);
    $('.slip-main').attr('class', 'modal-body overlay overlay-block p-20 slip-main');
    //Init logo
    $('.booking-slip-header img:nth-child(3)').attr(
      'src',
      settings.orgLogo
    );
  }

  function initBookingsPage(settings) {
    if ('/bookings' === window.location.pathname) {
      initBookingSlip(settings);
    }
  }



  /*----------------------------------------------------------------*/
  /*--- /users----*/

  if ($('#location_select2, #location_select2_validate')[0]) {
    $('#location_select2, #location_select2_validate').select2({
      placeholder: 'Select location',
    });
  }

  $('#user-submit').click(function () {
    if (UpdateUser) {
      var userData = {
        email: $("[name='userEmail']").val(),
        name: $("[name='userName']").val(),
        role: $("[name='userRole']").val(),
        permissions: JSON.stringify($("[name='userPermission']").val()),
        assigned_location: $("[name='location']").val(),
      };

      $.ajax({
        url: '/api',
        type: 'POST',
        data: {
          action: 'updateUser',
          userData: JSON.stringify(userData),
          conditionalColumn: 'email',
          whereIn: JSON.stringify([userData.email]),
          orgName: window.orgName,
        },
        dataType: 'json',
      }).done(function (response) {
        if (response.message === 'success') {
          window.ktDataTable.ajax.reload();
          toastr.success('', 'User updated!');
          $('#add-user').modal('toggle');
        }
      });
    } else {
      var userData = [
        $("[name='userEmail']").val(),
        $("[name='userName']").val(),
        $("[name='userRole']").val(),
        JSON.stringify($("[name='userPermission']").val()),
        $("[name='location']").val(),
        window.orgName,
      ];

      $.ajax({
        url: '/api',
        type: 'POST',
        data: {
          action: 'addUser',
          userData: JSON.stringify(userData),
          orgName: window.orgName,
        },
        dataType: 'json',
      }).done(function (response) {
        if (response.message === 'success') {
          window.ktDataTable.ajax.reload();
          toastr.success('', 'User added!');
          $('#add-user').modal('toggle');
        } else {
          var errMesage = response.message.split(':')[1];
          errMesage = errMesage || 'Some error occured!';
          if (errMesage.includes('Duplicate')) {
            errMesage = 'User already exists!';
          }
          toastr.error('', errMesage);
        }
      });
    }
  });

  $('#add-user').on('hidden.bs.modal', function () {
    UpdateUser = false;
    $('#addUserLabel').html('Add user');

    $('#add-user form')[0].reset();
  });

  $('#roles_select2').on('select2:select', function (e) {
    var selection = e.params.data.text;
    $.ajax({
      url: '/api',
      type: 'POST',
      data: {
        action: 'getRoleMappings',
        role: selection,
      },
      dataType: 'json',
    }).done(function (response) {
      if (response.message === 'success') {
        var options = JSON.parse(response.permissions)
          .map(
            (permission) =>
              '<option val="' + permission + '">' + permission + '</option>'
          )
          .join('');
        $('#permissions_select2').select2('destroy');
        $('#permissions_select2').html(options);
        $('#permissions_select2').select2();

        $('#permissions_select2').val(JSON.parse(response.permissions));
        $('#permissions_select2').trigger('change');
      }
    });
  });
  $('#admin_permissions_select2').select2();
  $('.table-users').on('click', '.edit-user', function (evt) {
    var id = $(this).closest('tr').children('td:first-child').html();

    $('#addUserLabel').html('Edit user');

    $.ajax({
      url: '/api',
      type: 'POST',
      data: {
        action: 'getUserByIdAjax',
        id: id,
        orgName: window.orgName,
      },
      dataType: 'json',
    }).done(function (response) {
      if (response.message === 'success') {
        $('#add-user').modal('toggle');

        $("[name='userEmail']").val(response.user.email).trigger('change');
        $("[name='userName']").val(response.user.name).trigger('change');
        $("[name='userRole']").val(response.user.role).trigger('change');

        var options = JSON.parse(response.user.permissions)
          .map(
            (permission) =>
              '<option val="' + permission + '">' + permission + '</option>'
          )
          .join('');
        $('#permissions_select2').select2('destroy');
        $('#permissions_select2').html(options);
        $('#permissions_select2').select2();

        $('#permissions_select2').val(JSON.parse(response.user.permissions));
        $('#permissions_select2').trigger('change');

        $("[name='location']")
          .val(response.user.assigned_location)
          .trigger('change');
        UpdateUser = true;
      }
    });
  });

  $('.table-users').on('click', '.delete-user', function (evt) {
    var id = $(this).closest('tr').children('td:first-child').html();
    $.ajax({
      url: '/api',
      type: 'POST',
      data: {
        action: 'deleteUsers',
        userIds: JSON.stringify([id]),
        orgName: window.orgName,
      },
      dataType: 'json',
    }).done(function (response) {
      if (response.message === 'success') {
        window.ktDataTable.ajax.reload();
        toastr.success('', 'User deleted!');
      } else {
        toastr.error('', 'Not able to delete user!');
      }
    });
  });



  function initUsersPage(settings) {
    if ('/users' === window.location.pathname) {
      window.ktDataTable.ajax.reload();

      if ($('#location_select2, #location_select2_validate')[0]) {
        try {
          var options = settings.userLocations
            .map(
              (loc) => '<option val="' + loc + '">' + loc + '</option>'
            )
            .join('');
        } catch (e) {
          var options = '';
        }
        $('#location_select2, #location_select2_validate').select2(
          'destroy'
        );
        $('#location_select2, #location_select2_validate').html(options);
        $('#location_select2, #location_select2_validate').select2({
          placeholder: 'Select location',
        });
      }
    }
  }


  /*----------------------------------------------------------------*/
  /*--- /centers----*/

  $('[name="centerTimeStart"], [name="centerTimeEnd"]').timepicker({
    minuteStep: 1,
    defaultTime: '',
    showSeconds: false,
    showMeridian: true,
    snapToStep: true
  });
  $('#center-submit').click(function () {
    if (UpdateCenter) {
      var centerData = {
        center_name: $("[name='centerName']").val(),
        concerned_person: $("[name='concernedPerson']").val(),
        phone: $("[name='phone']").val(),
        email: $("[name='email']").val(),
        timings: $("[name='centerTime']").val(),
        address: $("[name='address']").val(),
        google_map: $("[name='googleMaps']").val(),
      };

      $.ajax({
        url: '/api',
        type: 'POST',
        data: {
          action: 'updateCenter',
          centerData: JSON.stringify(centerData),
          conditionalColumn: 'center_id',
          whereIn: JSON.stringify([CurrentCenterEditId]),
          orgName: window.orgName,
        },
        dataType: 'json',
      }).done(function (response) {
        if (response.message === 'success') {
          window.ktDataTable.ajax.reload();
          toastr.success('', 'Center updated!');
          $('#add-center').modal('toggle');
        }
      });
    } else {
      var centerData = [
        $("[name='centerName']").val(),
        $("[name='concernedPerson']").val(),
        $("[name='phone']").val(),
        $("[name='email']").val(),
        $("[name='centerTime']").val(),
        $("[name='address']").val(),
        $("[name='googleMaps']").val(),
      ];

      $.ajax({
        url: '/api',
        type: 'POST',
        data: {
          action: 'insertCenters',
          centers: JSON.stringify([centerData]),
          orgName: window.orgName,
        },
        dataType: 'json',
      }).done(function (response) {
        if (response.message === 'success') {
          window.ktDataTable.ajax.reload();
          toastr.success('', 'Center added!');
          $('#add-center').modal('toggle');
        } else {
          var errMesage = response.message.split(':')[1];
          errMesage = errMesage || 'Some error occured!';
          if (errMesage.includes('Duplicate')) {
            errMesage = 'Center login already exists! Delete the associated email from users table first.';
          }
          toastr.error('', errMesage);
        }
      });
    }
  });


  $('#add-center').on('hidden.bs.modal', function () {
    UpdateCenter = false;
    $('#addCenterLabel').html('Add center');

    $('#add-center form')[0].reset();
  });

  $('.table-centers').on('click', '.edit-center', function (evt) {
    var id = $(this).closest('tr').children('td:first-child').html();

    $('#addCenterLabel').html('Edit center');
    var centerName = $(this).closest('tr').children('td:nth-child(3)').html(),
      concernedPerson = $(this).closest('tr').children('td:nth-child(4)').html(),
      phone = $(this).closest('tr').children('td:nth-child(5)').html(),
      email = $(this).closest('tr').children('td:nth-child(6)').html(),
      timings = $(this).closest('tr').children('td:nth-child(7)').html(),
      address = $(this).closest('tr').children('td:nth-child(8)').html(),
      googleMaps = $(this).closest('tr').find('td:nth-child(9) a').attr('href');

    $('#addCenterLabel').html('Edit center');

    $('#add-center').modal('toggle');


    $("[name='centerName']").val(centerName).trigger('change');
    $("[name='concernedPerson']").val(concernedPerson).trigger('change');
    $("[name='phone']").val(phone).trigger('change');
    $("[name='email']").val(email).trigger('change');
    $("[name='centerTime']").val(timings).trigger('change');
    $("[name='address']").val(address).trigger('change');
    $("[name='googleMaps']").val(googleMaps).trigger('change');

    UpdateCenter = true;
    CurrentCenterEditId = $(this).closest('tr').children('td:nth-child(2)').html();
  });


  $('.table-centers').on('click', '.delete-center', function (evt) {
    var id = $(this).closest('tr').children('td:first-child').html();
    var email = $(this).closest('tr').children('td:nth-child(6)').html();

    $.ajax({
      url: '/api',
      type: 'POST',
      data: {
        action: 'deleteCenters',
        centerIds: JSON.stringify([id]),
        email: JSON.stringify([email]),
        orgName: window.orgName,
      },
      dataType: 'json',
    }).done(function (response) {
      if (response.message === 'success') {
        window.ktDataTable.ajax.reload();
        toastr.success('', 'Center deleted!');
      } else {
        toastr.error('', 'Not able to delete center!');
      }
    });
  });


  function initCentersPage(settings) {
      window.ktDataTable.ajax.reload();
  }
  /*-------------------------------------------------------------------------*/

  /*--------/organisation----*/

  $('#org-submit').click(function () {
    if (UpdateOrg) {
      var orgName = $("[name='orgName']")
        .val()
        .toLowerCase()
        .split(' ')
        .join('_')
        .trim();

      var orgData = {
        org_name: orgName,
        admin_name: $("[name='adminName']").val(),
        admin_email: $("[name='adminEmail']").val(),
      };
      $.ajax({
        url: '/api',
        type: 'POST',
        data: {
          action: 'updateOrganisation',
          orgData: JSON.stringify(orgData),
          whereIn: JSON.stringify([orgName]),
          conditionalColumn: 'org_name',
        },
        dataType: 'json',
      }).done(function (response) {
        if (response.message === 'success') {
          window.ktDataTable.ajax.reload();
          $('#add-org').modal('toggle');
          toastr.success('', 'Organisation updated!');
        }
      });
    } else {
      var orgName = $("[name='orgName']")
        .val()
        .toLowerCase()
        .split(' ')
        .join('_')
        .trim();
      var userData = [
        $("[name='adminEmail']").val(),
        $("[name='adminName']").val(),
        'Admin',
        JSON.stringify($("[name='adminPermission']").val()),
        '',
        orgName,
      ];

      var orgData = [orgName,
        $("[name='adminName']").val(),
        $("[name='adminEmail']").val()];

      $.ajax({
        url: '/api',
        type: 'POST',
        data: {
          action: 'addOrganisation',
          userData: JSON.stringify(userData),
          orgData: JSON.stringify(orgData),
          orgName: orgName,
        },
        dataType: 'json',
      }).done(function (response) {
        if (response.message === 'success') {
          window.ktDataTable.ajax.reload();
          $('#add-org').modal('toggle');
          toastr.success('', 'Organisation created!');
        } else {
          var errMesage = response.message.split(':')[1];
          errMesage = errMesage.replace('org_name', 'Organisation name');
          errMesage = errMesage.replace(orgName, $("[name='orgName']").val());

          errMesage = errMesage || 'Some error occured!';
          toastr.error('', errMesage);
        }
      });
    }
  });

  $('.table-org').on('click', '.edit-org', function (evt) {
    var id = $(this).closest('tr').children('td:first-child').html(),
      orgName = $(this).closest('tr').children('td:nth-child(2)').html(),
      adminName = $(this).closest('tr').children('td:nth-child(3)').html(),
      adminEmail = $(this).closest('tr').children('td:nth-child(4)').html();

    $('#addOrgLabel').html('Edit organisation');

    $('#add-org').modal('toggle');

    $("[name='orgName']").val(orgName).trigger('change');
    $("[name='orgName']").attr('readonly', true);
    $("[name='adminName']").val(adminName).trigger('change');
    $("[name='adminEmail']").val(adminEmail).trigger('change');

    UpdateOrg = true;
  });

  $('.table-org').on('click', '.delete-org', function (evt) {
    var orgName = $(this).closest('tr').children('td:nth-child(2)').html()
      .toLowerCase()
      .split(' ')
      .join('_')
      .trim();
    $("[name='deleteOrgName']").val(orgName);
    $('#delete-org').modal('toggle');

  });

  $('#org-delete-confirm').click(function () {
    jQuery
      .ajax({
        url: 'api',
        type: "POST",
        data: {
          action: "deleteOrganisation",
          ownerPass: $("[name='deleteOrgPassword']").val(),
          orgName: $("[name='deleteOrgName']").val(),
        },
        dataType: "json",
      })
      .done(function (response) {
        if (response.message === 'success') {
          toastr.success('', 'Organisation deleted!')
          $('#delete-org').modal('toggle');
          window.ktDataTable.ajax.reload();

        } else {
          toastr.error('', response.message);
        }
      });
  })
  $('#add-org').on('hidden.bs.modal', function () {
    UpdateOrg = false;
    $('#addOrgLabel').html('Add organisation');
    $("[name='orgName']").attr('readonly', false);

    $('#add-org form')[0].reset();
  });
  function selectOrganisation() {
    jQuery
      .ajax({
        url: 'api',
        type: 'POST',
        data: {
          action: 'getOrganisations',
        },
        dataType: 'json',
      })
      .done(function (response) {
        var organisations = JSON.parse(response.result);
        var options = '';
        organisations.forEach((org) => {
          options +=
            '<option value="' +
            org.org_name +
            '">' +
            org.org_name +
            '</option>';
        });
        $('#org_filter_select2').append(options);
        $('#org_filter_select2').select2({
          placeholder: 'Select an organisation',
        });
        if (
          (window.location.pathname === '/centers' &&
            window.orgName === 'All') ||
          window.location.pathname === '/settings'
        ) {
          $('#org_filter_select2')
            .val('All')
            .trigger('change')
            .trigger('select2:select');

          initUserData();
        }
      });
  }
  if (window.selectOrganisationAccess) {
    selectOrganisation();
  }

  $('#org_filter_select2').on(
    'select2:select select2:unselect',
    function () {
      window.orgName = $(this).val();
      if (window.orgName === 'All') {
        $('.datatable-wrapper').addClass('d-none');
      } else {
        $('.datatable-wrapper').removeClass('d-none');
      }
      getStats();
      initUserData(dispatchBookingColumnsChangedEvent);
    }
  );

  /*----------------------------------------------------------------*/

  /*--settings--*/

  //Init booking table column field
  if ($('#booking-table-columns')[0]) {
    $('#booking-table-columns').select2({ multiple: true });
  }


  //Select All booking columns
  function selectAllBookingColumns(selectItem) {
    var selectItem = $('#booking-table-columns');
    var selectedItems = [];
    var allOptions = selectItem.children('option');
    allOptions.each(function () {
      selectedItems.push($(this).val());
    });

    selectItem.val(selectedItems).trigger('change');
  }

  // Select all mandatory booking columns.
  $('#booking-table-columns').on(
    'select2:select select2:unselect',
    function () {
      var selectItem = $(this);

      //Mandatory columns.
      selectItem
        .val([
          'custom_id',
          'ticket',
          'name',
          'email',
          'status',
          'service',
          'center_name',
          'booking_date',
          ...$(this).val(),
        ])
        .trigger('change');
    }
  );


  //On settings save.
  $('#settings-save').click(function () {
    var locVal = $('[name="userLocations"]').val();
    locVal = isJson(locVal) ? JSON.parse($('[name="userLocations"]').val()).map(
      (loc) => loc.value
    )
      : locVal.split(',');

    var settings = {
      allowedBookingColumnsKey: window.allBookingColumnsKey.filter((key) =>
        $('#booking-table-columns').select2('val').includes(key)
      ),
      bookingAutoNotification: $('[name="bookingAutoNotification"]').prop(
        'checked'
      ),
      bookingSlipAttach: $('[name="bookingSlipAttach"]').prop('checked'),
      slipHtml: btoa($('#slip_html').next().find('.note-editable').html()),
      bookingCreateEmail: btoa($('#booking_create_email').next().find('.note-editable').html()),
      userLocations: locVal,
    };
    new Promise((resolve, reject) => {
      if (
        document.querySelector('[name="orgLogo"]').files.length < 1 &&
        window.dashboardSettings &&
        window.dashboardSettings.orgLogo
      ) {
        resolve(window.dashboardSettings.orgLogo);
      } else if (document.querySelector('[name="orgLogo"]').files.length > 0) {
        getBase64(
          document.querySelector('[name="orgLogo"]').files[0],
          resolve,
          reject
        );
      } else {
        resolve('');
      }
    }).then((base64) => {
      settings.orgLogo = base64;
      jQuery
        .ajax({
          url: '/api',
          type: 'POST',
          data: {
            action: 'saveOrgSettings',
            settings: JSON.stringify(settings),
            orgName: window.orgName,
          },
          dataType: 'json',
        })
        .done(function (response) {
          toastr.success('', 'Settings saved!');
        });
    });
  });


  //Init bootstrap switch for auto notifications.
  $('[data-switch=true]').bootstrapSwitch();

  new KTImageInput('kt_image_2');
  //get base64 from image.
  function getBase64(file, resolve, reject) {
    if (file.size / 1000 > 100) {
      toastr.warning('', 'Image size must be less than 100KB');
      reject();
    }
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
      resolve(reader.result);
    };
    reader.onerror = function (error) {
      console.log('Error: ', error);
    };
  }

  //Init all settings using fetchedd data.
  function initSettings(settings) {
    //Fill settings
    $('#booking-table-columns')
      .val(settings.allowedBookingColumnsKey)
      .trigger('change');
    $('[name="bookingAutoNotification"]').prop(
      'checked',
      settings.bookingAutoNotification
    );
    
    window.bookingAutoNotification = settings.bookingAutoNotification;

    $('[name="bookingAutoNotification"]').trigger('change');
    $('[name="bookingSlipAttach"]').prop(
      'checked',
      settings.bookingSlipAttach
    );
    $('[name="bookingSlipAttach"]').trigger('change');
    $('.image-input-wrapper').css(
      'background-image',
      'url(' + settings.orgLogo + ')'
    );
    $('#slip_html').next().find('.note-editable').html(isBase64(settings.slipHtml) ? atob(settings.slipHtml) : '');
    $('#booking_create_email').next().find('.note-editable').html(isBase64(settings.bookingCreateEmail) ? atob(settings.bookingCreateEmail) : '');

    var userLocations = $('[name="userLocations"]');
    if (userLocations[0]) {
      var userLocationsVal = settings.userLocations
        ? settings.userLocations.join(',')
        : '';
      userLocations.val(userLocationsVal);

      new Tagify(userLocations[0]);
      $('.tagify').addClass('form-control');
    }

    window.dashboardSettings = settings;
    if(window.allowedBookingColumnsKey.join('') !==settings.allowedBookingColumnsKey.join('') ){
      window.allowedBookingColumnsKey = settings.allowedBookingColumnsKey;
      window.allowedBookingColumnsValue = settings.allowedBookingColumnsValue;
      
      dispatchBookingColumnsChangedEvent();
    }






    //Init logo
    $('.booking-slip-header img:nth-child(3)').attr(
      'src',
      settings.orgLogo
    );

  };


  function dispatchBookingColumnsChangedEvent(){
    if('/bookings'===window.location.pathname){
      var refreshBookingTableEvent = document.createEvent("Event");
      refreshBookingTableEvent.initEvent('bookingColumnsChanged', true, true);
      document.querySelector("body").dispatchEvent(refreshBookingTableEvent);
    }
  }


  function initUserData(callback=null){
    jQuery
      .ajax({
        url: '/api',
        type: 'post',
        data: {
          action: 'getOrgSettingsAjax',
          orgName: window.orgName,
        },
        dataType: 'json',
      })
      .done(function (response) {
        if (response.settings && response.settings.length > 10) {
          var settings = JSON.parse(response.settings);

          initSettings(settings);

          switch (window.location.pathname) {
            case '/centers':
              initCentersPage(settings);
              break;
            case '/settings':
            case '/bookings':
              initBookingsPage(settings);
              break;
            case '/users':
              initUsersPage(settings);
              break;
            default:
              break;
          }

          if(callback){
            callback();
          }

        } else {
          selectAllBookingColumns();
          $('[name="bookingAutoNotification"]').prop('checked', true);
          $('[name="bookingAutoNotification"]').trigger('change');
          $('[name="bookingSlipAttach"]').prop('checked', false);
          $('[name="bookingSlipAttach"]').trigger('change');
          $('.image-input-wrapper').css('background-image', 'url()');
          new Tagify($('[name="userLocations"]')[0]);
        }
      });
  }


  initUserData();


  //Init email field
  $('.summernote').summernote({
    height: 300,

  });

 /*----------------------------------------------------------------*/
  /*--Booking Date filter--*/
  $('#kt_datepicker input').on('change',function(){
      window.ktDataTable.ajax.reload();
  });
});
