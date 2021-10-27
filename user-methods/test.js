// Quick and simple export target #table_id into a csv
function downloadTableAsCSV(table_id, separator = ",") {
  // Select rows from table_id
  var rows = document.querySelectorAll(
    "table#" + table_id + " thead tr , table#" + table_id + " tr.selected"
  );
  if (rows.length < 2) {
    return;
  }

  // Construct csv
  var csv = [];
  for (var i = 0; i < rows.length; i++) {
    var row = [],
      cols = rows[i].querySelectorAll(
        "td:not(:first-child):not(:nth-child(8)), th:not(:first-child):not(:nth-child(8))"
      );
    for (var j = 0; j < cols.length; j++) {
      // Clean innertext to remove multiple spaces and jumpline (break csv)
      var data = cols[j].innerText
        .replace(/(\r\n|\n|\r)/gm, "")
        .replace(/(\s\s)/gm, " ");
      // Escape double-quote with double-double-quote (see https://stackoverflow.com/questions/17808511/properly-escape-a-double-quote-in-csv)
      data = data.replace(/"/g, '""');
      // Push escaped string
      row.push('"' + data + '"');
    }
    csv.push(row.join(separator));
  }
  var csv_string = csv.join("\n");
  // Download it
  var filename =
    "export_" + table_id + "_" + new Date().toLocaleDateString() + ".csv";
  var link = document.createElement("a");
  link.style.display = "none";
  link.setAttribute("target", "_blank");
  link.setAttribute(
    "href",
    "data:text/csv;charset=utf-8," + encodeURIComponent(csv_string)
  );
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

jQuery(function () {
  var changeStatusFor,
    selectedApplication = "Amer services",
    channelHandle = "amer-online-services-2";
  /**
   * Intialiases the DataTable plugin
   *
   * @since 1.0.0
   * @return void
   */
  var table = jQuery("#application-table").DataTable({
    renderer: "bootstrap",

    preDrawCallback: function (settings) {
      jQuery("#application-table tbody").hide();
      var tbodyH = jQuery("#application-table tbody").css("height");
      tbodyH = parseInt(tbodyH.split("px")[0]) + 20;
      tbodyH = tbodyH.toString() + "px";
      jQuery("#dt-table-footer").css("marginTop", tbodyH);
    },

    drawCallback: function () {
      jQuery("#application-table tbody td").addClass("blurry");
      jQuery("#application-table tbody").fadeIn(300);
      jQuery("#dt-table-footer").css("marginTop", "20px");
      setTimeout(function () {
        jQuery("#application-table tbody td").removeClass("blurry");
      }, 200);
    },

    initComplete: function () {
      /* Shift search*/
      jQuery("#am-header").prepend(jQuery("#application-table_filter"));

      jQuery("#application-table_filter label").after(
        jQuery("input[type='search']")
      );
      jQuery("#application-table_filter  input[type='search']").attr(
        "placeholder",
        "Search"
      );
      jQuery("#application-table_filter label").replaceWith(
        '<button class="am-search-btn am-btn btn-sm">Search</button>'
      );

      var input = jQuery("#application-table_filter input").unbind();
      var searchButton = jQuery(".am-search-btn").click(function () {
        table.search(input.val()).draw();
      });
      jQuery(".am-clear-btn").click(function () {
        input.val("");
        jQuery(".am-filter-options input").attr("checked", false);
        jQuery(".am-filter-date input").val("");
        searchButton.click();
      });
      jQuery("#application-table_filter .select2-search__field").remove();
    },

    columnDefs: [
      {
        targets: 0,
        data: null,
        defaultContent: "",
        orderable: false,
        checkboxes: {
          selectRow: true,
        },
      },
      {
        targets: [0, 7],
        orderable: false,
      },
      {
        width: "10%",
        targets: 4,
      },
      {
        width: "20%",
        targets: 2,
      },
      {
        width: "20%",
        targets: 5,
      },
    ],
    select: {
      style: "multi",
      selector: "td:first-child",
    },
    processing: false,
    serverSide: true,
    ajax: {
      url: ajax_object.ajaxurl,
      data: function (data) {
        data.action = "get_applications";
        data.nonce = window.FETCH_NONCE;
        data.channel = channelHandle;
        data.filter = [];
        data.fromDate = "";
        data.toDate = "";
        if (jQuery("[name='am-filter-approved']").is(":checked")) {
          data.filter.push("approved");
        }
        if (jQuery("[name='am-filter-pending']").is(":checked")) {
          data.filter.push("pending");
        }
        if (jQuery("[name='am-filter-missing']").is(":checked")) {
          data.filter.push("document missing");
        }
        if (jQuery("[name='am-filter-progress']").is(":checked")) {
          data.filter.push("in progress");
        }
        if (jQuery("[name='am-filter-undefined']").is(":checked")) {
          data.filter.push("empty");
        }
        if (jQuery("#am-input-date-from").val().length > 0) {
          data.fromDate = jQuery("#am-input-date-from").val();
          /*          let dateArr = data.fromDate.split('-');
          dateArr = [dateArr[2],dateArr[1],dateArr[0]];
          data.fromDate = dateArr.join('-'); */
        }
        if (jQuery("#am-input-date-to").val().length > 0) {
          data.toDate = jQuery("#am-input-date-to").val();
          /*   let dateArr = data.fromDate.split('-');
          dateArr = [dateArr[2],dateArr[1],dateArr[0]];
          data.fromDate = dateArr.join('-'); */
        }
      },
    },
  });

  table.on("draw", function (event) {
    jQuery("#wpcontent").css('min-width',jQuery(this).width()+50+'px');
    /* Shift pagination*/
    jQuery("#application-table_paginate .previous").html(
      '<i class="fal fa-angle-double-left"></i>'
    );
    jQuery("#application-table_paginate .next").html(
      '<i class="fal fa-angle-double-right"></i>'
    );

    jQuery("#dt-table-footer .dt-pagination-wrapper").prepend(
      jQuery("#application-table_paginate")
    );
    jQuery("#dt-table-footer .dt-pagination-wrapper").append(
      jQuery("#application-table_info")
    );
    jQuery("[data-dt-idx='4']").remove();
    jQuery("[data-dt-idx='5']").remove();
    jQuery("#dt-table-footer .dt-pagination-wrapper").after(
      jQuery("#application-table_length")
    );

    jQuery("#application-table_wrapper").append(jQuery("#dt-table-footer"));

    /*On checkbox click*/

    jQuery(".dt-checkboxes-cell, .dt-checkboxes-cell input").off("click");
    jQuery(".dt-checkboxes-cell, .dt-checkboxes-cell input").on(
      "click",
      function () {
        setTimeout(function () {
          if (jQuery("#application-table tr.selected").length > 0) {
            jQuery(".am-export").removeClass("am-disabled-btn");
            jQuery(".assign").removeClass("am-disabled-btn");
            jQuery(".am-delete").removeClass("am-disabled-btn");
            jQuery(".notify-now").removeClass("am-disabled-btn");
          } else {
            jQuery(".am-export").addClass("am-disabled-btn");
            jQuery(".assign").addClass("am-disabled-btn");
            jQuery(".am-delete").addClass("am-disabled-btn");
            jQuery(".notify-now").addClass("am-disabled-btn");
          }
        }, 10);
      }
    );
    jQuery(".status-wrapper i").off("click");
    /*Change status*/
    jQuery(".status-wrapper i").on("click", function (event) {
      event.stopPropagation();
      jQuery(".am-pop-status-wrapper").css("display", "flex");
      jQuery("body").css("overflow", "hidden");
      changeStatusFor = jQuery(this).prev();
      setTimeout(function () {
        jQuery(".am-pop-status-wrapper").css("opacity", "1");
      }, 50);
    });

    /**On comment */
    jQuery(".am-comment").off();
    jQuery(".am-comment").on(
      "keyup",
      debounce(function () {
        var applicationMeta = { am_comment: jQuery(this).val() };
        var postId = jQuery(this)
          .closest("tr")
          .find(".am-ticket-class")
          .attr("data-id");

        updateApplicationMeta(applicationMeta, [postId]);
      }, 500)
    );
    jQuery(".comment-wrapper textarea").off("click");
    jQuery(".comment-wrapper textarea").on("click", function (event) {
      event.stopPropagation();
      jQuery(this)[0].removeAttribute("readonly");
      jQuery(this).css("border", "1px solid #aaa");
    });
    jQuery(".comment-wrapper textarea").click(function (event) {
      event.stopPropagation();
    });


  jQuery(".download-attachments").off();
  jQuery(".download-attachments").on(
    "click",
    downloadAttachments
  );

  });

  function downloadAttachments(event) {
    event.stopPropagation();
    var postId = jQuery(this).attr("data-id");

    jQuery
      .ajax({
        url: ajax_object.ajaxurl,
        type: "GET",
        data: {
          action: "download_attachments",
          channel: channelHandle,
          postId: postId,
          nonce: window.GetAttachNonce,
        },
        dataType: "text",
      })
      .done(function (response) {
        if (response === "Unwritable") {
          alert(
            "Couldn't create zip archive, the directory `plugins/amer-applications-manager/downloads` is unwritable."
          );
        } else if (response === "failed") {
          alert("Failed to create zip archive");
        } else {
          window.open(response, "_blank");
        }
      });
  }

  jQuery(window).click(function () {
    jQuery(".am-comment").attr("readonly", "readonly");
  });

  jQuery(".am-export").click(function () {
    downloadTableAsCSV("application-table");
  });


  jQuery(".notify-applicant").click(function (event) {
    event.stopPropagation();
    jQuery(".notify-applicant .dropdownContain").css({
      top: "40px",
      opacity: "1",
    });
  });
  jQuery(".am-filter").click(function (event) {
    event.stopPropagation();
    jQuery(".am-filter .dropdownContain").css({
      top: "40px",
      opacity: "1",
    });
  });
  jQuery(".am-application-type ").click(function (event) {
    event.stopPropagation();
    jQuery(".am-application-type  .dropdownContain").css({
      top: "40px",
      opacity: "1",
    });
  });

  jQuery(window).click(function () {
    setTimeout(function () {
      jQuery(".dropdownContain").css("top", "-400000px");
    }, 300);
    jQuery(".dropdownContain").css("opacity", "0");
  });

  jQuery(".am-status-cancel").click(function () {
    jQuery(".am-pop-status-wrapper").css("opacity", "0");
    setTimeout(function () {
      jQuery(".am-pop-status-wrapper").css("display", "none");
      jQuery("body").css("overflow", "auto");
    }, 250);
  });

  /*Assignee*/
  jQuery(".assign").click(function () {
    if (jQuery("#application-table tr.selected").length > 0) {
      jQuery(".am-pop-assignee-wrapper").css("display", "flex");
      jQuery("body").css("overflow", "hidden");
      setTimeout(function () {
        jQuery(".am-pop-assignee-wrapper").css("opacity", "1");
      }, 50);
    }
  });

  jQuery(".am-assignee-ok").click(function () {
    var selected = jQuery("#application-table tr.selected");
    var postIds = [];
    if (selected.length > 0) {
      var name = jQuery(".am-assignee-name .select2").val().join(", ");

      selected.each(function (idx, user) {
        var postId = jQuery(user).find(".am-ticket-class").attr("data-id");
        postIds = [...postIds, postId];
        if (name.length > 0) {
          jQuery(user).children("td:nth-child(9)").html(name);
        }
      });

      if (name.length > 0) {
        updateApplicationMeta({ am_assignee: name }, postIds);
      }
      jQuery(".am-pop-assignee-wrapper").css("opacity", "0");
      setTimeout(function () {
        jQuery(".am-pop-assignee-wrapper").css("display", "none");
        jQuery("body").css("overflow", "auto");
      }, 250);
    }
  });

  jQuery(".am-assignee-cancel").click(function () {
    jQuery(".am-pop-assignee-wrapper").css("opacity", "0");
    setTimeout(function () {
      jQuery(".am-pop-assignee-wrapper").css("display", "none");
      jQuery("body").css("overflow", "auto");
    }, 250);
  });

  /*Delete*/
  jQuery(".am-delete").click(function () {
    if (jQuery("#application-table tr.selected").length > 0) {
      jQuery(".am-pop-delete-wrapper").css("display", "flex");
      jQuery("body").css("overflow", "hidden");
      setTimeout(function () {
        jQuery(".am-pop-delete-wrapper").css("opacity", "1");
      }, 50);
    }
  });
  jQuery(".am-delete-yes").click(function () {
    var selected = jQuery("#application-table tr.selected");
    var postIds = new Array();
    if (selected.length > 0) {
      selected.each(function (idx, user) {
        let postId = jQuery(user).find(".am-ticket-class").attr("data-id");
        postIds = [...postIds, postId];
      });

      jQuery
        .ajax({
          url: ajax_object.ajaxurl,
          type: "POST",
          data: {
            action: "delete_am_posts",
            nonce: window.DeleteAmPosts,
            post_ids: postIds,
          },
          dataType: "json",
        })
        .done(function (response) {});
      selected.remove();
      jQuery(".am-pop-delete-wrapper").css("opacity", "0");
      setTimeout(function () {
        jQuery(".am-pop-delete-wrapper").css("display", "none");
        jQuery("body").css("overflow", "auto");
      }, 250);
    }
  });

  jQuery(".am-delete-no").click(function () {
    jQuery(".am-pop-delete-wrapper").css("opacity", "0");
    setTimeout(function () {
      jQuery(".am-pop-delete-wrapper").css("display", "none");
      jQuery("body").css("overflow", "auto");
    }, 250);
  });

  function sendStatusChangeEmail(users) {
    jQuery
      .ajax({
        url: ajax_object.ajaxurl,
        type: "POST",
        data: {
          action: "status_change_mail_sender",
          nonce: window.StatusSendNonce,
          users: JSON.stringify(users),
        },
        dataType: "json",
      })
      .done(function (response) {});
  }

  jQuery(".notify-now").on("click", function () {
    var selected = jQuery("#application-table tr.selected");
    var users = new Array();
    if (selected.length > 0) {
      selected.each(function (idx, user) {
        let ticket = jQuery(this).find("td:nth-child(2) span").html();
        let email = jQuery(this).children("td:nth-child(4)").html();
        let currentStatus = jQuery(this).find(".am-status span").html();

        users = [
          ...users,
          {
            email,
            ticket,
            current_status: currentStatus,
            application_type: selectedApplication,
          },
        ];
      });

      sendStatusChangeEmail(users);
    }
  });

  function updateSettings(settings) {
    jQuery
      .ajax({
        url: ajax_object.ajaxurl,
        type: "POST",
        data: {
          action: "update_am_settings",
          nonce: window.UpdateSettingsNonce,
          settings: JSON.stringify(settings),
        },
        dataType: "json",
      })
      .done(function (response) {
        if (response === "success") {
          getSettings();
        }
      });
  }

  function getSettings(settings) {
    jQuery
      .ajax({
        url: ajax_object.ajaxurl,
        type: "GET",
        data: {
          action: "get_am_settings",
          nonce: window.GetSettingsNonce,
        },
        dataType: "json",
      })
      .done(function (response) {
        if (response.message === "success") {
          if (response.auto_notify === "1") {
            jQuery(".auto-notify input").attr("checked", true);
          } else {
            jQuery(".auto-notify input").attr("checked", false);
          }
        }
      });
  }

  getSettings();

  jQuery(".auto-notify .slider").on("click", function () {
    var setting = jQuery(".auto-notify input").is(":checked");

    updateSettings({ am_notify: setting ? 0 : 1 });
  });

  jQuery(".am-status-ok").on("click", function () {
    var status = jQuery("[name='am-selected-status']:checked").val(),
      missingDocs = "";
    let currentStatus = "";
    var el =
      "<div class='am-status status-undefined '><span>Empty</span></div>";
    if ("pending" === status) {
      el = "<div class='am-status status-yellow'><span>Pending</span></div>";
      currentStatus = "Pending";
    } else if ("approved" === status) {
      el =
        "<div class='am-status status-green'><span>Approved</span></div></div>";
      currentStatus = "Approved";
    } else if ("document missing" === status) {
      el = "<div class='am-status status-red'><span>Doc missing</span> </div>";
      missingDocs = jQuery("#doc-type").val();
      if (missingDocs.length < 1) {
        return;
      }
      currentStatus = "Documents missing";
    } else if ("in progress" === status) {
      el = " <div class='am-status status-blue'><span>In progress</span></div>";
      currentStatus = "In progress";
    }

    var applicationMeta = { am_status: status };
    var postId = changeStatusFor
      .closest("tr")
      .find(".am-ticket-class")
      .attr("data-id");
    var application = changeStatusFor.closest("tr");
    let ticket = jQuery(application).find("td:nth-child(2) span").html();
    let email = jQuery(application).children("td:nth-child(4)").html();
    var users = [
      {
        email,
        ticket,
        current_status: currentStatus,
        application_type: selectedApplication,
        missing_docs: missingDocs ? missingDocs : "",
      },
    ];
    updateApplicationMeta(applicationMeta, [postId], users);
    if (status === "document missing") {
      applicationMeta = { am_missing: missingDocs };
      updateApplicationMeta(applicationMeta, [postId], users);
    }
    changeStatusFor.replaceWith(el);

    jQuery(".am-pop-status-wrapper").css("opacity", "0");
    setTimeout(function () {
      jQuery(".am-pop-status-wrapper").css("display", "none");
      jQuery("body").css("overflow", "auto");
    }, 250);
  });

  jQuery("[name='am-selected-status']").on("click", function () {
    var status = jQuery("[name='am-selected-status']:checked").val();
    if (status === "document missing") {
      jQuery(".am-doc-type").css("display", "block");
    } else {
      jQuery(".am-doc-type").css("display", "none");
    }
  });

  function updateApplicationMeta(applicationMeta, postIds, users = []) {
    jQuery
      .ajax({
        url: ajax_object.ajaxurl,
        type: "POST",
        data: {
          action: "update_application_meta",
          nonce: window.UpdateMetaNonce,
          am_meta: JSON.stringify(applicationMeta),
          post_ids: postIds,
        },
        dataType: "json",
      })
      .done(function (response) {
        if (response.am_status) {
          sendStatusChangeEmail(users);
        }
      });
  }

  function debounce(func, wait, immediate) {
    var timeout;
    return function () {
      var context = this,
        args = arguments;
      var later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  function getStats(applicationType) {
    jQuery
      .ajax({
        url: ajax_object.ajaxurl,
        type: "GET",
        data: {
          action: "get_am_stats",
          application_type: applicationType,
          nonce: window.GetStatsNonce,
        },
        dataType: "json",
      })
      .done(function (response) {
        if (response.message === "success") {
          jQuery("#am-stats .am-today-stat").html(response.today);
          jQuery("#am-stats .am-week-stat").html(response.week);
          jQuery("#am-stats .am-month-stat").html(response.month);
        }
      });
  }

  getStats(channelHandle);
  setInterval(function () {
    getStats(channelHandle);
  }, 10000);

  function getAllStats() {
    jQuery
      .ajax({
        url: ajax_object.ajaxurl,
        type: "GET",
        data: {
          action: "get_am_all_stats",
          nonce: window.GetStatsNonce,
        },
        dataType: "json",
      })
      .done(function (response) {
        if (response.message === "success") {
          var nth=1;

          response.data.forEach((stat,idx) => {
            jQuery("#am-all-stats>div:nth-child("+nth+")").find(".am-today-stat").html(stat.today);
            jQuery("#am-all-stats>div:nth-child("+(nth+1)+")").find(".am-week-stat").html(stat.week);
            jQuery("#am-all-stats>div:nth-child("+(nth+2)+")").find(".am-month-stat").html(stat.month);
            nth+=3;
          });
        
        }
      });
  }

  function hideElement(el) {
    jQuery(el).css("opacity", 0);
    setTimeout(function () {
      jQuery(el).css("display", "none");
    }, 200);
  }

  function showElement(el,display="block") {
    jQuery(el).css("display", display);
    setTimeout(function () {
      jQuery(el).css("opacity", 1);
    }, 20);
  }
  function drawApplicantInfo(response) {
    for (prop in response.details) {
      if (!response.details[prop] || response.details[prop].length < 1 || prop==='id') {
        continue;
      }
      var title = prop.split("_").join(" ");
      title = title.slice(0, 1).toUpperCase() + title.slice(1);
      jQuery(".applicant-info").append(
        '<div class="row am-row" data-title="'+prop+'"><div class="col-5 am-field-title"><span>' +
          title +
          "</span> </div>" +
          '<div class="col-7 am-field-info"><span>' +
          response.details[prop] +
          "</span></div></div>"
      );
    }
    showElement(".applicant-info");
    jQuery(".applicant-info .download-attachments").on(
      "click",
      downloadAttachments
    );
  }

  jQuery(".am-info-close").click(function () {
    hideElement(".applicant-info");
    showElement(".application-table");

    jQuery(".am-row").remove();
  });

  table.on("draw", function (event) {
    jQuery("#application-table tbody tr td:not(:first-child)").click(function () {
      var postId = jQuery(this).parent().find(".am-ticket-class").attr("data-id");

      jQuery
        .ajax({
          url: ajax_object.ajaxurl,
          type: "GET",
          data: {
            action: "get_application_info",
            nonce: window.ApplicationInfoNonce,
            post_id: postId,
          },
          dataType: "json",
        })
        .done(function (response) {
          if (response.message === "success") {
            hideElement(".application-table");
            drawApplicantInfo(response);
          }
        });
    });

   
  });
var allStatsHandle;
  jQuery(".am-application-select").click(function () {
    channelHandle = jQuery(this).attr("data-channel");
    if(channelHandle==='all-stats'){
      hideElement("#application-table_wrapper,#am-stats");
      showElement("#am-all-stats","flex");
      allStatsHandle= setInterval(getAllStats,10000);
      getAllStats();
    }else{
      clearInterval(allStatsHandle);
      showElement("#application-table_wrapper");
      showElement("#am-stats","flex");
      hideElement("#am-all-stats");
    }
    var title = jQuery(this).attr("data-name");
    jQuery(".am-application-type span").html(title);
    table.ajax.reload();
    getStats(channelHandle);
    if (
      channelHandle === "emirates-id" ||
      channelHandle === "dha" ||
      channelHandle === "inquiry-missing"
    ) {
      table.column(5).visible(false);
    } else {
      table.column(5).visible(true);
    }

    setTimeout(function () {
      jQuery(".dropdownContain").css("top", "-400000px");
    }, 300);
    jQuery(".dropdownContain").css("opacity", "0");
  });

  jQuery(".select2").select2({
    width: "resolve",
  });

  jQuery("#collapse-button")[0].click();
});
