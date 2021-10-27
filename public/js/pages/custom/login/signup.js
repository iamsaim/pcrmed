"use strict";

// Class Definition
var KTLogin = function() {
    var _login;

    var _showForm = function(form) {
        var cls = 'login-' + form + '-on';
        var form = 'kt_login_' + form + '_form';

        _login.removeClass('login-signup-on');

        _login.addClass(cls);

        KTUtil.animateClass(KTUtil.getById(form), 'animate__animated animate__backInUp');
    }




    function getQueryStringValue (key) {  
        return decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));  
    }  

    var _handleSignUpForm = function(e) {
        var validation;
        var form = KTUtil.getById('kt_login_signup_form');
        const strongPassword = function() {
            return {
                validate: function(input) {
                    const value = input.value;
                    if (value === '') {
                        return {
                            valid: true,
                        };
                    }
        
                    // Check the password strength
                    if (value.length < 8) {
                        return {
                            valid: false,
                        };
                    }
        
                    // The password does not contain any uppercase character
                    if (value === value.toLowerCase()) {
                        return {
                            valid: false,
                        };
                    }
        
                    // The password does not contain any uppercase character
                    if (value === value.toUpperCase()) {
                        return {
                            valid: false,
                        };
                    }
        
                    // The password does not contain any digit
                    if (value.search(/[0-9]/) < 0) {
                        return {
                            valid: false,
                        };
                    }
        
                    return {
                        valid: true,
                    };
                },
            };
        };
        // Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
        validation = FormValidation.formValidation(
			form,
			{
				fields: {
		
                    password: {
                        validators: {
                            notEmpty: {
                                message: 'The password is required'
                            },
                            checkPassword: {
                                message: 'The password length should be greater 8. It should contain an uppercase character and a digit.'
                            },
                        },
                    },
                   
                    cpassword: {
                        validators: {
                            notEmpty: {
                                message: 'The password confirmation is required'
                            },
                            identical: {
                                compare: function() {
                                    return form.querySelector('[name="password"]').value;
                                },
                                message: 'The password and its confirm are not the same'
                            }
                        }
                    },
                    agree: {
                        validators: {
                            notEmpty: {
                                message: 'You must accept the terms and conditions'
                            }
                        }
                    },
				},
                plugins: {
                    trigger: new FormValidation.plugins.Trigger(),
                    bootstrap: new FormValidation.plugins.Bootstrap(),
                
                }
		
			}
		).registerValidator('checkPassword', strongPassword);

        $('#kt_login_signup_submit').on('click', function (e) {
            e.preventDefault();

            validation.validate().then(function(status) {
		        if (status == 'Valid') {
                    $.ajax({
						url: "/change-password",
						type: "POST",
						data: {
							email: getQueryStringValue('email'),
                            token: getQueryStringValue('token'),
							password: $("[name='password']").val(),
						},
						dataType: "json",
					})
					.done(function (response) {
						if(response.message.toLowerCase()==="success"){
							swal.fire({
								text: response.message,
								icon: "success",
								buttonsStyling: false,
								confirmButtonText: "Signin",
								customClass: {
                                    confirmButton: "btn font-weight-bold btn-light-primary signin-redirect"
								}
							}).then(function() {
								KTUtil.scrollTop();
							});
						}else{
							swal.fire({
								text: response.message,
								icon: "error",
								buttonsStyling: false,
								confirmButtonText: "Ok, got it!",
								customClass: {
									confirmButton: "btn font-weight-bold btn-light-primary"
								}
							}).then(function() {
								KTUtil.scrollTop();
							});
						}
						
					});
         
				} else {
					swal.fire({
		                text: "Sorry, looks like there are some errors detected, please try again.",
		                icon: "error",
		                buttonsStyling: false,
		                confirmButtonText: "Ok, got it!",
                        customClass: {
    						confirmButton: "btn font-weight-bold btn-light-primary"
    					}
		            }).then(function() {
						KTUtil.scrollTop();
					});
				}
		    });
        });

        // Handle cancel button
        $('#kt_login_signup_cancel').on('click', function (e) {
            e.preventDefault();

            _showForm('signin');
        });
    }

  

      
    // Public Functions
    return {
        // public functions
        init: function() {
            _login = $('#kt_login');
            $('body').on("mousedown",".signin-redirect",function() {
                window.location = "/login";
            });

            _handleSignUpForm();
        }
    };
}();

// Class Initialization
jQuery(document).ready(function() {
    KTLogin.init();

});

